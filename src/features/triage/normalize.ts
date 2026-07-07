import { z } from "zod";
import {
  reportSchema,
  reportTypeSchema,
  siteSchema,
  siteStatusSchema,
  siteTypeSchema,
  taskSchema,
  taskStatusSchema,
  matchModeSchema,
  needTypeSchema,
  assignmentSchema,
  assignmentStatusSchema,
  type Assignment,
  type Report,
  type Site,
  type Task,
} from "../../contracts";
import { safeParseFixture } from "../../lib/load-fixture";

// contracts 只匯出這些 enum 的 schema，未匯出型別；在此就地推導供 labels 使用。
export type SiteType = z.infer<typeof siteTypeSchema>;
export type NeedType = z.infer<typeof needTypeSchema>;
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

/**
 * Phase 0 髒輸入的寬鬆描述。刻意只列出 messy-reports.json 實際有的欄位，
 * 放在 feature 而非 contracts/，避免暗示它是 core 資料契約。
 */
export const messyReportSchema = z.object({
  id: z.string().min(1),
  rawText: z.string().min(1),
  sourceType: z.string().min(1),
  verificationStatus: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type MessyReport = z.infer<typeof messyReportSchema>;
export const messyReportsSchema = z.array(messyReportSchema);

/** 分流時人工可決策的查核狀態（不含系統自動的 unverified）。 */
export const triageVerificationSchema = z.enum([
  "needs_review",
  "verified",
  "rejected",
]);
export type TriageVerification = z.infer<typeof triageVerificationSchema>;

/** 分類目標＝四大 session 家族（none 表示尚未分類）。 */
export const triageTargetSchema = z.enum([
  "none",
  "report",
  "site",
  "task",
  "assignment",
]);
export type TriageTarget = z.infer<typeof triageTargetSchema>;

/** 下游分頁 key。 */
export type DownstreamTab = "reports" | "sites" | "tasks" | "assignments";

const tabForTarget: Record<Exclude<TriageTarget, "none">, DownstreamTab> = {
  report: "reports",
  site: "sites",
  task: "tasks",
  assignment: "assignments",
};

/**
 * 每個家族的表單欄位。文字/數字一律以 string 保存（方便受控輸入與序列化），
 * 數字與技能在 toTargetRecord 時才轉型；enum 欄位用 contracts 的 schema 直接驗證。
 */
export const reportFieldsSchema = z.object({
  rawText: z.string(),
  reportType: reportTypeSchema,
  locationText: z.string(),
  subjectRole: z.string(),
  relatedSiteId: z.string(),
});
export const siteFieldsSchema = z.object({
  name: z.string(),
  siteType: siteTypeSchema,
  status: siteStatusSchema,
  addressText: z.string(),
  area: z.string(),
});
export const taskFieldsSchema = z.object({
  title: z.string(),
  description: z.string(),
  needType: needTypeSchema,
  status: taskStatusSchema,
  matchMode: matchModeSchema,
  peopleNeeded: z.string(),
  peopleClaimed: z.string(),
  requiredSkills: z.string(),
  relatedSiteId: z.string(),
  reportId: z.string(),
});
export const assignmentFieldsSchema = z.object({
  taskId: z.string(),
  volunteerGroupId: z.string(),
  peopleCount: z.string(),
  status: assignmentStatusSchema,
  decidedByRole: z.string(),
  decisionReason: z.string(),
});

export type ReportFields = z.infer<typeof reportFieldsSchema>;
export type SiteFields = z.infer<typeof siteFieldsSchema>;
export type TaskFields = z.infer<typeof taskFieldsSchema>;
export type AssignmentFields = z.infer<typeof assignmentFieldsSchema>;

/**
 * 一筆髒資料的人工決策（discriminated union by target）。
 * 用 schema 定義，讓 localStorage 讀回的資料能被安全驗證。
 */
export const triageDecisionSchema = z.discriminatedUnion("target", [
  z.object({
    target: z.literal("none"),
    verificationStatus: triageVerificationSchema,
  }),
  z.object({
    target: z.literal("report"),
    verificationStatus: triageVerificationSchema,
    fields: reportFieldsSchema,
  }),
  z.object({
    target: z.literal("site"),
    verificationStatus: triageVerificationSchema,
    fields: siteFieldsSchema,
  }),
  z.object({
    target: z.literal("task"),
    verificationStatus: triageVerificationSchema,
    fields: taskFieldsSchema,
  }),
  z.object({
    target: z.literal("assignment"),
    verificationStatus: triageVerificationSchema,
    fields: assignmentFieldsSchema,
  }),
]);
export type TriageDecision = z.infer<typeof triageDecisionSchema>;

/** 決策持久化在 localStorage 的 key。 */
export const TRIAGE_STORAGE_KEY = "triage-decisions-v2";

/** messy 進來的狀態收斂成分流三態，無法辨識時回到「待確認」。 */
export function coerceVerification(status: string): TriageVerification {
  const parsed = triageVerificationSchema.safeParse(status);
  return parsed.success ? parsed.data : "needs_review";
}

/**
 * 把髒資料的時間字串正規化成家族 schema 接受的 UTC ISO（帶 Z）。
 * 例如 messy 的 "2026-07-20T09:10:00+08:00" → "2026-07-20T01:10:00.000Z"。
 * 無法解析時原樣保留，讓 schema 驗證把壞資料標出來。
 */
export function toUtcIso(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

/** 切換到某家族時的預設欄位；能從 raw 帶入的就帶入（rawText / description）。 */
export function defaultFieldsFor(
  target: Exclude<TriageTarget, "none">,
  messy: MessyReport,
): ReportFields | SiteFields | TaskFields | AssignmentFields {
  switch (target) {
    case "report":
      return {
        rawText: messy.rawText,
        reportType: "unknown",
        locationText: "",
        subjectRole: "",
        relatedSiteId: "",
      };
    case "site":
      return {
        name: "",
        siteType: "other",
        status: "needs_review",
        addressText: "",
        area: "",
      };
    case "task":
      return {
        title: "",
        description: messy.rawText,
        needType: "other",
        status: "needs_review",
        matchMode: "self_claim",
        peopleNeeded: "",
        peopleClaimed: "",
        requiredSkills: "",
        relatedSiteId: "",
        reportId: "",
      };
    case "assignment":
      return {
        taskId: "",
        volunteerGroupId: "",
        peopleCount: "1",
        status: "requested",
        decidedByRole: "",
        decisionReason: "",
      };
  }
}

/** 尚未決策時的預設：未分類，狀態沿用髒資料收斂後的值。 */
export function defaultDecision(messy: MessyReport): TriageDecision {
  return {
    target: "none",
    verificationStatus: coerceVerification(messy.verificationStatus),
  };
}

/** 切換分類目標時，產生帶預設欄位的完整決策（沿用目前查核狀態）。 */
export function decisionForTarget(
  messy: MessyReport,
  target: TriageTarget,
  verificationStatus: TriageVerification,
): TriageDecision {
  if (target === "none") return { target: "none", verificationStatus };
  return {
    target,
    verificationStatus,
    fields: defaultFieldsFor(target, messy),
  } as TriageDecision;
}

/**
 * 從（可能來自 localStorage 的）未知資料安全解析各筆決策：
 * 逐筆用 schema 驗證，格式錯的直接丟棄，不污染 UI 狀態或原始資料。
 */
export function parseStoredDecisions(
  raw: unknown,
): Record<string, TriageDecision> {
  const result: Record<string, TriageDecision> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = triageDecisionSchema.safeParse(value);
    if (parsed.success) result[id] = parsed.data;
  }
  return result;
}

function toPositiveInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isNaN(n) ? undefined : n;
}

function splitSkills(value: string): string[] {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);
}

