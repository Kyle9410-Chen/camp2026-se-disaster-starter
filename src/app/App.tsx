import { useMemo, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import reportsData from "../fixtures/shared/reports.json";
import sitesData from "../fixtures/shared/sites.json";
import tasksData from "../fixtures/shared/tasks.json";
import assignmentsData from "../fixtures/shared/assignments.json";
import { RecordCard } from "../components/RecordCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { TriageBoard } from "../features/triage/TriageBoard";
import {
  confirmedRecordsByTarget,
  messyReportsSchema,
} from "../features/triage/normalize";
import { useTriageDecisions } from "../features/triage/useTriageDecisions";
import {
  assignmentsSchema,
  reportsSchema,
  sitesSchema,
  tasksSchema,
} from "../contracts";
import { safeParseFixture } from "../lib/load-fixture";

type TabKey = "messy" | "reports" | "sites" | "tasks" | "assignments";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "messy", label: "第一階段：資訊分流" },
  { key: "reports", label: "通報" },
  { key: "sites", label: "地點" },
  { key: "tasks", label: "志工任務" },
  { key: "assignments", label: "人員指派" },
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("messy");

  const messy = useMemo(
    () =>
      safeParseFixture(
        messyReportsSchema,
        messyReports,
        "src/fixtures/phase-0/messy-reports.json",
      ),
    [],
  );

  const parsed = useMemo(() => {
    const reports = safeParseFixture(
      reportsSchema,
      reportsData,
      "src/fixtures/shared/reports.json",
    );
    if (!reports.success) return reports;

    const sites = safeParseFixture(
      sitesSchema,
      sitesData,
      "src/fixtures/shared/sites.json",
    );
    if (!sites.success) return sites;

    const tasks = safeParseFixture(
      tasksSchema,
      tasksData,
      "src/fixtures/shared/tasks.json",
    );
    if (!tasks.success) return tasks;

    const assignments = safeParseFixture(
      assignmentsSchema,
      assignmentsData,
      "src/fixtures/shared/assignments.json",
    );
    if (!assignments.success) return assignments;

    return {
      success: true as const,
      data: {
        reports: reports.data,
        sites: sites.data,
        tasks: tasks.data,
        assignments: assignments.data,
      },
    };
  }, []);

  const messyList = useMemo(() => (messy.success ? messy.data : []), [messy]);
  const { decisions, setDecision } = useTriageDecisions(messyList);

  const triageConfirmed = useMemo(
    () => confirmedRecordsByTarget(messyList, decisions),
    [messyList, decisions],
  );

  const records = parsed.success
    ? (() => {
        if (activeTab === "reports") return parsed.data.reports;
        if (activeTab === "sites") return parsed.data.sites;
        if (activeTab === "tasks") return parsed.data.tasks;
        return parsed.data.assignments;
      })()
    : [];

  const triageCopies =
    activeTab === "reports"
      ? triageConfirmed.report
      : activeTab === "sites"
        ? triageConfirmed.site
        : activeTab === "tasks"
          ? triageConfirmed.task
          : activeTab === "assignments"
            ? triageConfirmed.assignment
            : [];

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊積木起始專案</h1>
        <p>
          先面對混亂資料，再透過規格、資料格式、轉換器與測試，把前端原型做成可交接的資訊元件。
        </p>
      </header>

      {parsed.success ? (
        <nav className="tabs" aria-label="資料分類">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "active" : ""}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      ) : null}

      <section className="panel">
        {!parsed.success ? (
          <ErrorState message={parsed.message} />
        ) : activeTab === "messy" ? (
          !messy.success ? (
            <ErrorState message={messy.message} />
          ) : (
            <>
              <div className="panel__header">
                <h2>{tabs.find((tab) => tab.key === activeTab)?.label}</h2>
                <p>{messy.data.length} 筆原始資料</p>
              </div>
              <TriageBoard
                reports={messy.data}
                decisions={decisions}
                onChange={setDecision}
              />
            </>
          )
        ) : records.length === 0 && triageCopies.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : (
          <>
            <div className="panel__header">
              <h2>{tabs.find((tab) => tab.key === activeTab)?.label}</h2>
              <p>
                {records.length} 筆資料
                {triageCopies.length > 0
                  ? `，另含 ${triageCopies.length} 筆由分流確認複製`
                  : ""}
              </p>
            </div>
            {records.length > 0 ? (
              <div className="grid">
                {records.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            ) : null}
            {triageCopies.length > 0 ? (
              <div className="triage-copies">
                <h3>由資訊分流確認後複製過來</h3>
                <div className="grid">
                  {triageCopies.map((record) => (
                    <RecordCard key={record.id} record={record} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
