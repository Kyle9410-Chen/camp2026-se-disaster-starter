# AI Log

這份紀錄用來留下小組如何使用 AI / Coding Agent 的操作脈絡。重點不是逐字保存所有 prompt，而是記錄重要協作、取捨與人類判斷。

## 什麼時候要記錄

請在以下情況更新本檔案：

- AI 協助釐清需求或產生 spec 草稿
- AI 協助設計 schema、adapter 或資料轉換策略
- AI 協助產生 UI、測試、README 或 handoff 文件
- AI 建議被小組拒絕，且拒絕原因和安全 / 正確性 / scope 有關
- AI 輸出可能造成誤導，例如把未確認資料寫成已確認事實
- event injection 後，AI 協助判斷 schema mismatch 或 adapter 策略

## 不需要記錄

- 不需要逐字貼完整 prompt
- 不需要記錄每一次小型 autocomplete
- 不需要記錄單純修 typo 或格式化

## 紀錄格式

| 時間 | 階段 | 任務 | AI / Agent 建議 | 採用 / 拒絕 | 人類判斷理由 | 相關檔案 / commit |
| ---- | ---- | ---- | --------------- | ----------- | ------------ | ----------------- |
| —    | Phase 0 | 建立資訊分流工作台 | 把 messy phase-0 髒資料透過人工分流轉成合法 Report，並用既有 adapter 預覽下游路由；`verified` 需人工分類＋填責任角色才可設定 | 採用 | 保留人工確認點，不讓系統把未確認資料自動當成事實；缺漏欄位由人補、`createdAt` 以 `updatedAt` 代理 | `src/features/triage/*`、`src/app/App.tsx`、`tests/triage-normalize.test.ts` |
| —    | Phase 0 | 分流決策持久化與欄位調整 | 決策（已同意 / 已拒絕 / 分類）以 schema 驗證後存入 localStorage 跨重整保留；原始資料維持唯讀；暫時移除審核者角色欄位 | 採用 | 保留原始髒資料不被覆蓋；讀回逐筆驗證避免壞資料污染；角色欄位依需求暫緩，`reporterRole` 先填占位值符合 schema | `src/features/triage/normalize.ts`、`TriageBoard.tsx`、`TriageCard.tsx` |
| —    | Phase 0 | 確認結果複製到下游分頁 | 決策狀態提升到 App 由 `useTriageDecisions` 集中，`verified` Report 複製到通報、衍生任務複製到志工任務分頁 | 採用 | 使用者期望確認的任務出現在下游 session；複製為 UI 顯示不覆蓋 starter fixtures；地點/人員指派無單一 Report 衍生故暫不複製 | `src/app/App.tsx`、`src/features/triage/useTriageDecisions.ts`、`normalize.ts` |
| —    | Phase 0 | 分流改四大家族＋dialog 表單 | 分類直接改成通報/地點/志工任務/人員指派；每類 dialog 表單（必填＋重點選填）即時驗證，確認後複製到四分頁 | 採用 | 更直接的心智模型取代 raw→Report→adapter 鏈；參照欄位不強制硬 ID（Assignment 留空填 `unassigned`）；共同欄位系統帶入、時間正規化；決策 union 存 localStorage v2 | `src/features/triage/{normalize,labels,TriageDialog,TriageCard,TriageBoard}.ts(x)`、`src/app/App.tsx` |

## 範例

| 時間  | 階段            | 任務             | AI / Agent 建議                                                   | 採用 / 拒絕 | 人類判斷理由                              | 相關檔案 / commit             |
| ----- | --------------- | ---------------- | ----------------------------------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| 09:45 | Phase 0         | 分析混亂資料     | 建議把社群貼文直接轉成 verified report                            | 拒絕        | 社群貼文來源未確認，應保持 `needs_review` | `docs/phase0-observations.md` |
| 15:50 | Event Injection | 處理外部任務資料 | 建議新增 adapter 將 `need_people: "10人"` 轉成 `peopleNeeded: 10` | 採用        | 這是外部格式差異，不應修改 `CommonRecord` | `src/adapters/...`            |

## 課後反思

### AI 幫助最大的地方

-

### AI 最容易誤導的地方

-

### 下次使用 AI 開發前，我們會先準備

-
