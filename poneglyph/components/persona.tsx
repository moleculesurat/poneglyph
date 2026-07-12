"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Persona = "broker" | "inspector";

const PersonaContext = createContext<{
  persona: Persona;
  setPersona: (p: Persona) => void;
}>({ persona: "broker", setPersona: () => {} });

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>("broker");
  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      <div data-persona={persona} style={{ display: "contents" }}>
        {children}
      </div>
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
