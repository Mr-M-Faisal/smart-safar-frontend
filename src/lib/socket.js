import { io } from "socket.io-client";

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export function createTransitSocket(options = {}) {
  return io(apiOrigin, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    ...options,
  });
}
