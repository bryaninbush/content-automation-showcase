# Sheets Reader 試算表讀取技能

## 觸發指令
```
/sheets [客戶名]
```

範例：
```
/sheets [demo-client]
```

---

## 描述
讀取指定客戶的 Google Sheets 工作表，格式化顯示目前的貼文排程和生成狀態。此技能可由使用者直接呼叫（查看排程），也被 Orchestrator 內部使用。

---

## 工作流程

### Step 1：讀取客戶設定
讀取 `clients/[客戶名]/client-config.md`，取得：
- Spreadsheet ID
- Sheet Name（從 client-config.md 取得；未指定時預設 `文案資料庫`）
- Column Mapping
- 篩選邏輯

### Step 2：使用 gws CLI 讀取 Sheets
```bash
gws sheets spreadsheets values get \
  --params '{"spreadsheetId": "[ID]", "range": "[Sheet Name]!A1:F50"}'
```
- 欄位：Date(A)、Tags(B)、Content(C)、Script_1(D)、Script_2(E)、Script_3(F)
- 新客戶標準工作表名稱為 `文案資料庫`；舊客戶若仍使用 `資料庫`，以各自 client-config.md 為準

### Step 3：格式化顯示
依據 D/E/F 三欄是否為空來判斷各版本狀態。
跳過 Tags 為空或 Content 為空的行。

```
[demo-client] — [Sheet Name] 內容排程
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

待補齊 (2):
  Row 15 | 4/14 | 產品資訊 | 節慶禮盒送禮提案         v1:✅ v2:⬜ v3:⬜
  Row 17 | 4/16 | 生活知識 | 冷凍甜點的保存方式       v1:✅ v2:⬜ v3:⬜

待生成 (3):
  Row 22 | 4/21 | 產品資訊 | 禮盒內容介紹            v1:⬜ v2:⬜ v3:⬜
  Row 23 | 4/22 | 服務資訊 | 宅配與預訂說明          v1:⬜ v2:⬜ v3:⬜
  Row 24 | 4/23 | 互動貼文 | 你最想送禮給誰？        v1:⬜ v2:⬜ v3:⬜

已完成 (1):
  Row 10 | 4/9  | 生活知識 | 常溫與冷凍保存差異      v1:✅ v2:✅ v3:✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
合計：6 篇 | 待補齊 2 | 待生成 3 | 已完成 1
```

---

## 使用的工具
- **Read**: 讀取 client-config.md
- **Bash**: gws CLI 讀取 Sheets（`gws sheets spreadsheets values get`）

## 錯誤處理

| 狀況 | 處理方式 |
|------|---------|
| gws CLI 不可用 | 提示使用者檢查 gws auth 設定，或改用 `/sync` |
| Spreadsheet ID 未填 | 提示使用者在 client-config.md 中填入 |
| Sheet Name 找不到 | 列出可用的 sheet 名稱讓使用者選擇 |
