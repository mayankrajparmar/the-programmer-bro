// The auth feature's entry for src/proxy.ts. Kept apart from index.ts so the proxy bundle
// doesn't pull in React components or Server Actions.
export { updateAdminSession } from "./server/proxy";
