"use client";
/* Pending-review queue — every draft awaiting a decision, from /api/state,
   decided with the console's own GateCard. A decided draft leaves the list
   on the refetch after the POST, so nothing here tracks outcomes. */
import { useCallback, useEffect, useState } from "react";
import { Chip } from "@/components/ui";
import type { Obligation } from "@/lib/schema";
import { apiCall, type StateResponse } from "./api";
import { GateCard, OFFICER } from "./LiveConsole";
import { MonoBtn, Notice } from "./parts";

export function PendingQueue() {
  const [pending, setPending] = useState<Obligation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setBusy(true);
      const state = await apiCall<StateResponse>("/api/state");
      setPending(
        state.obligations
          .filter((o) => o.status === "pending-review")
          .sort((a, b) => a.id.localeCompare(b.id)),
      );
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function decide(o: Obligation, decision: "approve" | "reject") {
    setDecidingId(o.id);
    setError(null);
    try {
      await apiCall(`/api/obligations/${o.id}/decision`, {
        method: "POST",
        body: { decision, officer: OFFICER.name },
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDecidingId(null);
    }
  }
  return (
    <section className="stack" style={{ gap: 18, marginTop: 44 }}>
      <div className="row between wrap" style={{ gap: 14 }}>
        <div className="stack" style={{ gap: 6 }}>
          <span className="mono-label dim">05 · pending review</span>
          <h2 className="display" style={{ fontSize: 24 }}>
            Awaiting <span className="accent grad">decision</span>
          </h2>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <Chip tone="info">{pending.length} pending</Chip>
          <MonoBtn onClick={() => void load()} disabled={busy}>
            {busy ? "loading…" : "refresh"}
          </MonoBtn>
        </div>
      </div>
      {error ? <Notice tone="attention">{error}</Notice> : null}
      {pending.length === 0 ? (
        <span className="small dim">No drafts awaiting decision.</span>
      ) : (
        pending.map((o) => (
          <div key={o.id} className="stack" style={{ gap: 8 }}>
            <span className="mono-label dim" style={{ fontSize: 9.5 }}>
              {o.clause.circularId} · para {o.clause.para} · {o.createdByRun}
            </span>
            <GateCard
              obligation={o}
              decided={undefined}
              busy={decidingId === o.id}
              disabled={false}
              onDecide={(decision) => void decide(o, decision)}
            />
          </div>
        ))
      )}
    </section>
  );
}
