import { useEffect, useRef } from "react";
import { labelForStatus } from "../../components/status-labels";
import {
  canConfirm,
  decisionForTarget,
  toTargetRecord,
  type AssignmentFields,
  type MessyReport,
  type ReportFields,
  type SiteFields,
  type TaskFields,
  type TriageDecision,
  type TriageTarget,
  type TriageVerification,
} from "./normalize";
import {
  assignmentStatusOptions,
  matchModeLabels,
  matchModeOptions,
  needTypeLabels,
  needTypeOptions,
  reportTypeLabels,
  reportTypeOptions,
  siteStatusOptions,
  siteTypeLabels,
  siteTypeOptions,
  targetLabels,
  targetOrder,
  taskStatusOptions,
} from "./labels";

const decisionButtons: Array<{ value: TriageVerification; label: string }> = [
  { value: "needs_review", label: "待確認" },
  { value: "verified", label: "確認有效" },
  { value: "rejected", label: "拒絕" },
];

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="triage-field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="triage-field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  render,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  render: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <label className="triage-field">
      <span>{label} *</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {render(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReportForm({
  fields,
  onChange,
}: {
  fields: ReportFields;
  onChange: (fields: ReportFields) => void;
}) {
  const set = (patch: Partial<ReportFields>) =>
    onChange({ ...fields, ...patch });
  return (
    <div className="triage-dialog__form">
      <TextArea
        label="原始描述"
        value={fields.rawText}
        onChange={(rawText) => set({ rawText })}
        required
      />
      <SelectField
        label="通報類型"
        value={fields.reportType}
        options={reportTypeOptions}
        render={(type) => reportTypeLabels[type]}
        onChange={(reportType) => set({ reportType })}
      />
      <TextField
        label="地點描述"
        value={fields.locationText}
        onChange={(locationText) => set({ locationText })}
      />
      <TextField
        label="對象角色"
        value={fields.subjectRole}
        onChange={(subjectRole) => set({ subjectRole })}
      />
      <TextField
        label="關聯地點"
        value={fields.relatedSiteId}
        placeholder="自由填寫，非必填"
        onChange={(relatedSiteId) => set({ relatedSiteId })}
      />
    </div>
  );
}

function SiteForm({
  fields,
  onChange,
}: {
  fields: SiteFields;
  onChange: (fields: SiteFields) => void;
}) {
  const set = (patch: Partial<SiteFields>) => onChange({ ...fields, ...patch });
  return (
    <div className="triage-dialog__form">
      <TextField
        label="地點名稱"
        value={fields.name}
        onChange={(name) => set({ name })}
        required
      />
      <SelectField
        label="地點類型"
        value={fields.siteType}
        options={siteTypeOptions}
        render={(type) => siteTypeLabels[type]}
        onChange={(siteType) => set({ siteType })}
      />
      <SelectField
        label="地點狀態"
        value={fields.status}
        options={siteStatusOptions}
        render={labelForStatus}
        onChange={(status) => set({ status })}
      />
      <TextField
        label="地址"
        value={fields.addressText}
        onChange={(addressText) => set({ addressText })}
      />
      <TextField
        label="區域"
        value={fields.area}
        onChange={(area) => set({ area })}
      />
    </div>
  );
}

function TaskForm({
  fields,
  onChange,
}: {
  fields: TaskFields;
  onChange: (fields: TaskFields) => void;
}) {
  const set = (patch: Partial<TaskFields>) => onChange({ ...fields, ...patch });
  return (
    <div className="triage-dialog__form">
      <TextField
        label="任務標題"
        value={fields.title}
        onChange={(title) => set({ title })}
        required
      />
      <TextArea
        label="任務說明"
        value={fields.description}
        onChange={(description) => set({ description })}
        required
      />
      <SelectField
        label="需求類型"
        value={fields.needType}
        options={needTypeOptions}
        render={(type) => needTypeLabels[type]}
        onChange={(needType) => set({ needType })}
      />
      <SelectField
        label="任務狀態"
        value={fields.status}
        options={taskStatusOptions}
        render={labelForStatus}
        onChange={(status) => set({ status })}
      />
      <SelectField
        label="媒合方式"
        value={fields.matchMode}
        options={matchModeOptions}
        render={(mode) => matchModeLabels[mode]}
        onChange={(matchMode) => set({ matchMode })}
      />
      <TextField
        label="需求人數"
        value={fields.peopleNeeded}
        placeholder="數字"
        onChange={(peopleNeeded) => set({ peopleNeeded })}
      />
      <TextField
        label="已認領人數"
        value={fields.peopleClaimed}
        placeholder="數字"
        onChange={(peopleClaimed) => set({ peopleClaimed })}
      />
      <TextField
        label="需求技能"
        value={fields.requiredSkills}
        placeholder="以逗號分隔"
        onChange={(requiredSkills) => set({ requiredSkills })}
      />
      <TextField
        label="關聯地點"
        value={fields.relatedSiteId}
        placeholder="自由填寫，非必填"
        onChange={(relatedSiteId) => set({ relatedSiteId })}
      />
      <TextField
        label="關聯通報"
        value={fields.reportId}
        placeholder="自由填寫，非必填"
        onChange={(reportId) => set({ reportId })}
      />
    </div>
  );
}

function AssignmentForm({
  fields,
  onChange,
}: {
  fields: AssignmentFields;
  onChange: (fields: AssignmentFields) => void;
}) {
  const set = (patch: Partial<AssignmentFields>) =>
    onChange({ ...fields, ...patch });
  return (
    <div className="triage-dialog__form">
      <TextField
        label="關聯任務"
        value={fields.taskId}
        placeholder="自由填寫，留空記為 unassigned"
        onChange={(taskId) => set({ taskId })}
      />
      <TextField
        label="志工隊伍"
        value={fields.volunteerGroupId}
        placeholder="自由填寫，留空記為 unassigned"
        onChange={(volunteerGroupId) => set({ volunteerGroupId })}
      />
      <TextField
        label="人數"
        value={fields.peopleCount}
        placeholder="數字"
        onChange={(peopleCount) => set({ peopleCount })}
      />
      <SelectField
        label="指派狀態"
        value={fields.status}
        options={assignmentStatusOptions}
        render={labelForStatus}
        onChange={(status) => set({ status })}
      />
      <TextField
        label="決策者角色"
        value={fields.decidedByRole}
        onChange={(decidedByRole) => set({ decidedByRole })}
      />
      <TextArea
        label="決策理由"
        value={fields.decisionReason}
        onChange={(decisionReason) => set({ decisionReason })}
      />
    </div>
  );
}

export function TriageDialog({
  report,
  decision,
  open,
  onChange,
  onClose,
}: {
  report: MessyReport;
  decision: TriageDecision;
  open: boolean;
  onChange: (next: TriageDecision) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const preview = toTargetRecord(report, decision);
  const confirmable = canConfirm(report, decision);

  const selectTarget = (target: TriageTarget) => {
    if (target === decision.target) return;
    onChange(decisionForTarget(report, target, decision.verificationStatus));
  };

  return (
    <dialog
      ref={ref}
      className="triage-dialog"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="triage-dialog__body">
        <header className="triage-dialog__head">
          <div>
            <p className="triage-dialog__eyebrow">原始資料 {report.id}</p>
            <p>{report.rawText}</p>
          </div>
          <button
            type="button"
            className="triage-dialog__close"
            onClick={onClose}
          >
            關閉
          </button>
        </header>

        <div className="triage-targets" role="group" aria-label="選擇分類">
          {targetOrder.map((target) => (
            <button
              key={target}
              type="button"
              className={decision.target === target ? "active" : ""}
              onClick={() => selectTarget(target)}
            >
              {targetLabels[target]}
            </button>
          ))}
        </div>

        {decision.target === "none" ? (
          <p className="triage-hint">請先選擇要把這筆資料變成哪一種紀錄。</p>
        ) : decision.target === "report" ? (
          <ReportForm
            fields={decision.fields}
            onChange={(fields) => onChange({ ...decision, fields })}
          />
        ) : decision.target === "site" ? (
          <SiteForm
            fields={decision.fields}
            onChange={(fields) => onChange({ ...decision, fields })}
          />
        ) : decision.target === "task" ? (
          <TaskForm
            fields={decision.fields}
            onChange={(fields) => onChange({ ...decision, fields })}
          />
        ) : (
          <AssignmentForm
            fields={decision.fields}
            onChange={(fields) => onChange({ ...decision, fields })}
          />
        )}

        <div className="triage-decision" role="group" aria-label="查核決策">
          {decisionButtons.map((button) => {
            const disabled = button.value === "verified" && !confirmable;
            return (
              <button
                key={button.value}
                type="button"
                disabled={disabled}
                className={
                  decision.verificationStatus === button.value ? "active" : ""
                }
                onClick={() =>
                  onChange({ ...decision, verificationStatus: button.value })
                }
              >
                {button.label}
              </button>
            );
          })}
        </div>

        <div className="triage-preview">
          {decision.target === "none" ? (
            <p className="triage-hint">尚未選擇分類。</p>
          ) : preview.result.success ? (
            <p className="triage-ok">
              ✔ 可產生合法「{targetLabels[decision.target]}」紀錄
            </p>
          ) : (
            <div className="triage-bad">
              <p>✗ 尚未成為合法紀錄</p>
              <pre>{preview.result.message}</pre>
            </div>
          )}
          {!confirmable && decision.target !== "none" ? (
            <p className="triage-hint">
              「確認有效」需先補齊必填欄位（標 *）。
            </p>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
