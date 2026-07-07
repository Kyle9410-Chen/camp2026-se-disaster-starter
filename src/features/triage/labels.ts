import type {
  ReportType,
  SiteStatus,
  MatchMode,
  TaskStatus,
} from "../../contracts";
import type {
  AssignmentStatus,
  NeedType,
  SiteType,
  TriageTarget,
} from "./normalize";

/** 分類目標＝四大 session 家族。 */
export const targetOrder: Array<Exclude<TriageTarget, "none">> = [
  "report",
  "site",
  "task",
  "assignment",
];

export const targetLabels: Record<Exclude<TriageTarget, "none">, string> = {
  report: "通報",
  site: "地點",
  task: "志工任務",
  assignment: "人員指派",
};

export const reportTypeOptions: ReportType[] = [
  "unknown",
  "human_need",
  "supply_need",
  "site_update",
  "task_update",
];
export const reportTypeLabels: Record<ReportType, string> = {
  unknown: "尚未分類",
  human_need: "人員需求",
  supply_need: "物資需求",
  site_update: "地點更新",
  task_update: "任務更新",
};

export const siteTypeOptions: SiteType[] = [
  "supply",
  "shelter",
  "medical",
  "water",
  "toilet",
  "repair",
  "other",
];
export const siteTypeLabels: Record<SiteType, string> = {
  supply: "物資",
  shelter: "收容",
  medical: "醫療",
  water: "供水",
  toilet: "廁所",
  repair: "維修",
  other: "其他",
};

export const siteStatusOptions: SiteStatus[] = [
  "unknown",
  "reported_open",
  "reported_closed",
  "verified_open",
  "verified_closed",
  "needs_review",
];

export const needTypeOptions: NeedType[] = [
  "cleanup",
  "delivery",
  "repair",
  "care",
  "other",
];
export const needTypeLabels: Record<NeedType, string> = {
  cleanup: "清淤",
  delivery: "搬運配送",
  repair: "維修",
  care: "照顧陪伴",
  other: "其他",
};

export const matchModeOptions: MatchMode[] = [
  "self_claim",
  "assigned",
  "hybrid",
  "locked",
];
export const matchModeLabels: Record<MatchMode, string> = {
  self_claim: "自行認領",
  assigned: "協調指派",
  hybrid: "混合",
  locked: "鎖定/高風險",
};

export const taskStatusOptions: TaskStatus[] = [
  "draft",
  "needs_review",
  "open",
  "matching",
  "assigned",
  "fulfilled",
  "cancelled",
  "rejected",
];

export const assignmentStatusOptions: AssignmentStatus[] = [
  "requested",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
];
