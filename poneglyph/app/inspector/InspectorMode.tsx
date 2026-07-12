"use client";

/* Landing on /inspector switches the session persona to "inspector" so the
   chrome collapses to the read-only tab set. No UI of its own. */

import { useEffect } from "react";
import { usePersona } from "@/components/persona";

export function InspectorMode() {
  const { persona, setPersona } = usePersona();
  useEffect(() => {
    if (persona !== "inspector") setPersona("inspector");
  }, [persona, setPersona]);
  return null;
}
