# Content Automation Orchestrator 內容自動化總調度器

## 觸發指令
- `/generate [客戶名]` — 從 Sheets 讀取待生成清單，逐一生成
- `/generate [客戶名] [行號]` — 生成特定行的草稿
- `/content [客戶名]` — 同 `/generate`，別名

---

## 描述
統籌整個內容生成流程的主控技能。負責讀取客戶設定、連接 Google Sheets「文案資料庫」取得待生成主題、呼叫 Draft Generator 生成文案草稿、存檔並批次寫回 Sheets。

**生成順序原則：按主題完成。** 同一主題的同組版本全部完成後，才進入下一個主題。
- Script_1 → Script_2 → Script_3（v1-v3）

---

## 完整工作流程

### Step 1：解析客戶
讀取 `clients/[客戶名]/client-config.md`，取得：
- Spreadsheet ID
- Sheet Name（預設 `文案資料庫`）
- Column Mapping（輸入：A/B/C，輸出：D/E/F）
- 篩選邏輯
- 啟用的平台

如果客戶資料夾不存在，提示使用者建立。

### Step 2：讀取 Google Sheets「文案資料庫」
使用 gws CLI 讀取試算表：
```bash
gws sheets spreadsheets values get \
  --params '{"spreadsheetId": "[ID]", "range": "文案資料庫!A1:F50"}'
```
- Spreadsheet ID 和 Sheet Name 從 client-config.md 取得；若未指定，預設工作表名稱為 `文案資料庫`
- 讀取所有行的 Date(A)、Tags(B)、Content(C)、Script_1(D)、Script_2(E)、Script_3(F)

**篩選與排序「可生成」的行：**

判斷每行的完成狀態（根據 Script_1-3 判斷）：

- **部分完成** = Tags 有值 AND Content 非空 AND（D/E/F 中有值但未全部填完）
- **完全未生成** = Tags 有值 AND Content 非空 AND D/E/F 皆為空
- **已完成** = D/E/F 三欄皆有值 → 跳過

- **不可生成** = Tags 為空或 Content 為空 → 跳過

**生成優先順序：**
1. 部分完成的主題 → 優先補齊缺少的版本
2. 完全未生成的主題 → 從該組的第一個版本開始

**備援方式（本地 queue）：**
如果 gws CLI 不可用（連線失敗、auth 過期等）：
1. 提示使用者：「gws CLI 連線不可用，要改用本地 content-queue.md 嗎？」
2. 如果使用者同意，讀取 `clients/[客戶名]/content-queue.md`
3. 建議使用者之後跑 `/sync [客戶名]` 保持同步

### Step 3：顯示待生成清單
將篩選出的待生成主題列表呈現給使用者，包含三版完成狀態：

```
找到 3 個待生成主題：

1. [Row 15] 4/14 | 產品資訊 | 節慶禮盒送禮提案      v1:✅ v2:⬜ v3:⬜
2. [Row 17] 4/16 | 生活知識 | 冷凍甜點的保存方式    v1:✅ v2:⬜ v3:⬜
3. [Row 22] 4/21 | 服務資訊 | 預訂與宅配說明        v1:⬜ v2:⬜ v3:⬜

要全部生成，還是選擇特定項目？
```

等待使用者選擇：全部 / 特定編號 / 取消

### Step 4：知識庫檢查
讀取 `clients/[客戶名]/knowledge/` 下的四個檔案：
- 確認檔案存在且非空
- 檢查 `Last Updated` 時間戳，超過 30 天提醒更新

如果知識庫缺少或為空：
- 提醒使用者並建議執行 `/research [客戶名]`

### Step 5：按主題逐一生成草稿
對每個選定的主題，**依序完成該主題所有缺少的版本後，才進入下一個主題**：

1. 判斷該主題缺少哪些版本（v1/v2/v3）
2. 依序生成缺少的版本：

   - **生成 v1（Script_1）時：** 呼叫 Draft Generator，Version=v1
   - **生成 v2（Script_2）時：** 先讀取已有的 v1 文案，呼叫 Draft Generator，Version=v2，傳入 ExistingDrafts
   - **生成 v3（Script_3）時：** 先讀取已有的 v1、v2 文案，呼叫 Draft Generator，Version=v3，傳入 ExistingDrafts

3. 每生成一個版本後，先將草稿存檔到本地 markdown：
   `clients/[客戶名]/output/[YYYY-MM]/[MM-DD]_[tags]_[content].md`

4. 收集本次新生成文案的 Sheets 寫回項目：
   - 每個新生成版本建立一筆 `{range, values}`，例如 `文案資料庫!D15`
   - 生成幾格就只放幾筆 `data` entries，不寫空白覆蓋既有文案
   - 已存在的 Script 欄位不重寫

5. 該主題三版全部完成後，才進入下一個主題；所有選定主題都生成並存檔完成後，才進行 Step 6 批次寫回

### Step 6：批次寫回 Sheets 並更新 queue

