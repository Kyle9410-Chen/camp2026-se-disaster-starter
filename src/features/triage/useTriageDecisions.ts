import { useCallback, useEffect, useState } from "react";
import {
  defaultDecision,
  parseStoredDecisions,
  TRIAGE_STORAGE_KEY,
  type MessyReport,
  type TriageDecision,
} from "./normalize";

function readStoredDecisions(): Record<string, TriageDecision> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRIAGE_STORAGE_KEY);
    return raw ? parseStoredDecisions(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/** 原始資料唯讀不變；決策優先沿用先前保存的，缺的用預設補齊。 */
function buildInitial(reports: MessyReport[]): Record<string, TriageDecision> {
  const stored = readStoredDecisions();
  return Object.fromEntries(
    reports.map((report) => [
      report.id,
      stored[report.id] ?? defaultDecision(report),
    ]),
  );
}

/**
 * 分流決策的單一資料來源：App 持有它，分流工作台與下游分頁共用同一份，
 * 因此「確認有效」的結果能即時被複製到通報 / 志工任務分頁。決策自動存 localStorage。
 */
export function useTriageDecisions(reports: MessyReport[]) {
  const [decisions, setDecisions] = useState(() => buildInitial(reports));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        TRIAGE_STORAGE_KEY,
        JSON.stringify(decisions),
      );
    } catch {
      // 儲存失敗（如隱私模式）時略過，不影響操作。
    }
  }, [decisions]);

  const setDecision = useCallback((id: string, next: TriageDecision) => {
    setDecisions((prev) => ({ ...prev, [id]: next }));
  }, []);

  return { decisions, setDecision };
}
