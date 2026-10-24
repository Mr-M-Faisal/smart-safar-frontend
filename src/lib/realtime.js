const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
const listeners = new Map();
const busReferences = new Map();
let socket = null;
let socketFactory = null;
let socketFactoryPromise = null;
let referenceCount = 0;
let sessionToken = null;
let hiddenDisconnectTimer = null;

function emitLocal(name, detail) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(name, { detail }));
}

function notify(event, payload) {
  for (const subscription of listeners.get(event) || []) {
    if (subscription.busId && String(payload?.busId) !== String(subscription.busId)) continue;
    subscription.callback(payload);
  }
}

function ensureSocket(token = null) {
  if (token && token !== sessionToken) {
    sessionToken = token;
    if (socket?.connected) {
      socket.auth = { token };
      socket.disconnect();
    }
  }
  if (!socketFactory) {
    if (!socketFactoryPromise) {
      socketFactoryPromise = import("socket.io-client").then((module) => {
        socketFactory = module.io;
        socketFactoryPromise = null;
        ensureSocket(sessionToken);
      }).catch((error) => {
        socketFactoryPromise = null;
        emitLocal("smart-safar:socket-status", { connected: false, reason: error?.message || "socket-load-failed" });
      });
    }
    return null;
  }
  if (!socket) {
    socket = socketFactory(apiOrigin, {
      autoConnect: false,
      transports: ["websocket"],
      auth: sessionToken ? { token: sessionToken } : {},
      reconnection: true,
      reconnectionDelay: 700,
      reconnectionDelayMax: 12000,
      randomizationFactor: 0.5,
    });
    socket.on("connect", () => {
      for (const [busId, count] of busReferences) if (count > 0) socket.emit("watchBus", busId);
      if (listeners.get("bookingStatusUpdate")?.length && sessionToken) socket.emit("watchPassengerBookings", { token: sessionToken });
      if (listeners.get("driverSeatStateUpdate")?.length && sessionToken) socket.emit("watchDriverBookings", { token: sessionToken });
      emitLocal("smart-safar:socket-status", { connected: true });
    });
    socket.on("disconnect", (reason) => emitLocal("smart-safar:socket-status", { connected: false, reason }));
    socket.on("connect_error", (error) => emitLocal("smart-safar:socket-status", { connected: false, reason: error?.message || "connect-error" }));
    socket.onAny(notify);
  }
  if (!socket.connected && !socket.active) socket.connect();
  return socket;
}

function add(event, callback, { busId = null, token = null, bookingRoom = null } = {}) {
  const subscription = { callback, busId: busId == null ? null : String(busId) };
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(subscription);
  referenceCount += 1;
  const shared = ensureSocket(token);
  if (busId != null) {
    const key = String(busId);
    const count = busReferences.get(key) || 0;
    busReferences.set(key, count + 1);
    if (count === 0 && shared?.connected) shared.emit("watchBus", key);
  }
  if (bookingRoom && shared?.connected) shared.emit(bookingRoom, { token });
  clearTimeout(hiddenDisconnectTimer);
  return () => {
    const current = listeners.get(event) || [];
    const index = current.indexOf(subscription);
    if (index >= 0) current.splice(index, 1);
    if (current.length === 0) listeners.delete(event);
    referenceCount = Math.max(0, referenceCount - 1);
    if (busId != null) {
      const key = String(busId);
      const count = (busReferences.get(key) || 1) - 1;
      if (count <= 0) {
        busReferences.delete(key);
        if (socket?.connected) socket.emit("unwatchBus", key);
      } else busReferences.set(key, count);
    }
    if (event === "bookingStatusUpdate" && !listeners.has(event) && socket?.connected) socket.emit("unwatchPassengerBookings");
    if (event === "driverSeatStateUpdate" && !listeners.has(event) && socket?.connected) socket.emit("unwatchDriverBookings");
    if (referenceCount === 0) {
      socket?.disconnect();
      sessionToken = null;
    }
  };
}

export function subscribeBus(busId, handlers = {}, { token = null } = {}) {
  if (!busId) return () => {};
  const cleanups = Object.entries(handlers).map(([event, callback]) => add(event, callback, { busId, token }));
  return () => cleanups.forEach((cleanup) => cleanup());
}

export function subscribePassengerBookings(token, handlers = {}) {
  const cleanups = Object.entries(handlers).map(([event, callback]) => add(event, callback, { token, bookingRoom: "watchPassengerBookings" }));
  return () => cleanups.forEach((cleanup) => cleanup());
}

export function subscribeDriverBookings(token, handlers = {}) {
  const cleanups = Object.entries(handlers).map(([event, callback]) => add(event, callback, { token, bookingRoom: "watchDriverBookings" }));
  return () => cleanups.forEach((cleanup) => cleanup());
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    clearTimeout(hiddenDisconnectTimer);
    if (document.visibilityState === "hidden" && referenceCount > 0) {
      hiddenDisconnectTimer = window.setTimeout(() => socket?.disconnect(), 60_000);
    } else if (document.visibilityState === "visible" && referenceCount > 0) {
      ensureSocket(sessionToken);
      emitLocal("smart-safar:realtime-resume", {});
    }
  });
}
