# Data Contract

## Inputs

## Outputs

## Extended schema

## Adapter decisions

外部資料不一定符合內部 schema。先寫 adapter，只有語意真的不足時才擴充 schema。

### messy phase-0 → 四大家族（資訊分流工作台）

`src/fixtures/phase-0/messy-reports.json` 只有 `id / rawText / sourceType /
verificationStatus / updatedAt`。分流工作台（`src/features/triage/`）讓人工把每筆髒資料
**直接分類成四大 session 家族之一**：通報 `Report` / 地點 `Site` / 志工任務 `Task` / 人員指派 `Assignment`，
並在 dialog 表單補齊該家族欄位，即時用對應 schema 驗證（`toTargetRecord`）。取捨：

- 分類目標即家族（`triageTargetSchema`：none/report/site/task/assignment）；一筆 raw → 一個家族紀錄（1:1）。
- 欄位完整度＝**必填＋重點選填**；表單值以字串保存，數字（peopleNeeded/peopleCount…）與技能
  （逗號分隔）在 `toTargetRecord` 時才轉型；enum 欄位用 contracts 的 schema 直接驗證。
- 共同欄位由系統帶入：`id`（家族前綴 `site-/task-/assign-`，report 沿用 messy id）、
  `createdAt/updatedAt`＝`toUtcIso(messy.updatedAt)`（正規化成帶 `Z` 的 UTC ISO，因 `.datetime()` 不吃 `+08:00`）、
  `sourceType`＝messy、`verificationStatus`＝dialog 決策。Report 的 `reporterRole` 固定占位 `"unknown"`，
  `needsManualReview` 由 `verificationStatus !== "verified"` 推導。
- **參照欄位不強制硬 ID**：`relatedSiteId / reportId / taskId / volunteerGroupId` 皆選填自由輸入；
  Assignment 的 schema 必填參照（taskId/volunteerGroupId）留空時填占位值 `"unassigned"`；`peopleCount` 預設 1。
- **人工紅線**：要設 `verified` 必須先選好分類且填出能通過該家族 schema 的紀錄（`canConfirm`）；系統不自動判斷真偽。

**決策持久化**：原始 `messy-reports.json` 維持唯讀不變；每筆決策（discriminated union by target）以
`triageDecisionSchema` 序列化後存入 `localStorage`（key `triage-decisions-v2`），重新整理後還原；
讀回時逐筆用 schema 驗證，格式錯的直接丟棄（`parseStoredDecisions`）。

**確認後複製到下游分頁**：決策由 `useTriageDecisions` 集中管理，工作台與四個下游分頁共用同一份。
`verified` 且能通過 schema 的紀錄（`confirmedRecordsByTarget`）依家族複製到 通報 / 地點 / 志工任務 /
人員指派 分頁，標示「由分流確認後複製」。複製只是 UI 顯示，不覆蓋 starter fixtures，也不寫回原始資料。

（原本 raw→Report→`reportToTask`/`reportToSiteStatus` 的 adapter 路由已由直接分類取代；adapter 檔案保留為 starter 範例。）
