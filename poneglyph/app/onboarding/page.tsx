import { PageHead, MarkedCard, Chip } from "@/components/ui";
import { molecule } from "@/data/entity";
import { CSCRF_GRADE_LABEL, partLabel } from "@/lib/domains";

export default function Onboarding() {
  return (
    <>
      <PageHead
        eyebrow={`Entity profile · ${molecule.legalName}`}
        title={
          <>
            Entity <span className="accent grad">profile</span>
          </>
        }
        sub="Molecule Ventures LLP's own declared profile. Every fact carries its source and is marked declared until the backing document is loaded; nothing here asserts a compliance posture."
      />

      <MarkedCard pad={0} style={{ overflow: "hidden", marginBottom: 26 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Fact</th>
              <th>Value</th>
              <th>Provenance</th>
              <th>Source</th>
              <th>As of</th>
            </tr>
          </thead>
          <tbody>
            {molecule.facts.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td style={{ fontWeight: 500 }}>{f.value}</td>
                <td>
                  <Chip tone={f.verified ? "info" : "pending"}>{f.verified ? "verified" : "declared"}</Chip>
                </td>
                <td className="small dim60" style={{ maxWidth: "42ch" }}>{f.source}</td>
                <td className="mono-label dim">{f.asOf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </MarkedCard>

      <div className="panel pad">
        <div className="row wrap" style={{ gap: 10, marginBottom: 12 }}>
          <span className="mono-label dim">Capacities</span>
          {molecule.intermediaryTypes.map((t) => <Chip key={t} tone="info">{t.replace(/-/g, " ")}</Chip>)}
          <span className="mono-label dim">· CSCRF grade</span>
          <Chip tone="info">{CSCRF_GRADE_LABEL[molecule.cscrfGrade]}</Chip>
        </div>
        <p className="clause-text" style={{ maxWidth: "88ch" }}>{molecule.cscrfBasis}</p>
        <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
          <span className="mono-label dim">Rulebooks bound</span>
          {molecule.applicableParts.map((p) => <Chip key={p} tone="live">{partLabel(p)}</Chip>)}
        </div>
      </div>
    </>
  );
}
