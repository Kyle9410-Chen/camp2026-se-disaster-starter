import { describe, expect, it } from "vitest";
import {
  canConfirm,
  confirmedRecordsByTarget,
  decisionForTarget,
  defaultDecision,
  parseStoredDecisions,
  toTargetRecord,
  type MessyReport,
  type TriageDecision,
} from "../src/features/triage/normalize";

const messy: MessyReport = {
  id: "M-001",
  rawText: "光復車站後方有人說需要十幾個人清泥。",
  sourceType: "social_post",
  verificationStatus: "needs_review",
  updatedAt: "2026-07-20T09:10:00+08:00",
};

const normalizedAt = new Date(messy.updatedAt).toISOString();

describe("toTargetRecord", () => {
  it("builds a valid task with normalized common fields", () => {
    const decision = decisionForTarget(messy, "task", "verified");
    if (decision.target !== "task") throw new Error("unexpected target");
    decision.fields.title = "清淤支援";
    const { tab, result } = toTargetRecord(messy, decision);
    expect(tab).toBe("tasks");
    expect(result.success).toBe(true);
    if (result.success) {
      const record = result.data as {
        id: string;
        createdAt: string;
        sourceType: string;
        verificationStatus: string;
      };
      expect(record.id).toBe("task-M-001");
      expect(record.createdAt).toBe(normalizedAt);
      expect(record.sourceType).toBe("social_post");
      expect(record.verificationStatus).toBe("verified");
    }
  });

  it("builds a valid site", () => {
    const decision = decisionForTarget(messy, "site", "needs_review");
    if (decision.target !== "site") throw new Error("unexpected target");
    decision.fields.name = "溪畔活動中心";
    const { tab, result } = toTargetRecord(messy, decision);
    expect(tab).toBe("sites");
    expect(result.success).toBe(true);
  });

  it("builds a valid report", () => {
    const decision = decisionForTarget(messy, "report", "needs_review");
    if (decision.target !== "report") throw new Error("unexpected target");
    const { tab, result } = toTargetRecord(messy, decision);
    expect(tab).toBe("reports");
    // rawText 預帶自 messy，故直接合法
    expect(result.success).toBe(true);
  });

  it("fills placeholder refs for an assignment left blank", () => {
    const decision = decisionForTarget(messy, "assignment", "verified");
    const { tab, result } = toTargetRecord(messy, decision);
    expect(tab).toBe("assignments");
    expect(result.success).toBe(true);
    if (result.success) {
      const record = result.data as {
        taskId: string;
        volunteerGroupId: string;
        peopleCount: number;
      };
      expect(record.taskId).toBe("unassigned");
      expect(record.volunteerGroupId).toBe("unassigned");
      expect(record.peopleCount).toBe(1);
    }
  });

  it("flags an incomplete record (missing required field)", () => {
    const decision = decisionForTarget(messy, "task", "needs_review");
    // title 留空 → 不合法
    const { result } = toTargetRecord(messy, decision);
    expect(result.success).toBe(false);
  });
});

describe("canConfirm", () => {
  it("is false when unclassified", () => {
    expect(canConfirm(messy, defaultDecision(messy))).toBe(false);
  });

  it("is false when required fields are missing", () => {
    const decision = decisionForTarget(messy, "site", "needs_review");
    expect(canConfirm(messy, decision)).toBe(false);
  });

  it("is true once required fields are filled", () => {
    const decision = decisionForTarget(messy, "site", "needs_review");
    if (decision.target !== "site") throw new Error("unexpected target");
    decision.fields.name = "溪畔活動中心";
    expect(canConfirm(messy, decision)).toBe(true);
  });
});

describe("defaultDecision", () => {
  it("starts unclassified with a coerced status", () => {
    expect(defaultDecision(messy)).toEqual({
      target: "none",
      verificationStatus: "needs_review",
    });
  });
});

describe("parseStoredDecisions", () => {
  it("keeps schema-valid entries and drops malformed ones", () => {
    const valid = decisionForTarget(messy, "task", "verified");
    if (valid.target === "task") valid.fields.title = "清淤支援";
    const parsed = parseStoredDecisions({
      "M-001": valid,
      "M-002": { target: "none", verificationStatus: "rejected" },
      "M-BAD": { target: "task", verificationStatus: "verified" },
      "M-JUNK": 5,
    });
    expect(Object.keys(parsed).sort()).toEqual(["M-001", "M-002"]);
  });

  it("returns an empty map for non-object input", () => {
    expect(parseStoredDecisions(null)).toEqual({});
    expect(parseStoredDecisions("nope")).toEqual({});
  });
});

describe("confirmedRecordsByTarget", () => {
  const reports: MessyReport[] = [
    messy,
    { ...messy, id: "M-002" },
    { ...messy, id: "M-003" },
  ];

  it("buckets only verified, valid records by family", () => {
    const taskDecision = decisionForTarget(messy, "task", "verified");
    if (taskDecision.target === "task") taskDecision.fields.title = "清淤支援";
    const siteNeedsReview = decisionForTarget(
      { ...messy, id: "M-002" },
      "site",
      "needs_review",
    );
    if (siteNeedsReview.target === "site")
      siteNeedsReview.fields.name = "溪畔活動中心";
    const assignmentDecision = decisionForTarget(
      { ...messy, id: "M-003" },
      "assignment",
      "verified",
    );

    const decisions: Record<string, TriageDecision> = {
      "M-001": taskDecision,
      "M-002": siteNeedsReview, // 未 verified → 不收
      "M-003": assignmentDecision,
    };
    const out = confirmedRecordsByTarget(reports, decisions);
    expect(out.task.map((t) => t.id)).toEqual(["task-M-001"]);
    expect(out.assignment.map((a) => a.id)).toEqual(["assign-M-003"]);
    expect(out.site).toHaveLength(0);
    expect(out.report).toHaveLength(0);
  });
});
