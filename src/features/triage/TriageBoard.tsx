import { useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { TriageCard } from "./TriageCard";
import { TriageDialog } from "./TriageDialog";
import {
  defaultDecision,
  type MessyReport,
  type TriageDecision,
} from "./normalize";

export function TriageBoard({
  reports,
  decisions,
  onChange,
}: {
  reports: MessyReport[];
  decisions: Record<string, TriageDecision>;
  onChange: (id: string, next: TriageDecision) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (reports.length === 0) {
    return <EmptyState message="目前沒有原始資料" />;
  }

  const list = reports.map((report) => decisions[report.id]);
  const summary = {
    unclassified: list.filter((d) => !d || d.target === "none").length,
    verified: list.filter((d) => d?.verificationStatus === "verified").length,
    rejected: list.filter((d) => d?.verificationStatus === "rejected").length,
  };

  const openReport = openId ? reports.find((r) => r.id === openId) : undefined;

  return (
    <div className="triage">
      <div className="triage-summary">
        <span>未分類 {summary.unclassified}</span>
        <span>已確認 {summary.verified}</span>
        <span>已拒絕 {summary.rejected}</span>
      </div>
      <p className="triage-note">
        點卡片的「分類 / 編輯」把原始資料整理成通報 / 地點 / 志工任務 /
        人員指派。系統不替你判斷真偽，「確認有效」需補齊必填欄位；確認後複製到對應分頁。決策自動保存，原始資料維持唯讀不變。
      </p>
      <div className="grid">
        {reports.map((report) => (
          <TriageCard
            key={report.id}
            report={report}
            decision={decisions[report.id] ?? defaultDecision(report)}
            onOpen={() => setOpenId(report.id)}
          />
        ))}
      </div>
      {openReport ? (
        <TriageDialog
          report={openReport}
          decision={decisions[openReport.id] ?? defaultDecision(openReport)}
          open={openId !== null}
          onChange={(next) => onChange(openReport.id, next)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );
}