1. 使用單一 `values batchUpdate` 命令批次寫回所有新生成的 Script 欄位：
   ```bash
   gws sheets spreadsheets values batchUpdate \
     --params '{"spreadsheetId":"[ID]"}' \
     --json '{
       "valueInputOption": "RAW",
       "data": [
         {"range":"文案資料庫!D2","values":[["Script_1 文案"]]},
         {"range":"文案資料庫!E2","values":[["Script_2 文案"]]},
         {"range":"文案資料庫!F2","values":[["Script_3 文案"]]}
       ]
     }'
   ```
2. 批次寫回成功後，一次同步更新 `clients/[客戶名]/content-queue.md` 進度表：
   - 將本次成功寫回的版本欄位從 ⬜ 改為 ✅
   - 如果 content-queue.md 不存在，先用本檔末「Content Queue 模板」建立後再更新
   - queue 更新必須反映 Sheets 寫回成功的狀態
3. 若批次寫回失敗：
   - 保留已產出的本地 markdown
   - 不要將 `content-queue.md` 對應欄位標為 ✅
   - 回報需要重試 batch write，並列出待重試的 range

### Step 7：彙報結果

**彙報前必做檢查：** 確認 `clients/[客戶名]/content-queue.md` 已反映本次批次寫回成功的所有產出（每篇 v 欄都從 ⬜ 變成 ✅）。如果 Sheets batch write 失敗，不得標記完成。

```
已完成 2 個主題的草稿生成：

1. 節慶禮盒送禮提案 [Row 15]
   v1: ✅（已有）  v2: ✅ 新生成  v3: ✅ 新生成
   本地: clients/[demo-client]/output/2026-04/04-14_產品資訊_節慶禮盒送禮提案.md
   Sheets: 已批次寫入 D15/E15/F15 ✓

2. 冷凍甜點的保存方式 [Row 17]
   v1: ✅（已有）  v2: ✅ 新生成  v3: ✅ 新生成
   本地: clients/[demo-client]/output/2026-04/04-16_生活知識_冷凍甜點的保存方式.md
   Sheets: 已批次寫入 D17/E17/F17 ✓

下一步建議：
1. 到 Sheets 檢視三版文案，選擇最喜歡的版本
2. 準備對應的圖片素材
3. 排程發布

需要修改某篇草稿嗎？告訴我哪一篇、要改什麼方向。
```

---

## 使用的工具
- **Read**: 讀取 client-config、知識庫、content-queue
- **Write**: 儲存生成的草稿到本地
- **Glob**: 確認客戶目錄和檔案結構
- **Skill**: 呼叫 /draft
- **Bash**: gws CLI 讀取 Sheets（`gws sheets spreadsheets values get`）、批次寫回 Sheets（`gws sheets spreadsheets values batchUpdate`）

## 錯誤處理

| 狀況 | 處理方式 |
|------|---------|
| 客戶資料夾不存在 | 提示建立流程，參考 CLAUDE.md |
| 知識庫檔案缺少/空白 | 建議執行 `/research [客戶名]` |
| gws CLI 不可用 | 提示切換到本地 content-queue.md |
| 無可生成行（全部已完成） | 通知使用者所有項目都已完成 |
| content-queue.md 不存在 | 建立空白模板檔案 |
| gws sheets values batchUpdate 失敗 | 草稿仍保存在本地，不更新 queue 為 ✅，回報待重試 range |

## 注意事項
- 所有輸出使用繁體中文（台灣用語）
- 如果使用者要求修改某篇草稿，直接修改，不需重跑整個流程
- 保持對話式互動，讓使用者能選擇和控制流程
- 寫回 Sheets 時只寫純文字文案，不含 markdown 格式標記
- 逐篇處理，一次生成一個版本，避免吃太多 context
- **禁止逐版即時寫 Sheets**；所有新產出的 Script 欄位必須在生成結束後用一次 `values batchUpdate` 寫回
- **只有 batch write 成功後才能同步改 content-queue.md**（Step 6）

---

## Content Queue 模板

當 `clients/[客戶名]/content-queue.md` 不存在或為空模板時，依以下範本建立並填入該客戶的排程。

### 標記語意
- ✅ 已生成（Sheets 與本地 markdown 都已寫入）
- ⬜ 待生成
- ⬛ 待定（Content 欄位是「待定」，主題未明確，暫不生成）

```markdown
# [客戶名] Content Queue（本地進度表）

> Last Synced: YYYY-MM-DD
> 來源：Google Sheets 文案資料庫
> 規則：Sheets 批次寫回成功後，一次同步把對應 v 欄改為 ✅

## 排程

| 日期 | 類型 | 主題 | v1 | v2 | v3 |
|------|------|------|----|----|----|
| 5/5  | 產品資訊 | 濕熱夏天會怎麼影響底妝表現？ | ✅ | ✅ | ✅ |
| 5/14 | 產品資訊 | 待定 | ⬛ | ⬛ | ⬛ |
```
