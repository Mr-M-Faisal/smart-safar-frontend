export const demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

let demoDataPromise;
export function loadDemoData() {
  if (!demoModeEnabled) return Promise.resolve(null);
  demoDataPromise ||= import("@/data/demo/faisalabad-demo");
  return demoDataPromise;
}