/** 依 target 組出對應家族的候選物件（含共同欄位）。 */
function buildCandidate(
  messy: MessyReport,
  decision: Exclude<TriageDecision, { target: "none" }>,
): {
  tab: DownstreamTab;
  schema: z.ZodTypeAny;
  candidate: Record<string, unknown>;
} {
  const normalizedAt = toUtcIso(messy.updatedAt);
  const common = {
    createdAt: normalizedAt,
    updatedAt: normalizedAt,
    sourceType: messy.sourceType,
    verificationStatus: decision.verificationStatus,
  };
  const tab = tabForTarget[decision.target];

  if (decision.target === "report") {
    const f = decision.fields;
    return {
      tab,
      schema: reportSchema,
      candidate: {
        id: messy.id,
        ...common,
        reportType: f.reportType,
        rawText: f.rawText,
        reporterRole: "unknown",
        needsManualReview: decision.verificationStatus !== "verified",
        ...(f.locationText.trim()
          ? { locationText: f.locationText.trim() }
          : {}),
        ...(f.subjectRole.trim() ? { subjectRole: f.subjectRole.trim() } : {}),
        ...(f.relatedSiteId.trim()
          ? { relatedSiteId: f.relatedSiteId.trim() }
          : {}),
      },
    };
  }

  if (decision.target === "site") {
    const f = decision.fields;
    return {
      tab,
      schema: siteSchema,
      candidate: {
        id: `site-${messy.id}`,
        ...common,
        name: f.name,
        siteType: f.siteType,
        status: f.status,
        ...(f.addressText.trim() ? { addressText: f.addressText.trim() } : {}),
        ...(f.area.trim() ? { area: f.area.trim() } : {}),
      },
    };
  }

  if (decision.target === "task") {
    const f = decision.fields;
    const peopleNeeded = toPositiveInt(f.peopleNeeded);
    const peopleClaimed = toPositiveInt(f.peopleClaimed);
    const skills = splitSkills(f.requiredSkills);
    return {
      tab,
      schema: taskSchema,
      candidate: {
        id: `task-${messy.id}`,
        ...common,
        title: f.title,
        description: f.description,
        needType: f.needType,
        status: f.status,
        matchMode: f.matchMode,
        ...(peopleNeeded !== undefined ? { peopleNeeded } : {}),
        ...(peopleClaimed !== undefined ? { peopleClaimed } : {}),
        ...(skills.length ? { requiredSkills: skills } : {}),
        ...(f.relatedSiteId.trim()
          ? { relatedSiteId: f.relatedSiteId.trim() }
          : {}),
        ...(f.reportId.trim() ? { reportId: f.reportId.trim() } : {}),
      },
    };
  }

  const f = decision.fields;
  return {
    tab,
    schema: assignmentSchema,
    candidate: {
      id: `assign-${messy.id}`,
      ...common,
      taskId: f.taskId.trim() || "unassigned",
      volunteerGroupId: f.volunteerGroupId.trim() || "unassigned",
      peopleCount: toPositiveInt(f.peopleCount) ?? 1,
      status: f.status,
      ...(f.decidedByRole.trim()
        ? { decidedByRole: f.decidedByRole.trim() }
        : {}),
      ...(f.decisionReason.trim()
        ? { decisionReason: f.decisionReason.trim() }
        : {}),
    },
  };
}

