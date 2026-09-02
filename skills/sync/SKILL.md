# Sync 備援同步技能

## 觸發指令
```
/sync [客戶名]
/sync [客戶名] --setup-sheet
```

範例：
```
/sync [demo-client]
/sync [demo-client] --setup-sheet
```

---

## 描述
備援方案：當 gws CLI 不可用時，將 Sheets「文案資料庫」同步到本地 `content-queue.md`。也可以讓使用者手動貼上 Sheets 資料來同步。

同時負責新客戶 Google Sheets 的標準初始化：建立新的 spreadsheet、建立/命名 `文案資料庫` 工作表、寫入固定欄位，並套用標準條件格式。

---

## 工作流程

### 方式 0：建立標準 Google Spreadsheet（`--setup-sheet`）
1. 使用 gws CLI 建立新的 Google Spreadsheet：
   ```bash
   gws sheets spreadsheets create \
     --json '{"properties":{"title":"[客戶名] 文案資料庫"}}'
   ```
2. 使用 `gws sheets spreadsheets batchUpdate` 將第一個工作表命名為 `文案資料庫`，並套用基本設定（如 freeze header row）。
3. 寫入固定表頭 `A1:F1`：
   ```bash
   gws sheets spreadsheets values update \
     --params '{"spreadsheetId": "[ID]", "range": "文案資料庫!A1:F1", "valueInputOption": "RAW"}' \
     --json '{"values":[["Date","Tags","Content","Script_1","Script_2","Script_3"]]}'
   ```
4. 使用 `gws sheets spreadsheets batchUpdate` 在 `文案資料庫!B2:B100` 套用條件格式：
   - `TEXT_CONTAINS 產品`：背景 RGB `(1, 0.9490196, 0.8)`
   - `TEXT_CONTAINS 生活`：背景 RGB `(0.8117647, 0.8862745, 0.9529412)`
   - `TEXT_CONTAINS 互動貼文`：背景 RGB `(0.8509804, 0.91764706, 0.827451)`
   - `TEXT_CONTAINS 影片`：背景 RGB `(0.8, 0.8, 0.8)`
5. 回報新的 Spreadsheet ID，提醒使用者填入 `clients/[客戶名]/client-config.md`。

`batchUpdate` request 需包含：
- `updateSheetProperties`：將 sheet title 設為 `文案資料庫`
- `updateSheetProperties` 或等價設定：凍結第一列
- 四條 `addConditionalFormatRule`：範圍固定為 B2:B100（`startRowIndex: 1`、`endRowIndex: 100`、`startColumnIndex: 1`、`endColumnIndex: 2`），條件為上列 `TEXT_CONTAINS`

### 方式 A：透過 gws CLI 同步
1. 讀取 `clients/[客戶名]/client-config.md` 取得 Sheets 設定
2. 使用 gws CLI 讀取 Sheets：
   ```bash
   gws sheets spreadsheets values get \
     --params '{"spreadsheetId": "[ID]", "range": "文案資料庫!A1:F50"}'
   ```
3. 解析 D/E/F 欄判斷各版本狀態
4. 寫入 `clients/[客戶名]/content-queue.md`

### 方式 B：手動貼上（gws CLI 不可用時）
1. 提示使用者從 Google Sheets 複製貼上資料
2. 解析使用者貼上的文字（tab-separated 或 comma-separated）
3. 寫入 `clients/[客戶名]/content-queue.md`

引導使用者：
```
gws CLI 目前不可用。
請從 Sheets「文案資料庫」複製貼上資料（選取 Date、Tags、Content、Script_1、Script_2、Script_3 欄位），
我會幫你轉成本地排程。
```

### 寫入格式
`clients/[客戶名]/content-queue.md` 格式：

```markdown
# [客戶名] Content Queue（備援本地排程）

> Last Synced: 2026-04-11
> 來源：Google Sheets 文案資料庫

## 排程

| 日期 | 類型 | 主題 | v1 | v2 | v3 |
|------|------|------|----|----|-----|
| 4/14 | 產品資訊 | 節慶禮盒送禮提案 | ✅ | ⬜ | ⬜ |
| 4/16 | 生活知識 | 冷凍甜點的保存方式 | ✅ | ⬜ | ⬜ |
| 4/21 | 服務資訊 | 宅配與預訂說明 | ⬜ | ⬜ | ⬜ |
```

判斷邏輯：D/E/F 各欄有值 = ✅，為空 = ⬜。
跳過 Tags 為空或 Content 為空的行。

---

## 使用的工具
- **Read**: 讀取 client-config.md
- **Write**: 寫入 content-queue.md
- **Bash**: gws CLI 建立與讀取 Sheets（`gws sheets spreadsheets create`、`gws sheets spreadsheets batchUpdate`、`gws sheets spreadsheets values update`、`gws sheets spreadsheets values get`）

## 注意事項
- 同步後在檔案頂部記錄「最後同步時間」
- 提醒使用者：本地 queue 可能會過期，建議定期 `/sync`
