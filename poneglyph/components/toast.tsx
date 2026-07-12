"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const ToastContext = createContext<(msg?: string) => void>(() => {});

/** Fire the sandbox toast from any client component:
 *  const toast = useSandboxToast(); … onClick={() => toast()} */
export function useSandboxToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const push = useCallback((msg?: string) => {
    const id = Date.now() + Math.random();
    const text = msg ?? "Sandbox — this action is disabled in the demo";
    setToasts((t) => [...t.slice(-2), { id, msg: text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 22,
          right: 22,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="mono-label"
            style={{
              background: "var(--ink)",
              color: "var(--white)",
              padding: "12px 18px",
              borderRadius: "6px 6px 22px 6px",
              boxShadow: "0 18px 40px -12px rgba(20,20,23,0.45)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 16,
                height: 8,
                borderRadius: 2,
                background: "var(--orange)",
                flex: "none",
              }}
            />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
