# Content Automation — 多客戶行銷內容自動化系統

## 專案說明
為多個跨產業客戶協助生成社群媒體行銷內容草稿；目前展示的輸出平台為 IG。

## 可用指令
- `/generate [客戶名]` — 從 Google Sheets 讀取待生成主題，產出草稿
- `/generate [客戶名] [行號]` — 生成特定行的草稿
- `/research [客戶名]` — 研究該客戶的產業趨勢，更新知識庫
- `/sheets [客戶名]` — 顯示該客戶的 Sheets 內容排程
- `/sync [客戶名]` — 備援：將 Sheets 同步到本地 content-queue.md
- `/sync [客戶名] --setup-sheet` — 建立新的標準 Google Spreadsheet，初始化 `文案資料庫` 工作表、固定欄位與條件格式

## 核心規則
- 所有輸出使用**繁體中文（台灣用語）**
- 僅產出 **IG** 版本（無 TikTok），客戶平台啟用狀態以 `client-config.md` 為準
- 每篇草稿聚焦**單一貼文目的**，不做多角度/多風格比較
- 客戶資料完全隔離，不跨客戶混用知識庫
- 生成順序為**按主題完成**：每個主題的 Script_1 → Script_2 → Script_3 全部完成後，才進入下一個主題
- 文案生成完成後，必須用一次 `gws sheets spreadsheets values batchUpdate` 批次寫回所有新產出的 Script 欄位；禁止每生成一版就逐格寫回 Sheets
- 批次寫回 Sheets 成功後，才一次同步更新 `clients/[客戶名]/content-queue.md` 進度表；若寫回失敗，保留本地 markdown，但不要把 queue 標為 ✅。客戶資料夾若無 content-queue.md，第一次 /generate 時要建立。
- 若客戶設定圖片製作說明欄位，先確認文案核心，再依該客戶專屬的圖片製作知識產出逐頁 brief；不可覆寫真人修改版本。

## 專案結構
```
content-automation/
├── skills/             # 技能定義
│   ├── orchestrator/   # /generate 主調度器
│   ├── draft-generator/# /draft 草稿生成
│   ├── research-agent/ # /research 產業研究
│   ├── sheets-reader/  # /sheets Sheets 讀取
│   └── sync/           # /sync 備援同步
├── clients/            # 客戶隔離資料夾
│   └── [客戶名]/
│       ├── client-config.md  # 客戶設定（Sheets ID、產業）
│       ├── knowledge/        # 品牌知識庫
│       ├── output/           # 產出草稿
│       └── content-queue.md  # 備援本地排程
└── shared/             # 跨客戶共用資源
    └── platform-guidelines.md
```

## 新增客戶流程
1. 在 `clients/` 下建立客戶名稱資料夾
2. 建立 `client-config.md`（填入 Sheets ID、產業、品牌關鍵字）
3. 建立 `knowledge/` 四個檔案（brand-context, product-info, target-audience, writing-style）
4. 跑 `/research [客戶名]` 補充知識庫
5. 設定好 Google Sheets 並跑 `/generate [客戶名]` 測試

## Google Sheets 整合
使用 gws CLI 讀寫 Google Sheets。若 gws 不可用，使用 `/sync` 備援。
