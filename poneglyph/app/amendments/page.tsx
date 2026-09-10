import Link from "next/link";
import { PageHead } from "@/components/ui";
import { SEBI_DOMAINS } from "@/lib/domains";

export default function Amendments() {
  return (
    <>
      <PageHead
        eyebrow="Amendment diff"
        title={
          <>
            Amendment <span className="accent grad">Redline</span>
          </>
        }
        sub={
          <>
            No amendment has been ingested yet. The corpus holds{" "}
            {SEBI_DOMAINS.map((d) => d.title).join(" and ")}. When SEBI reissues either master
            circular, the watchtower catches it and opens a pipeline run; only the changed
            paragraphs are re-extracted, re-verified and put to the human gate, and the change
            appears here.
          </>
        }
      />
      <div className="panel pad">
        <p className="clause-text" style={{ maxWidth: "80ch" }}>
          Nothing to diff. This page fills in the moment a reissued circular clears the
          watchtower.{" "}
          <Link href="/watchtower" className="mono-label" style={{ color: "var(--orange-deep)" }}>
            See the watchtower →
          </Link>
        </p>
      </div>
    </>
  );
}
