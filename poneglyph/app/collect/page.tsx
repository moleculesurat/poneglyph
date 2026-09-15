import Link from "next/link";
import { PageHead, StatTile, Chip, Hairline } from "@/components/ui";
import { catalogue } from "@/data/catalogue";
import { companyDocuments, companyDocumentsSeeded, documentRequirements } from "@/data/documents";
import { tenant } from "@/data/tenant";
import type { DocumentKind } from "@/lib/schema";

/* ── derived, all from static data (module 5 makes "supplied" live) ─────── */

const reqById = new Map(documentRequirements.map((r) => [r.id, r]));

/* every ask id that has at least one document supplied against it */
const suppliedAskIds = new Set<string>();
for (const d of [...companyDocuments, ...companyDocumentsSeeded]) {
  if (d.requirementId) suppliedAskIds.add(d.requirementId);
  for (const id of d.requirementIds ?? []) suppliedAskIds.add(id);
}

const isSupplied = (k: DocumentKind): boolean => k.askIds.some((id) => suppliedAskIds.has(id));

/* distinct refresh cadences of a kind's asks, or "on file" when none carry one */
const cadencesOf = (k: DocumentKind): string[] => {
  const seen = [
    ...new Set(k.askIds.map((id) => reqById.get(id)?.refreshCadence).filter(Boolean)),
  ] as string[];
  return seen.length > 0 ? seen : ["on file"];
};

const suppliedKinds = catalogue.filter(isSupplied).length;

/* folders in sheet order (kinds are grouped by folder in the catalogue) */
const folders = [...new Set(catalogue.map((k) => k.folder))];

export default function CollectPage() {
  return (
    <>
      <PageHead
        eyebrow={`Document catalogue · ${tenant.name}`}
        title={
          <>
            What to <span className="accent grad">collect</span>
          </>
        }
        sub={`${catalogue.length} document kinds cover the ${documentRequirements.length} asks the register raises. Put each PDF in the folder named here; the vault reads it against every ask the kind covers.`}
      />

      {/* ── the ledger ── */}
      <div className="grid cols-3" style={{ marginBottom: 26 }}>
        <StatTile label="Kinds" value={catalogue.length} hint={`${folders.length} folders`} />
        <StatTile
          label="Asks covered"
          value={documentRequirements.length}
          hint="every register ask, once"
        />
        <StatTile
          label="Kinds with something supplied"
          value={suppliedKinds}
          accent
          hint={`${catalogue.length - suppliedKinds} with nothing yet`}
        />
      </div>

      {/* ── one section per folder ── */}
      {folders.map((folder) => {
        const kinds = catalogue.filter((k) => k.folder === folder);
        return (
          <section key={folder} style={{ marginBottom: 30 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <span className="eyebrow">{folder}</span>
              <span className="mono-label dim">{kinds.length} kinds</span>
            </div>

            <div className="stack" style={{ gap: 10 }}>
              {kinds.map((k) => {
                const supplied = isSupplied(k);
                return (
                  <article key={k.id} className="panel" style={{ padding: "16px 18px" }}>
                    <div className="row between wrap" style={{ gap: 10 }}>
                      <div className="row wrap" style={{ gap: 8, alignItems: "baseline", minWidth: 0 }}>
                        <span className="mono-label dim" style={{ fontSize: 9.5 }}>
                          {k.id}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14.5 }}>{k.name}</span>
                      </div>
                      <Chip tone={supplied ? "met" : "gap"}>{supplied ? "supplied" : "nothing yet"}</Chip>
                    </div>

                    <p className="small dim60" style={{ marginTop: 8, lineHeight: 1.55, maxWidth: "92ch" }}>
                      {k.what}
                    </p>

                    <div
                      className="row wrap"
                      style={{ gap: 8, marginTop: 12, alignItems: "center" }}
                    >
                      <span className="mono-label dim">{k.askIds.length} asks</span>
                      {cadencesOf(k).map((c) => (
                        <Chip key={c} tone="info">
                          {c}
                        </Chip>
                      ))}
                      <Link
                        href={`/documents?kind=${k.id}`}
                        className="mono-label"
                        style={{ fontSize: 9.5, color: "var(--orange-deep)" }}
                      >
                        open in the vault →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ── print hint (browser print, no code) ── */}
      <Hairline />
      <p className="small dim60" style={{ marginTop: 16 }}>
        Print this page for the folder list.
      </p>
    </>
  );
}
