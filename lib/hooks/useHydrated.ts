import { useSyncExternalStore } from "react";

// Returns false on server and during SSR, true after client hydration.
// Unlike useState+useEffect, this never triggers an extra re-render.
const subscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,   // client snapshot
    () => false,  // server snapshot
  );
}