/**
 * 依人工決策把 raw 資料建成對應家族的候選紀錄，並即時驗證。
 * 回傳目標分頁與驗證結果（供 dialog 顯示 ✔ / ✗ 缺漏）。
 */
export function toTargetRecord(messy: MessyReport, decision: TriageDecision) {
  if (decision.target === "none") {
    return {
      tab: null,
      result: { success: false as const, message: "尚未選擇分類" },
    };
  }
  const built = buildCandidate(messy, decision);
  return {
    tab: built.tab,
    result: safeParseFixture(
      built.schema,
      built.candidate,
      `triage:${messy.id}`,
    ),
  };
}

/**
 * 「確認有效」的人工前置條件（教學紅線，非 schema 規則）：
 * 必須選好分類，且填出能通過該家族 schema 的紀錄。
 */
export function canConfirm(
  messy: MessyReport,
  decision: TriageDecision,
): boolean {
  if (decision.target === "none") return false;
  return toTargetRecord(messy, decision).result.success;
}

export type ConfirmedRecords = {
  report: Report[];
  site: Site[];
  task: Task[];
  assignment: Assignment[];
};

/**
 * 已確認（verified 且能通過 schema）的分流紀錄副本，依家族分桶。
 * 供下游分頁把確認後的資料複製過去，原始 messy 資料不受影響。
 */
export function confirmedRecordsByTarget(
  reports: MessyReport[],
  decisions: Record<string, TriageDecision>,
): ConfirmedRecords {
  const out: ConfirmedRecords = {
    report: [],
    site: [],
    task: [],
    assignment: [],
  };
  for (const messy of reports) {
    const decision = decisions[messy.id];
    if (!decision || decision.target === "none") continue;
    if (decision.verificationStatus !== "verified") continue;
    const { candidate } = buildCandidate(messy, decision);
    switch (decision.target) {
      case "report": {
        const p = reportSchema.safeParse(candidate);
        if (p.success) out.report.push(p.data);
        break;
      }
      case "site": {
        const p = siteSchema.safeParse(candidate);
        if (p.success) out.site.push(p.data);
        break;
      }
      case "task": {
        const p = taskSchema.safeParse(candidate);
        if (p.success) out.task.push(p.data);
        break;
      }
      case "assignment": {
        const p = assignmentSchema.safeParse(candidate);
        if (p.success) out.assignment.push(p.data);
        break;
      }
    }
  }
  return out;
}
