import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import { targetLabels } from "./labels";
import type { MessyReport, TriageDecision } from "./normalize";

export function TriageCard({
  report,
  decision,
  onOpen,
}: {
  report: MessyReport;
  decision: TriageDecision;
  onOpen: () => void;
}) {
  const classification =
    decision.target === "none" ? "尚未分類" : targetLabels[decision.target];

  return (
    <article
      className={`record-card triage-card--${decision.verificationStatus}`}
    >
      <div className="record-card__header">
        <h3>{report.id}</h3>
        <StatusBadge status={decision.verificationStatus} />
      </div>
      <p>{report.rawText}</p>
      <div className="record-card__meta">
        <SourceLabel sourceType={report.sourceType} />
        <span>更新：{formatDateTime(report.updatedAt)}</span>
      </div>
      <div className="triage-card__footer">
        <span className="triage-card__class">分類：{classification}</span>
        <button type="button" onClick={onOpen}>
          分類 / 編輯
        </button>
      </div>
    </article>
  );
}
