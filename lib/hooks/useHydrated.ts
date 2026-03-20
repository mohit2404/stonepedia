"use client";

import * as React from "react";
import { useAuthStore } from "@/lib/store/authStore";

export function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(useAuthStore.persist.hasHydrated());
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => unsub();
  }, []);

  return hydrated;
}
