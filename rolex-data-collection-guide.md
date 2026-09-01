# Rolex 多市場資料收集與驗證指南

> 文件版本：1.0 
> 本文件是執行規範，不是歷史結果清單。實際資料契約以 Repo 內最新 README、Schema 與資料檔為準。

## 0. 文件目的與核心原則

本文件是 Rolex 多市場資料維護的可交接、可重複執行作業規範（SOP）。執行者應以**可查核、可重現、可追溯**的證據完成資料收集、正式資料更新與驗證，只需回報操作摘要、來源證據、檢查結果、差異與未完成項目；不需要輸出內部思考過程。

整體資料流只有一條：

```text
官方來源
   ↓
Evidence 證據層
   ↓
正式資料層（catalog / markets / history）
   ↓
驗證與交付
```

各層責任如下：

- **官方來源**：當次事實來源。市場清單、官方文字與價格應以目標市場的 Rolex 官方來源為主。
- **Evidence 證據層**：保存本次實際觀察、來源發現、完整性證據與驗證依據；它是 audit / reproducibility layer，不屬於三個正式 JSON Schema 契約。
- **正式資料層**：`catalog/`、`markets/`、`history/`。只保存既有資料契約允許的欄位。
- **驗證與交付層**：確認結構合法、跨檔一致、來源正確、收集完整、歷史未被破壞，並將 PASS／FAIL／NOT RUN 與限制如實交付。

### 0.1 收集策略

對 JavaScript 驅動網站，先回答「資料真正從哪裡來」，再決定如何大量收集：

1. 優先識別官方頁面實際使用的 JSON、REST、GraphQL、Next.js data、hydration/state 或其他結構化資料來源。
2. 確認 market／locale、請求參數、資料語意及 pagination／cursor 終止條件。
3. 若結構化來源可安全且可重現地取得完整配置，將它作為主要全量收集路徑。
4. 再以 rendered UI、商品頁或另一個官方視圖進行獨立交叉驗證。
5. 只有在沒有可靠結構化來源，或資料必須經互動狀態才能取得時，才以 Playwright／DOM／載入更多／無限捲動／配置切換作為主要收集方式。

**Browser、CDP 或 Network 工具不可用，不代表網站不存在 structured endpoint。** 若無能力檢查，只能標記 `NOT RUN / capability unavailable`，不可把「沒能力檢查」寫成「沒有 API」。

### 0.2 判定原則

- 歷史筆數、其他市場筆數、過往全量結果只供**回歸與異常檢查**，不得作為下一次收集的預定答案或停止條件。
- 官方初始畫面、搜尋引擎摘要、第一頁或「已經捲動很多次」都不是完整性的證明。
- 證據不足時保留未知或列為未完成，不推算、不補造、不為通過測試而修改來源事實。
- `PASS` 代表該檢查確實完成且通過；`FAIL` 代表已執行但不符合；`NOT RUN` 代表未執行或能力不足。三者不得混用。

## 1. 執行方式

### 1.1 執行前必讀

執行者必須先讀取並以實際檔案為準：

- 本文件 `rolex-data-collection-guide.md`
- 三個實際 JSON Schema
- `catalog/`
- 目標市場的 `markets/`
- 目標市場的 `history/`
- 與本次差集／聯集檢查必要的其他市場資料

只提供本指南不足以安全接續既有價格歷史。若市場代碼、官方地區入口或必要既有檔案缺失，先列出缺件；可以執行不依賴缺件的唯讀檢查，但不得重新捏造「既有歷史」。

### 1.2 更新模式定義

本專案將維護任務依深度與範疇區分為兩種標準模式：

| 模式 | 模式 A：純價格更新（Price-only Refresh） | 模式 B：全市場重新考證（Full Re-discovery） |
| :--- | :--- | :--- |
| **適用時機** | 官方定期微調定價、月度/季度例行價格追蹤 | 年度大改版、新錶款發表（如 Watches and Wonders）、新增市場、補齊不完整市場 |
| **價格歷史** | 追加新 `runId` 與價格/在售狀態變更點（Append-only） | 追加新 `runId` 與價格/在售狀態變更點（Append-only） |
| **市場元資料** | 保留既有文字與俗稱，僅更新在售狀態與最新商品連結 | 完整更新官方在地文字（錶面、錶殼）、重新抓取新品標示（`isNewModel`） |
| **俗稱研究** | 標記為 `NOT RUN (out of scope)`，完整保留既有別名與來源 | **強制執行** 第 6 節階段 G 俗稱研究與多來源考證，產出 `nicknameResearch` 存證 |
| **獨立抽查** | 抽查代表性系列、最低/最高價款 | 深入抽查 19~21 款（含同型號不同配置、新品、俗稱歸屬） |

### 1.3 多市場分派與協調架構（跨平台通用）

當需要維護多個市場時，**禁止在單一記憶體/步驟中將所有市場資料混在一起處理**。依執行環境支援度選擇以下兩種方式之一：

1. **多 Agent 平台（如 Antigravity `invoke_subagent`、Claude Code Task Tool）**：由主協調員（Master Coordinator）派發獨立 Sub-agent / Task 各自負責單一市場。
2. **單 Agent 平台（如 Codex、一般 CLI）**：採「市場隔離模式」，主 Agent 依序逐一針對各市場完成採集、Evidence 與檔案更新後，再進入下一個市場。

```text
       ┌───────────────────────────────────────────────────────────┐
       │              主協調員 (Master Coordinator)                 │
       │  1. 接收任務與目標市場清單                                    │
       │  2. 派發獨立 Sub-agents 或採「逐一市場隔離模式」執行            │
       └─────────────────────────────┬─────────────────────────────┘
                                     │ 派發 / 依序執行
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│  TW 市場任務 │              │  JP 市場任務 │              │  US 市場任務 │
│  · 專責 TW   │              │  · 專責 JP   │              │  · 專責 US   │
│  · Evidence  │              │  · Evidence  │              │  · Evidence  │
│  · Market/Hist│             │  · Market/Hist│             │  · Market/Hist│
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       └─────────────────────────────┼─────────────────────────────┘
                                     │ 回報完成
       ┌─────────────────────────────▼─────────────────────────────┐
       │              主協調員彙整與收尾 (Master Merge)              │
       │  1. Catalog 去重聯集更新 (|C ∪ M| 核對)                     │
       │  2. 執行 7.11 節 Python / Node.js 跨檔案 Invariant 驗證腳本 │
       │  3. 同步更新 README.md 全局市場矩陣與統計 (發布門檻)          │
       └───────────────────────────────────────────────────────────┘
```

- **職責隔離**：各市場任務僅讀寫所屬市場檔案與 Evidence 目錄，互不干擾。
- **Catalog 聯集保護**：單一市場執行時不得直接覆寫 `catalog/rolex-catalog.json`，由主協調員統一完成聯集計算。
- **發布門檻統一驗證**：所有市場處理完畢後，由主協調員執行 7.11 節驗證並更新 `README.md`。

### 1.4 任務指令範本

Guide 是 single source of truth；任務 prompt 只需指定本次參數與模式，不重複整套 SOP。

#### 範本 1：多市場更新主協調員指令（AGY / Claude / Codex 通用）

> 你是 Rolex 多市場資料工程協調員（Master Coordinator）。  
> 請完整閱讀本 Repo 的 `rolex-data-collection-guide.md`、`README.md`、實際 Schema 與既有資料後，嚴格依指南執行。  
>  
> 【本次執行模式】：[模式 A - 純價格更新 / 模式 B - 全市場重新考證]  
> 【目標市場清單】：[例如：AT, DE, GB, HK, JP, SG, TW, US 或指定市場 TW, JP]  
>  
> 請依指南 1.3 節架構執行：  
> 1. 若環境支援 Sub-agent / Task 工具，請為每個目標市場派發獨立任務；若為單一 Agent 環境，請依序逐一市場獨立執行採集、Evidence 存證與檔案更新，嚴禁混雜上下文。  
> 2. 若為「模式 A」，保留既有俗稱，`nicknameResearch` 標記為 `NOT RUN (out of scope)`。  
> 3. 若為「模式 B」，完整執行新品標示更新與在地俗稱考證。  
> 4. 所有目標市場完成後，由主協調員彙整 Catalog 去重聯集、執行 7.11 節五層 Invariant 驗證腳本，並同步更新 `README.md`。  

#### 範本 2：單一市場執行／Sub-agent 任務指派指令

> 你是 Rolex [目標市場名稱，如 Taiwan] 市場資料維護員。  
> 請完整閱讀本 Repo 的 `rolex-data-collection-guide.md`、`README.md`、實際 Schema 與既有資料後，嚴格依指南執行。  
>  
> 任務模式：[模式 A - 純價格更新 / 模式 B - 全市場重新考證 / 新增市場]  
> 目標市場：[Taiwan]  
> marketCode：[TW]  
> 官方地區入口：https://www.rolex.com/zh-hant  
>  
> 執行要求：  
> 1. 優先探測結構化端點（如 `/api/catalog/watchgrid`），對需要 Network discovery 的 JavaScript 網站：若內建 Browser/CDP 不可用，可呼叫環境中已配置的 Network/DevTools 工具（如 `chrome-devtools` MCP）。  
> 2. 建立本次 Evidence 目錄（`evidence/[marketCode]/[YYYY-MM-DD]/`），保存 observations 與 collection/validation summary。  
> 3. 更新市場元資料並追加價格歷史（Append-only 新 runId），不得覆寫舊價格點。  
> 4. 完成單市場自我查核並回報配置數、價格區間與差集結果。  
> 5. 未經授權不得修改 Schema、安裝新的專案依賴、推送 Git 或繞過網站存取限制。

## 2. 核心資料規則（不可違反）

1. 計算單位是完整配置，不是系列、基本型號或商品卡片的螢幕數量。
2. 唯一鍵是完整 `modelReference`，例如 `m228236-0004`。
3. `m228236-0004` 和 `m228236-0018` 必須保留為兩筆。
4. `configurationCode` 是配置識別碼，不可直接解釋成只代表錶面。
5. Catalog 是跨市場已收集配置的聯集，不是台灣清單的永久副本。
6. 官網初次顯示的結果、搜尋引擎摘錄、第一頁都不代表全部；JavaScript 網站應先找官方頁面實際使用的結構化資料來源與分頁機制。
7. 不知道價格不等於價格為 0；沒收集到不等於 `not-listed`。
8. 不用匯率、同系列價格、其他國家的價格推算當地售價。
9. 市場檔不放價格；價格只存於該市場的歷史檔。
10. 更新不能覆寫舊觀察時間，不能刪除未變價的舊價格點。
11. 結構驗證通過不等於來源正確，也不等於收集完整。
12. 證據不足就標示不足；不要為了湊筆數、湊五個俗稱或通過測試而製造資料。
13. `evidence/` 是可重現的證據層，不是正式產品資料契約；不得把 evidence 專用欄位反向塞進 Catalog、Market 或 Price History。
14. 能保存來源事實就保存來源事實；不要只保存轉換後結果。原始價格文字、來源 URL、觀察時間、分頁／cursor 與解析結果應可追溯。

## 3. 檔案分工與目前資料契約

請先開啟實際檔案。若使用者提供的新版本與本節不同，依最新明確要求及實際契約核對；有衝突就先確認，不可靜默降版。

| 路徑 | 目前版本 | 負責的內容 |
| --- | ---: | --- |
| `catalog/rolex-catalog.json` | 1 | 跨市場穩定配置、去重聯集 |
| `markets/rolex-taiwan-market.json` | 1 | 台灣當地文字與網址 |
| `markets/rolex-japan-market.json` | 1 | 日本當地文字與網址 |
| `history/TW/rolex-price-history.json` | 1 | 台灣價格觀察與變化 |
| `history/JP/rolex-price-history.json` | 1 | 日本價格觀察與變化 |
| `schemas/rolex-catalog.schema.json` | — | Catalog 結構限制 |
| `schemas/rolex-market.schema.json` | — | 市場檔結構限制 |
| `schemas/rolex-price-history.schema.json` | — | 價格歷史結構限制 |
| `README.md` | — | 欄位說明、來源、涵蓋範圍、驗證摘要 |
| `evidence/[marketCode]/[YYYY-MM-DD]/` | 非 Schema 契約 | 本次原始觀察、來源發現、完整性與驗證證據 |

新增國家時，市場檔沿用 `markets/rolex-[英文地區名稱]-market.json`；歷史檔沿用 `history/[marketCode]/rolex-price-history.json`。不要重新建立早期的 `rolex-[地區]-prices.json`，也不要將 catalog 拼成 catelog。

### 3.1 Catalog

頂層欄位：

`$schema, schemaVersion, collectedAt, sourceMarketCodes, watchCount, watches`

每支腕錶只能有：

`collectionId, modelNumber, configurationCode, modelReference, imageUrl`

| 欄位 | 規則 |
| --- | --- |
| `modelReference` | 小寫完整配置，符合 `^m[0-9a-z]+-[0-9]{4}$` |
| `modelNumber` | 完整配置前半段，保留 `m` |
| `configurationCode` | 字串，例如 `"0004"`；不可轉成數字 4 |
| `collectionId` | 跨市場穩定系列 ID；不能用日文或中文顯示名稱代替 |
| `imageUrl` | 已查核、對應此完整配置的官方圖片網址 |
| `sourceMarketCodes` | 已納入合併核對的市場代碼，不代表每個配置都在每國販售 |
| `watchCount` | 等於此檔 `watches.length`，且等於唯一完整配置數 |

`modelReference === modelNumber + "-" + configurationCode` 必須成立。

### 3.2 市場檔

頂層欄位：

`$schema, schemaVersion, collectedAt, salesRegion, marketCode, locale, watchCount, source, collectionAliases, watches`

每支腕錶只能有：

`modelReference, collectionName, modelName, caseDescription, dialDescription, isNewModel, productUrl, localNicknames`

- `salesRegion` 使用英文地區名稱；`marketCode` 是兩位大寫國家代碼。
- `locale` 是實際地區語系，例如 `ja-JP`；需與官網地區一致。
- `source` 為 `{ "name": "Rolex Official Website", "url": "實際來源網址" }`。
- `collectionName`、`modelName`、錶殼及錶面描述保留當地官方文字，不自行翻譯後假稱官方文字。
- `caseDescription`、`dialDescription`、`productUrl` 在 Schema 中可為 null，但應先嘗試從可靠的官方頁面補齊，並報告缺漏。
- `isNewModel` 是當地官網標示，不根據推出年份猜測。只有確認相關標示已載入且不存在時，才能記為 false。
- `watchCount` 計算市場檔實際存有的配置，不要求與 catalog 相等。若保留已下架配置的舊文字，須在 README 區分「檔案存量」與「本次列出數」。

俗稱和別名統一使用以下結構；這是格式示例，不是要填入的實際名稱：

```json
{
  "names": [],
  "sources": []
}
```

每個 `sources` 元素只能有 `publisher` 與 `url`。`collectionAliases` 以 `collectionId` 為 key；`localNicknames` 位於各腕錶之下。不要改回 `strs` 或把來源移回頂層 `researchSources`。

### 3.3 價格歷史

頂層欄位：

`$schema, schemaVersion, marketCode, currencyCode, priceType, taxRatePercent, collectionRuns, priceSeries`

- `collectionRuns[]`：`runId, collectedAt, recordCount`。
- `priceSeries[modelReference][]`：`runId, listingStatus, price`。
- `price` 為當地貨幣主要單位的整數，不是字串，也不是自行換算的最小貨幣單位。
- 現有契約使用 TWD，不使用 NTD；日本使用 JPY。
- 若新市場出現非零小數價格，現有整數 Schema 無法無損保存：先停下並提出契約調整，不可四捨五入、截斷或偷偷乘以 100。

| `listingStatus` | `price` | 使用條件 |
| --- | --- | --- |
| `listed` | 非負整數 | 官網列出，且確實取得公開價格 |
| `price-unavailable` | null | 官網確認列出，但確認沒有公開價格 |
| `not-listed` | null | 完整查核及額外確認後，有足夠證據判定該地區官網未列出 |

解析失敗、尚未載入、網路錯誤不是 `price-unavailable`；局部抓取缺漏、單次 404 或逾時不是 `not-listed` 的充分證據。若數值解析成 0，雖可能通過 Schema，仍需人工確認；不可將空字串轉為 0。

### 3.4 不得重新加入的重複或已移除欄位

- `enrichedAt`、`priceTypeValues`、`taxName`、`notes`。
- `formattedPrice`、`displayCurrencyCode`、`researchSources.tax`、`researchSources.localNicknames`。
- Catalog 的 `baselineMarketCode`、`baselineLocale`、單一市場 `source`、單一 `catalogYear`。
- Catalog 的當地文字、價格、稅率、當地俗稱。
- 市場檔的 `price`、`listingStatus`、`currencyCode`、`priceType`、`taxRatePercent`，或 catalog 已有的穩定規格。

不用新增 `pricingContexts`、自訂狀態或未知欄位來避開現有 Schema。變更契約需另外取得使用者同意。

## 4. Evidence 證據層

`evidence/` 是資料收集流程的 **audit / reproducibility layer**。它的用途是回答：「這一批正式資料是根據哪些實際觀察產生、如何證明收集完整、如何在日後重新核對？」

建議目錄：

```text
evidence/
└── [marketCode]/
    └── [YYYY-MM-DD]/
        ├── observations.json
        ├── collection-summary.json
        └── validation-summary.json
```

最低要求如下：

| 檔案 | 用途 | 最低內容 |
| --- | --- | --- |
| `observations.json` | 保存本次可重現的逐筆來源事實 | source／endpoint、observedAt、總數或分頁資訊、逐筆 modelReference、原始文字、原始價格文字、解析後價格、商品 URL、可直接觀察的新款標示等 |
| `collection-summary.json` | 證明如何收集到完整集合 | market、locale、入口 URL、使用的收集路徑、endpoint／pagination 機制、批次數、原始筆數、唯一數、重複數、衝突數、停止證據與錯誤 |
| `validation-summary.json` | 保存驗證結果 | 五層驗證的 PASS／FAIL／NOT RUN、俗稱研究狀態與查詢證據、抽查型號、差集、價格統計、Schema 工具與版本、限制 |

`observations.json` 應盡量保留「來源事實」與「解析結果」兩者。例如原始價格 `15.850 €` 與解析後整數 `15850` 可以同時存在；正式 Price History 只保留契約需要的整數價格，但 evidence 讓日後可以重新驗證 parser。

Evidence 可以包含正式 Schema 不允許的欄位，例如 `formattedPrice`、`rawAlt`、request URL 或批次資訊，**但這些欄位只能存在 evidence**。不得因 evidence 有某欄位，就修改正式 Schema 或把欄位複製回 Market／History。

Evidence 的來源應優先是本次實際取得的官方資料，不是從正式 JSON 反推回去生成。理想資料流：

```text
Rolex official page / API / DOM
            ↓
      evidence observations
            ↓
    normalize + validate
            ↓
 ┌──────────┼───────────┐
 catalog/   markets/   history/
            ↓
 independent validation
            ↓
 validation summary + README
```

### 4.1 保存與安全規則

- 可以保存公開 API endpoint、query parameters、response 中公開欄位、頁面 URL、時間、批次與 parser 結果。
- 不保存 Cookie、Authorization header、session token、anti-CSRF token、帳號資料、個人資訊或其他秘密。
- 若 request 只有移除敏感 headers 後才適合保存，保存消毒後的 request metadata，不保存完整 raw headers。
- 可保存必要的公開 response 摘要或正規化 observations；不要求把整份網路封包、HAR 或所有 HTML 永久納入 Repo。
- Evidence 若很大，仍應優先保留能重現正式資料與驗證的最小充分集合；不要為了「完整」無限制保存快取、圖片或無關資源。
- 同一市場同一天若有多次獨立 run，避免覆寫；可使用 `run-001/`、`run-002/` 或在檔案內保存明確 runId。
- Evidence 是歷史證據，已用於發布正式資料後不應無聲改寫。若發現 evidence 本身擷取錯誤，新增更正說明或新 run，不要偷偷讓舊證據與已發布歷史失去對應。

### 4.2 Git 與保存策略

若 evidence 只含公開資料、體積合理且沒有敏感資訊，**建議納入版本控制**，因為它能支援日後回歸、差異分析與資料來源稽核。若 Repo 政策不希望保存大型 evidence，至少保留 collection／validation summary，並在 README 說明 observations 保存位置或未保存原因。

Evidence 不需要自己的 JSON Schema，除非未來確定要將它提升為長期穩定契約；目前不要為了 evidence 自行修改既有三個 Schema。

## 5. 收集流程與完整性停止條件

依序完成各階段。不要先修改正式 JSON，再回頭想如何查核。

### 階段 A：讀取基準並保護既有檔案

1. 讀完 README、三個 Schema、catalog、目標市場與歷史；讀取其他市場的代碼及完整配置集合供關聯檢查。
2. 記錄修改前的檔案雜湊、筆數、唯一型號數、歷史 runId、價格點總數。
3. 將原始檔保留於工作暫存區或既有版本管理。不要覆蓋使用者尚未提交的修改。
4. 確認可以讀取官方網站。只能取得搜尋摘錄而無法展開清單時，先標示能力限制。
5. 確認本次目標市場、官網地區、貨幣與語系，不因瀏覽器自動導向而誤抓其他地區。
6. 建立本次 evidence 工作目錄；先寫入市場、開始時間與來源入口等 metadata，再開始收集。不要等正式 JSON 寫完後才反推 evidence。

通過條件：可識別輸入版本、目標市場與保護範圍。若使用者提供的檔案互相矛盾，先報告矛盾，不自行重新初始化歷史。

### 階段 B：網站資料發現與收集路徑選擇

本階段先回答「資料真正從哪裡來」，再決定如何全量收集。不要看到卡片就直接開始大量點擊。

#### B.1 工具與來源優先序

依下列順序選擇資料來源；前一層足以可靠完成時，不必強迫降到較脆弱的方法：

1. **官方頁面直接載入的結構化資料**：JSON、REST、GraphQL、Next.js data、內嵌 hydration/state、官方 API response 等。
2. **官方 HTML／DOM 中可穩定解析的結構化內容**：例如完整 `href`、data attribute、JSON-LD 或明確綁定的卡片資料。
3. **瀏覽器互動後產生的資料**：需要切換篩選、配置、載入更多、捲動或開啟商品頁才能取得。
4. **搜尋引擎或第三方頁面**：只可作導航、發現線索、俗稱研究或交叉檢查，不可取代官方市場清單與官方售價來源。

若執行環境有 Chrome DevTools MCP 或等效 Network 工具，優先用它觀察頁面實際送出的 Fetch/XHR/GraphQL 請求。若只有 Playwright 或一般 Browser 工具，也可透過頁面行為、DOM、response 監看或執行環境可用能力進行發現。

**Browser／CDP／MCP 強制切換規則（BLOCKING）：**若本任務需要 Network discovery，而內建瀏覽器顯示「沒有可用連線」、無法取得 CDP、無法開啟 Network 面板，或一般 Browser 工具不提供完整 Network inspection，**下一步不是可選建議，而是必須實際嘗試呼叫 `chrome-devtools` MCP**。在完成下列順序前，不得把 Network discovery 標成 `NOT RUN`，也不得直接退回 DOM scraping、curl、搜尋引擎或猜測 endpoint：

1. 先確認工具清單／MCP 設定中是否存在 `chrome-devtools`（或使用者明確指定的等效 Network MCP）。
2. 若存在，**必須實際呼叫它**，開啟或附著目標市場頁面並至少嘗試取得 Network request／response 資訊。僅「看到 MCP 已設定」不算已執行。
3. 呼叫成功時，後續 Network discovery 必須優先使用該 MCP 完成；不得無理由跳回較弱的 DOM 路徑。
4. 若 MCP 啟動、連線或操作失敗，必須把**實際錯誤類型／訊息摘要、嘗試的工具名稱與結果**寫入 `collection-summary.json` 或 `validation-summary.json`，再嘗試 Playwright request/response inspection 或其他已存在的 Network-capable 工具。
5. 只有當 `chrome-devtools` MCP **未配置、不可用，或已實際呼叫但失敗**，且環境中沒有其他可用 Network/response inspection 能力時，才可標記 `Network discovery = NOT RUN / capability unavailable`。
6. 報告中必須區分：`structured endpoint not found`、`MCP invocation failed`、`Network capability unavailable`。三者不是同一結論。
7. **禁止**以「內建 Browser 無連線」作為跳過 MCP 的理由；也禁止在尚未嘗試已配置 MCP 前宣稱「無法檢查 Network」。

`collection-summary.json` 至少應記錄以下工具決策證據（欄位名稱可等價）：

```json
{
  "networkDiscovery": {
    "required": true,
    "builtInBrowserStatus": "available | unavailable | not-applicable",
    "chromeDevtoolsMcpConfigured": true,
    "chromeDevtoolsMcpAttempted": true,
    "chromeDevtoolsMcpResult": "PASS | FAIL | NOT AVAILABLE",
    "fallbackTool": null,
    "notes": null
  }
}
```

若 `chromeDevtoolsMcpConfigured = true` 且本任務需要 Network discovery，卻出現 `chromeDevtoolsMcpAttempted = false`，則**網站資料發現階段直接 FAIL，整體不得宣稱完整完成**。

若所有瀏覽器、MCP 與 Network 能力都不可用，明確標示限制，不得假裝已檢查 Network。

不得自行安裝未獲授權的依賴；但「不得安裝」不等於「不得呼叫已配置的 MCP」。已存在且與任務相關的 MCP 應依本節強制使用。

#### B.2 Network／結構化來源發現

首次開啟目標市場的完整配置頁時，先記錄並判斷：

- 實際地區 URL、locale、market、cookie／地區導向是否正確。
- 哪一個請求載入腕錶清單、價格、配置、下一批資料或篩選結果。
- HTTP method、endpoint、query parameters、request body、必要但非敏感的 headers。
- 分頁方式：page、offset、limit、cursor、after、token、批次大小，或其他機制。
- response 中哪個欄位對應 `modelReference`、系列、當地名稱、價格、圖片、商品 URL、新款標示。
- response 是否同時包含所有配置，還是只含基本型號／代表款；不要只因 response 很大就假定它是完整配置層級。
- 將已確認可公開保存的 endpoint、參數、分頁方式與 response 欄位對應寫入本次 `collection-summary.json`。
- 是否需要先做某個 UI 動作，才會產生不同配置或價格請求。

發現 endpoint 後，先用少量請求重現：相同市場與參數應得到與 UI 可對應的資料。確認它屬於 Rolex 官方網站正常頁面流程，不繞過登入、權限、驗證或網站存取限制。

不得把觀察到的 Cookie、Authorization、session token、anti-CSRF token 或其他敏感值寫進 README、正式 JSON 或長期證據檔。若 endpoint 只能依賴短期 session 才能呼叫，可在同一次受控瀏覽器工作階段內使用，但不得將敏感憑證持久化。

#### B.3 選擇主要收集方式

若已找到可重現且資料語意明確的官方結構化來源：

1. 以結構化來源作為**主要全量收集路徑**。
2. 依實際分頁／cursor 規則逐批取得，累積完整配置集合。
3. 保存每批的請求範圍、唯一配置數、重複數、下一頁狀態與錯誤。
4. 不因 API 回傳數與既有 catalog 相同就停止；以該來源自己的分頁終止條件證明到底。
5. 再用 Browser／Playwright 對代表性配置、最低／最高價、同基本型號不同配置及異常案例做 UI 回對。

若找不到可重現的結構化來源，或其內容不足以區分完整配置：

1. 先確認這是「已完成 Network discovery 但未找到／不足」，還是「目前環境根本沒有能力完成 Network discovery」。
2. 前者才可記錄為「未找到可用 structured endpoint」；後者只能標記為「Network discovery NOT RUN / capability unavailable」。
3. 接著才改用瀏覽器 DOM／互動作為主要收集路徑。
4. 明確記錄為何 Network 路徑不可用或不足。
5. 依下一節的 UI 分頁／載入更多規則證明完整性。

**禁止的捷徑：**不要從既有 JSON 猜 endpoint；不要把另一市場的 API response 當本市場資料；不要只修改 URL locale 後假定 response 屬於目標市場；不要使用未經頁面實際請求或官方頁面可驗證的私人／內部端點來湊資料。

### 階段 C：找出完整配置清單與 UI 行為

1. 從官方地區入口進入腕錶搜尋／尋找腕錶頁。
2. 確認目前視圖顯示「配置」，而非只顯示每個系列或基本型號的一張代表卡片。
3. 清除系列、尺寸、材質、錶面、性別、新款等限制性篩選。
4. 記錄實際 URL、地區語系、選取的視圖及篩選狀態。
5. 擷取目前已載入的完整配置鍵，建立集合；不要先用既有 catalog 篩掉陌生配置。
6. 找出下一頁、載入更多、無限捲動或配置切換機制。

日本在 2026-09-01 使用的入口是 [完整配置視圖](https://www.rolex.com/ja-jp/watches/find-rolex?group=0)，載入更多按鈕為「さらに見る」。這是已觀察案例，不保證網站日後仍使用同樣網址參數、文字或 DOM。

### 階段 D：逐批展開，證明真的到底

本階段適用於主要收集路徑需要 UI 互動，或用 UI 驗證結構化來源是否完整的情況。若主要收集使用 API／JSON，應把下列「每輪」對應到每個 page／cursor 批次，並以 Network 分頁終止條件作為主要停止證據；UI 則提供獨立交叉驗證。

每輪操作：

1. 擷取當前配置鍵及資料，合併到累積集合。
2. 記錄「操作前唯一數、操作後唯一數、按鈕／游標狀態、載入狀態」。
3. 點擊下一批或捲動至觸發區域。
4. 等待載入結束與 DOM 穩定，再重讀結果。按鈕暫時消失不能立刻當作結束。
5. 繼續直到真正符合以下完成條件。

完成條件依主要收集路徑判斷，但必須有可重現的終止證據。

若主要路徑是結構化 endpoint，至少同時成立：

- endpoint 已回傳明確的最後一頁／空下一頁／null cursor／hasNextPage=false，或其他已驗證的終止訊號。
- 最後一批請求成功完成，沒有錯誤、逾時、被截斷或重試未解決。
- 使用相同分頁規則再次確認後，不存在尚未讀取的下一 cursor／offset／page。
- 累積唯一完整配置數不再增加，且沒有未解決的重複鍵資料衝突。
- 若 UI 顯示相同口徑的總數，與累積集合一致；若不一致，先釐清口徑，不可選一個方便的數字。

若主要路徑是 Browser／DOM，至少同時成立：

- 沒有仍可前往的下一頁、載入更多或未完成的無限捲動載入。
- 最後一次載入已結束，沒有錯誤、逾時、重試按鈕或卡住的載入提示。
- 頁面穩定後再次檢查，累積唯一配置集合沒有增加。
- 若官網顯示相同口徑的總數，唯一配置數與總數一致；先確認它不是「基本型號數」。
- 如頁面另外提供未納入主清單的配置切換，已核對其完整配置，或已清楚報告尚未涵蓋。

如果下一頁仍存在，但操作後沒有新配置，這是異常，不是完成。進行有限次重試並記錄；仍失敗就停止宣稱完整。

若網站使用虛擬列表，捲動會移除先前卡片，必須逐批累積，而不是最後才讀一次 DOM。重複卡片可能只是響應式版面或載入批次重疊；依完整配置去重並記錄重複數。相同配置若有不同價格，列為衝突，不能直接挑第一個或最後一個。

不得用以下理由宣稱完整：

- 「抓到 56 筆，頁面最初就是這些。」
- 「抓到的筆數剛好與某個既有市場相同。」
- 「搜尋引擎只找到這些。」
- 「我已經捲動很多次。」

### 階段 E：建立 Evidence observations 並擷取每個完整配置

先建立或更新本次 `evidence/[marketCode]/[YYYY-MM-DD]/observations.json`。它是正式 JSON 的來源證據，不只是任意暫存檔。至少記錄：完整型號、來源網址或來源 endpoint、當地名稱、錶殼文字、錶面或原始 alt 文字、原始價格文字、貨幣、已解析價格、新款標示、取得時間及批次。若來源提供 `totalCount`／`resultCount`／cursor，也一併保留。

- 從同一個配置卡片或對應的商品頁讀取資料，避免將相鄰卡片的價格配到錯誤型號。
- 商品 href 可解析完整型號；錶面描述可來自明確對應該配置的官方圖片 alt。先查核其語意與綁定關係，不靠固定位置硬切。
- 官方圖片 URL 要保留原值並確認完整配置；不能僅將舊圖網址中的型號替換成新型號，就假定圖片存在。
- 卡片資料已足夠時可以批次擷取；仍應執行第 7.7 節的獨立抽查。不要聲稱逐頁核對全部，除非真的逐頁完成。
- 不要用其他市場的翻譯補成「當地官網原文」。
- 新增配置缺少 catalog 必填穩定欄位時，列為待查，不虛構欄位以完成合併。

原始價格文字是查錯與重跑 parser 的證據，不是把 `formattedPrice` 加回正式 JSON 的理由。Evidence 不得含登入資訊、Cookie、Authorization、session token 或其他敏感資料。

Evidence 必須先通過基本自洽檢查再餵給正式資料層：`resultCount` 應與 observations 長度一致；唯一 `modelReference` 數、重複數與衝突數要計算；同一 `modelReference` 若出現不同價格或不同關鍵欄位，必須列為衝突而非任選一筆。

## 6. 正式資料正規化與更新

Evidence 通過基本自洽檢查後，才進入正式資料更新。以下階段處理價格語意、俗稱、Catalog／Market 合併、Price History 與最後寫入。

### 階段 F：解析價格與確認稅制

先辨識貨幣與數字格式，再解析。例如以下只是解析測試資料，不是實際腕錶報價：

| 原始文字 | 前提 | 應得結果 |
| --- | --- | ---: |
| `¥ 2,433,200` | 日本 JPY、逗號為千分位 | 2433200 |
| `NT$ 556,000` | 台灣 TWD、逗號為千分位 | 556000 |
| `9.500 €` | 已確認德語格式，點為千分位 | 9500 |
| `9.500,50 €` | 德語格式，具有非零小數 | 停止：現有整數契約不適用 |
| 空白或尚未載入 | 沒有有效報價 | 解析失敗，不是 0 |

不要對所有國家直接套用「移除所有非數字字元」；那會把小數價格錯放大。

| `priceType` | 意義 |
| --- | --- |
| `tax-include` | 公開價格已包含適用銷售稅／消費稅 |
| `tax-exclude` | 公開價格尚未包含適用稅項 |
| `no-tax` | 該價格情境確實不課徵此稅；不是「不知道」 |

稅制查核順序：當地官方價格說明 → 政府／稅務機關 → 可信的補充資料。確認標準腕錶商品、當地稅區與適用日期，不套用食品優惠稅率、旅客退稅或特殊免稅購物規則。

- 稅率用百分點：10% 存 10，不是 0.1。
- 無統一稅率或尚未確定時，`taxRatePercent` 可為 null；不能用 0 冒充未知。
- 美國等地的銷售稅可能因州與地方而不同，不可虛構一個全國單一稅率。
- 若連含稅／未稅都不能確認，現有必填 `priceType` 沒有 unknown；先保留為待查，不亂選。
- 同一歷史檔頂層的貨幣、稅率與計價方式會影響所有舊資料。若後來改變，先提出資料契約遷移方案；不可直接覆寫頂層，造成舊價格被重新解釋。

已有專案採用的查核起點如下；每次更新仍需檢查適用性，不將本文件當作最新稅法：

- 台灣：[財政部營業稅試算](https://www.etax.nat.gov.tw/etwmain/etw158w/40)、[營業稅法](https://law-out.mof.gov.tw/LawContent.aspx?id=FL006082)。
- 日本：[國稅廳消費稅率](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6303.htm)、[總額表示](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6902.htm)。

稅務來源、適用範圍與查核日期寫在 README，不新增已刪除的 `researchSources.tax` 或 `taxName`。

### 階段 G：別名與俗稱研究（Mandatory when applicable）

`collectionAliases` 與 `watches[].localNicknames` 不是可因為「不好找」就默認跳過的裝飾欄位。對**新增市場、補齊不完整市場，或使用者要求完整市場資料**的任務，本階段必須實際執行並留下研究證據。只有純價格更新、且使用者未要求重查俗稱時，才可保留既有資料並將本階段標記為 `NOT RUN (out of scope)`。

#### G.1 研究方法

1. 先區分官方系列名稱、一般描述與市場俗稱；官方名稱本身不因重複出現就自動算俗稱。
2. 使用**目標市場的主要語言與實際在地用語**搜尋腕錶媒體、論壇、社群、零售／二級市場文章及其他可追溯公開來源。必要時可加入完整型號、系列名、顏色、材質或常見英文稱呼作輔助查詢，但不得只靠其他市場的俗稱翻譯後直接採用。
3. 整個系列普遍使用、且適用範圍可證明的名稱放 `collectionAliases[collectionId]`。
4. 僅適用於特定外圈、材質、錶面、配置或完整 `modelReference` 的名稱，只放在對應的 `watches[].localNicknames`。
5. 每個接受名稱至少要有一個可追溯且直接支持該名稱與適用範圍的來源；若要聲稱「常見」、「普遍」或類似強度，應有多個彼此獨立的來源，而不是同一篇文章的轉載。
6. 最多收錄五個有證據的常見配置俗稱；不足五個就少填，不為湊數製造資料。
7. 沒有可重現的統計方法時，不宣稱「全網前五名」。README 應說明採樣來源與選取方式。

#### G.2 Evidence 與狀態要求

本次 `validation-summary.json` 必須包含 `nicknameResearch`（名稱可等價，但語意不可省略），至少記錄：

```json
{
  "nicknameResearch": {
    "status": "PASS | FAIL | NOT RUN",
    "scope": "new-market | backfill | refresh | price-only",
    "languages": [],
    "queries": [],
    "sourcesReviewed": 0,
    "candidateCount": 0,
    "acceptedCollectionAliasCount": 0,
    "acceptedLocalNicknameCount": 0,
    "rejectedCandidates": [],
    "notes": null
  }
}
```

- `PASS` 可以是「有接受結果」，也可以是 **`PASS with 0 accepted results`**；後者代表研究確實完成，但沒有找到足夠可靠、適用範圍明確的名稱。
- `NOT RUN` 代表未執行，**不能解讀成查無俗稱**。必須寫明原因，例如 `out of scope`、`capability unavailable` 或其他限制。
- `FAIL` 代表已嘗試研究但出現無法完成的錯誤、來源不足以判定、或資料互相衝突。
- `queries` 應保存能說明研究範圍的查詢詞；不必保存搜尋服務的個人化識別資訊。
- `rejectedCandidates` 至少記錄有實質可能性但最終未採用的候選名稱與拒絕原因，例如「僅單一來源」、「只在英文市場使用」、「適用範圍不明」、「其實是官方名稱」。

#### G.3 空陣列的解讀

`collectionAliases: {}` 或 `localNicknames.names: []` **本身不具有研究狀態語意**。空值只有在 validation evidence 能證明下列其中之一時才可正確解讀：

- 已完成研究，結果為 `PASS with 0 accepted results`；或
- 本次是允許不重查俗稱的有限範圍任務，狀態為 `NOT RUN (out of scope)`，且既有俗稱資料完整保留。

對新增市場／補齊市場，如果 `nicknameResearch.status === "NOT RUN"`，不得把「市場資料完整性」或整體發布狀態報告為完全 `PASS`；必須列為部分完成，除非使用者明確排除俗稱研究。

不要把「水鬼」或某個顏色俗稱機械式複製到所有配置，也不要把其他市場的俗稱直接翻譯成當地俗稱。只更新價格時，保留已有且未被證明錯誤的別名與來源，不用空陣列覆蓋。

### 階段 H：合併 catalog 與市場資料

令 C 為既有 catalog 完整配置集合，M 為本次已驗證的市場配置集合。

- 交集：`C ∩ M`，只核對，不重複加入 catalog。
- 新配置：`M − C`，取得全部穩定欄位後加入。
- 本次未觀察到：`C − M`，保留 catalog，不能據此直接標記未販售。
- 更新後 catalog：`C ∪ M`；若存在未解決的新配置，應先解決或明確報告部分完成。
- 數量核對：`|C ∪ M| = |C| + |M| − |C ∩ M|`。

相同完整配置出現不同基本型號或不同系列等穩定欄位時，先查來源，不用後寫覆蓋先寫來隱藏衝突。

保留既有腕錶順序，新配置按 `modelReference` 排序後追加。保留既有 JSON 兩格縮排、UTF-8 及尾端換行，避免無意義的全檔重排。

市場檔保留既有配置的當地別名；官方文字以本次確實取得的值更新。對未觀察到的舊配置，預設保留已知文字並在 README 說明其非本次觀察，不能把舊值聲稱為重新查核；若要將市場檔改成僅含當前列出配置，先與使用者確認。官方明確下架的狀態由歷史檔表達。

### 階段 I：追加價格歷史，不改寫過去

1. 新市場第一次收集使用 `runId: 1`；既有市場用該歷史檔最大 runId + 1。
2. 每個 runId 對應一次實際觀察批次；處理同一份暫存資料重試寫檔，不應重複建立 run。
3. `recordCount` 是本次成功接受的唯一配置觀察數，不是新價格點數，不是 catalog 總數。
4. 若批次包含額外確認的 `not-listed`，在查核摘要分別列出「官網列出數」與「已確認未列出數」；recordCount 包含本次有證據接受的兩類觀察，不包含推測缺漏。
5. 新配置第一次被觀察到：建立基準價格／狀態點，時間不能追溯到尚未觀察的舊 run。
6. 已有配置：只比較最後一筆的 `listingStatus` 與 `price`；至少一項改變才追加點。
7. 價格與狀態未變：保留原序列，不新增重複點；本次 run 仍存在。
8. 未取得可靠觀察：不追加價格點，不將它改成 null、0 或 `not-listed`。
9. 舊資料若其實是擷取錯誤，應提出資料更正，不把更正偽裝成真實漲跌。未經確認不要回寫舊紀錄。

更新判斷：

```text
for each accepted observation:
    if no prior series:
        create first point at current runId
    else if status differs OR price differs:
        append one point at current runId
    else:
        leave the series unchanged
```

歷史檔是稀疏變動紀錄，不是每次全量快照。前端的「目前價格」是最後已知觀察，並非即時價格；每個點的日期由 runId 關聯 collectionRuns 取得。不要在第一個觀察日期之前畫出價格，也不要把最新全域 run 誤當成每個配置都有重新查核的證明。

現有 Schema 不儲存每次 run 的完整型號成員清單，也無法只靠它證明所有配置最後查核時間。每次完整性、成員集合與差集應保留於查核證據；若前端日後需要逐配置的新鮮度或重現每次快照，再另外設計並確認契約。

### 階段 J：時間與最後寫入

- 從實際系統時鐘取得時間，不能照抄本文件的範例日期。
- 使用帶時區偏移的 ISO 8601；台灣採 `+08:00`，日本採 `+09:00`。其他地區需依日期處理夏令時間。
- 市場檔 `collectedAt` 與同一次歷史 run 的時間保持一致。本專案以批次完成時間記錄；較長的擷取另在查核摘要寫明開始與結束區間。
- Catalog 若只做合併規則說明而未改動配置資料，保留原收集時間；若真的新增或更新配置，記錄相應實際收集時間。它不是所有市場的同步更新時間。
- 通過驗證後才替換正式檔案。若只能部分完成，保留暫存成果並說明；不要靜默把一份完整市場檔替換成不完整清單。
- 不改動無關市場。若涉及必要 Schema 遷移，先取得同意，然後同步文件與所有受影響檔案。
- **README 同步是正式寫入的一部分，不是交付摘要的可選附加項。** 若本次新增／更新市場、價格歷史、Catalog、evidence、來源 endpoint、收集方式、涵蓋數、驗證結果、俗稱研究結果或限制，必須在同一批次更新 `README.md` 對應內容。
- 若 Repo 原本沒有 `README.md`，且任務建立了新的正式市場資料，則必須依本指南的 README 最低內容建立一份；不得因「沒有舊 README 可更新」而省略。
- 正式 JSON/evidence 已變更但 README 未同步時，本階段 **FAIL**；不得進入「完整完成」發布狀態。

## 7. 驗證與獨立查核

### 7.1 五層驗證總覽

| 層級 | 要回答的問題 | 可接受的證據 |
| --- | --- | --- |
| 1. 語法與 Schema | 檔案是否合法？ | 嚴格 JSON 解析、三個實際 Schema 的驗證結果 |
| 2. 跨檔案一致性 | 型號、數量、歷史關聯是否正確？ | 集合、唯一鍵、runId、欄位關聯的測試結果 |
| 3. 原始資料回對 | 有沒有抓錯、解析錯或配錯價格？ | 全量輸出對原始觀察表的逐筆比對 |
| 4. 網站完整性 | 是否真的收集完？ | Network／endpoint 發現紀錄、API 或 UI 分頁紀錄、停止證據、視圖／篩選狀態、系列拆分 |
| 5. 變更安全 | 有沒有破壞歷史或無關資料？ | 修改前後差異、雜湊、舊價格點前綴比對 |

另外要求 **evidence traceability**：本次正式輸出的每個接受觀察，都應能回指本次 evidence；正式 JSON 中不應出現本次 evidence 完全不存在、又沒有另行說明來源的新增事實。

五層都要報告。單獨顯示「JSON valid」不構成完成。

### 7.2 語法與 Schema

- 用支援 JSON Schema Draft 2020-12 的驗證器讀取實際三個 Schema。
- 明確啟用 date-time、URI 等 format 檢查；有些驗證器預設只將 format 當註解。
- 驗證資料，而不是只驗證 Schema 本身。
- 所有必填欄位、型別、列舉值、additionalProperties 限制均通過。
- 檢查 JSON 重複物件 key：一般 JSON.parse 會靜默保留最後一個，不能用它證明不存在重複 key。
- 檢查 UTF-8、合法時間偏移、可解析的 URL；沒有註解、尾隨逗號、NaN 或省略號。
- 驗證器不可用時，報告 Schema 檢查為 NOT RUN，不能把手工抽看稱作完整 Schema 驗證。是否安裝依賴依環境授權決定。

### 7.3 跨檔案關聯

- 每個 catalog／市場檔：`watchCount === watches.length === unique(modelReference).size`。
- 每個市場配置、每條價格序列都能連到 catalog；孤兒型號數為 0。
- Catalog 配置鍵等於基本型號加四位配置碼。
- 市場檔與其歷史檔的 marketCode 一致。
- 本次接受的每個觀察都有對應的市場資料及最後已知價格／狀態；確認未列出但從未收集過文字的配置須另列處理例外，不能偽造市場文字。
- 所有 point.runId 存在於該市場的 collectionRuns。
- runId 不重複、依時間及 ID 遞增；同一配置同一 run 不得有兩個價格點。
- `listed` 搭配整數價格；其他兩種狀態搭配 null。
- 相鄰價格點不應有相同的狀態與價格。
- 用本次原始成員集合驗證 recordCount，而不是要求它等於該 run 的新增點數。

### 7.4 全量來源與價格回對

對本次每一個接受的配置，比對：

1. 完整型號與來源商品 URL 對應。
2. 當地名稱、錶殼描述、錶面描述與原始觀察一致。
3. 貨幣與目標市場一致。
4. 原始價格經明確的地區格式解析後，等於歷史最後一個點的 price。
5. 新款標示與原始觀察一致。
6. 價格衝突、解析失敗、未知幣別、無關配置的圖片均為 0，或明確列為未完成。

列出最低／最高價格、各系列配置數、已列出且有價／無公開價／已確認未列出數。這些統計用於發現異常，不應用硬編碼正常範圍抹除罕見高價款。

### 7.5 變更與歷史保留

- 修改前每條價格序列，應仍是修改後序列的完整前綴；不能改掉舊 runId、狀態或價格。
- 舊 collectionRuns 不變，新 run 只追加一次。
- 已有俗稱與來源未遭無理由清空。
- Catalog 舊配置不因本次缺漏而消失。
- 非目標市場與未授權變更的 Schema 雜湊不變。
- 查看版本差異，確認沒有意外全檔重排、內容截斷、編碼損壞或巨大無關修改。

### 7.6 Evidence 可追溯性

- `observations.json` 的 observation 數量、唯一配置數、重複與衝突統計與 collection summary 一致。
- 本次新增／更新的市場文字與價格，能以 `modelReference` 回對 evidence。
- 正式檔中的數字價格等於 evidence 中原始價格依該地區規則解析後的結果。
- 若正式資料使用了 evidence 以外的補充官方來源，validation summary 必須列出型號、欄位與來源。
- Evidence 不得含敏感憑證；可做簡單敏感字串掃描，例如 `authorization`、`cookie`、`token`、`session`，發現後人工確認並移除秘密值。
- Evidence 的來源 URL／endpoint 必須與目標市場一致；不能出現未說明的跨市場混用。

此層不要求 evidence 本身符合三個正式 JSON Schema；它驗證的是「正式結果是否真的能追溯到本次來源事實」。

### 7.7 別名／俗稱研究驗證

- 新增市場、補齊不完整市場或完整市場建立任務，`nicknameResearch.status` 不得缺失。
- `PASS` 時必須可看到實際研究範圍：至少有目標語言、查詢詞與已檢閱來源數。
- 正式 `collectionAliases` 與所有非空 `localNicknames` 必須能回指研究來源；不得出現只有名稱、沒有來源的接受結果。
- 若正式欄位全部為空，但 `status = PASS`，validation summary 必須明確寫出 `acceptedCollectionAliasCount = 0`、`acceptedLocalNicknameCount = 0`，並說明已完成研究而非未執行。
- 若 `status = NOT RUN`，不得用「沒有可靠俗稱」描述結果；應描述為「本次未執行俗稱研究」。
- 既有市場做有限範圍更新時，`NOT RUN (out of scope)` 不得清空既有 aliases／nicknames。
- 候選名稱若只由單一弱來源支持、跨市場語言直接移植、或適用範圍不明，應拒絕並保留理由，而不是為了填欄位接受。

### 7.8 README 同步驗證（Blocking）

README 驗證不是文字潤飾，而是發布一致性檢查：

- 若本次任何正式資料或 evidence 有變更，確認 `README.md` 確實有對應 diff；沒有變更且無明確「README 無需更新」理由時，判定 **FAIL**。
- README 至少同步本次市場／語系、官方來源、主要收集路徑與 endpoint／UI、觀察時間、配置／系列數、Catalog 差集、價格歷史 run、evidence 路徑、俗稱研究、驗證結果與限制中所有實際發生變化的項目。
- README 中的數字、runId、時間、marketCode、evidence 路徑必須與正式 JSON／evidence 一致，不得手工留下上一批結果。
- 新增市場時，README 必須新增該市場的涵蓋說明；只新增 JSON 而 README 沒有市場紀錄，整體發布 **FAIL**。
- 若 README 本次確實不需變更，validation summary 必須明確記錄 `readmeUpdate.status = "NOT REQUIRED"` 與理由；不可靜默跳過。

建議在 `validation-summary.json` 保存：

```json
{
  "readmeUpdate": {
    "status": "PASS | FAIL | NOT REQUIRED",
    "updated": true,
    "sections": [],
    "reason": null
  }
}
```

### 7.9 官網獨立抽查


不要只用同一段抽取程式同時生成與「驗證」自己。若主要收集使用官方結構化 endpoint，獨立抽查應優先用 rendered UI／商品頁；若主要收集使用 DOM，則優先用 Network response、另一個官方視圖或商品頁交叉驗證。生成路徑與驗證路徑應盡量不同。

- 每個本次出現的系列至少抽一個配置，以完整型號對照官方商品頁或另一個獨立官方視圖。
- 加查至少兩組「同基本型號、不同配置碼」的組合；如實際不足則全查並說明。
- 最低價、最高價、缺價格、新款、衝突及異常漲跌配置另行查核。
- 每個發現差異的配置，都要回頭檢查同類解析規則及受影響全量資料，不只修正單一樣本。
- 記錄實際抽查型號、來源 URL、時間、比對欄位與結果。不能只寫「已抽查」。

這是未來每次執行的驗收要求，不代表歷史批次已完成同樣的詳情頁抽查。

### 7.10 必須會攔下的反例

在臨時副本或記憶體資料測試，不能破壞正式檔案：

| 反例 | 正確結果 |
| --- | --- |
| 複製同一完整配置，watchCount 也跟著加一 | 唯一鍵檢查仍失敗 |
| 同基本型號的兩個不同配置 | 均保留，不誤判重複 |
| 新市場出現 catalog 未收錄配置 | 完整取得穩定欄位後加入聯集，不丟棄 |
| 市場型號不存在 catalog | 跨檔案檢查失敗 |
| 價格點引用不存在的 runId | 歷史關聯檢查失敗 |
| listed 卻給 null／字串價格 | 型別或狀態檢查失敗 |
| 相鄰兩點價格與狀態完全相同 | 冗餘價格點檢查失敗 |
| 未變價但新增一次觀察批次 | 追加 run，不追加重複價格點 |
| 原本 listed，確認變為 price-unavailable | 即使沒有數值價格，也追加狀態變更點 |
| 抓完第一批但仍有下一頁 | 完整性 FAIL，不能發布為全量 |
| 下一頁逾時，暫時找不到按鈕 | 標示抓取失敗，不是正常到底 |
| 目標市場筆數比既有市場少 | 查差集，不補算價格、不自動標記 not-listed |
| 重複物件 key、NaN 或尾隨逗號 | 嚴格 JSON 解析失敗 |
| 含非零小數的歐元價格 | 停止並提出整數契約限制，不放大 100 倍 |
| 已完成俗稱研究但沒有可靠候選 | names／sources 可保留空陣列，但 validation 必須為 PASS with 0 accepted results 並保存研究證據 |
| 俗稱研究根本沒執行 | 不得寫「沒有可靠俗稱」；標記 NOT RUN，新增／補齊市場不得宣稱完整完成 |
| 正式 JSON／evidence 已更新，但 README 沒有更新 | 發布 FAIL；必須同步 README 後重新驗證 |
| 內建 Browser/CDP 不可用，但已配置 chrome-devtools MCP，模型沒有實際呼叫 | Network discovery FAIL；不得直接退回 DOM 或宣稱 capability unavailable |

### 7.11 可執行的驗證片段

以下是驗證工具，不是資料生成器。從包含 catalog、markets、history、schemas 的專案根目錄執行。不要為了讓測試通過而更改輸入資料或硬編碼筆數。

#### 7.11.1 嚴格解析：重複 key 與非法數值

將下列 Python 內容交給已安裝的 Python 3 執行；不需要第三方套件：

```python
import json
from pathlib import Path

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result

def invalid_constant(value):
    raise ValueError(f"invalid JSON constant: {value}")

paths = sorted(
    path
    for folder in ("catalog", "markets", "history", "schemas")
    for path in Path(folder).rglob("*.json")
)
if not paths:
    raise RuntimeError("No JSON files found; check working directory")
for path in paths:
    json.loads(
        path.read_text(encoding="utf-8"),
        object_pairs_hook=unique_object,
        parse_constant=invalid_constant,
    )
print(f"PASS: strict JSON parsing, {len(paths)} files")
```

此步不檢查 Schema、網站完整性或價格是否真實。

#### 7.11.2 跨檔案不變條件

將下列 JavaScript 內容交給已安裝的 Node.js 執行；只使用內建模組。適用於本文件的現有契約，並要求已收集的市場配置都有價格歷史。它不取代 Schema、重複 JSON key 檢查或來源回對。

```javascript
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = (condition, message) => assert(condition, message);
const refPattern = /^m[0-9a-z]+-[0-9]{4}$/;
const validTime = t => typeof t === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(t) &&
  Number.isFinite(Date.parse(t));

function checkWatches(data, label) {
  const refs = data.watches.map(w => w.modelReference);
  fail(data.watchCount === refs.length, label + ': watchCount mismatch');
  fail(new Set(refs).size === refs.length, label + ': duplicate reference');
  fail(refs.every(r => refPattern.test(r)), label + ': invalid reference');
  fail(validTime(data.collectedAt), label + ': invalid collectedAt');
  return new Set(refs);
}

const catalog = read('catalog/rolex-catalog.json');
const catalogRefs = checkWatches(catalog, 'catalog');
fail(new Set(catalog.sourceMarketCodes).size === catalog.sourceMarketCodes.length,
  'duplicate sourceMarketCodes');
const collectionIds = new Set(catalog.watches.map(w => w.collectionId));
for (const w of catalog.watches) {
  fail(w.modelReference === w.modelNumber + '-' + w.configurationCode,
    'catalog reference parts mismatch: ' + w.modelReference);
  fail(typeof w.configurationCode === 'string' && /^\d{4}$/.test(w.configurationCode),
    'configurationCode must be a four-digit string');
}

const files = fs.readdirSync('markets').filter(f => /^rolex-.+-market\.json$/.test(f));
fail(files.length > 0, 'no market files found');
const marketCodes = new Set();
for (const file of files) {
  const market = read(path.join('markets', file));
  checkWatches(market, file);
  fail(!marketCodes.has(market.marketCode), 'duplicate marketCode');
  marketCodes.add(market.marketCode);
  fail(catalog.sourceMarketCodes.includes(market.marketCode), 'market not reconciled in catalog');
  for (const id of Object.keys(market.collectionAliases)) {
    fail(collectionIds.has(id), 'unknown collection alias key: ' + id);
  }
  const history = read(path.join('history', market.marketCode, 'rolex-price-history.json'));
  fail(history.marketCode === market.marketCode, 'market/history code mismatch');
  fail(/^[A-Z]{3}$/.test(history.currencyCode), 'invalid currency code');
  fail(['tax-include', 'tax-exclude', 'no-tax'].includes(history.priceType), 'invalid priceType');
  fail(history.taxRatePercent === null ||
    (Number.isFinite(history.taxRatePercent) && history.taxRatePercent >= 0 &&
      history.taxRatePercent <= 100), 'invalid tax rate');
  fail(history.collectionRuns.length > 0, 'missing collection runs');
  const runs = new Map();
  let lastId = 0;
  let lastTime = -Infinity;
  for (const run of history.collectionRuns) {
    fail(Number.isSafeInteger(run.runId) && run.runId > lastId, 'runIds not strictly increasing');
    fail(validTime(run.collectedAt), 'invalid run time');
    const time = Date.parse(run.collectedAt);
    fail(time >= lastTime, 'run times out of order');
    fail(Number.isSafeInteger(run.recordCount) && run.recordCount >= 0, 'invalid recordCount');
    runs.set(run.runId, run);
    lastId = run.runId;
    lastTime = time;
  }
  for (const w of market.watches) {
    fail(catalogRefs.has(w.modelReference), 'market orphan: ' + w.modelReference);
    fail(Object.hasOwn(history.priceSeries, w.modelReference),
      'market configuration missing price history: ' + w.modelReference);
  }
  const pointCounts = new Map();
  for (const [ref, points] of Object.entries(history.priceSeries)) {
    fail(catalogRefs.has(ref), 'history orphan: ' + ref);
    fail(Array.isArray(points) && points.length > 0, 'empty price series: ' + ref);
    let previous;
    for (const point of points) {
      fail(runs.has(point.runId), 'unknown runId: ' + ref);
      fail(['listed', 'price-unavailable', 'not-listed'].includes(point.listingStatus),
        'invalid listingStatus: ' + ref);
      fail(point.listingStatus === 'listed'
        ? Number.isSafeInteger(point.price) && point.price >= 0
        : point.price === null, 'price/status mismatch: ' + ref);
      if (previous) {
        fail(point.runId > previous.runId, 'series run order error: ' + ref);
        fail(point.price !== previous.price || point.listingStatus !== previous.listingStatus,
          'redundant unchanged point: ' + ref);
      }
      pointCounts.set(point.runId, (pointCounts.get(point.runId) || 0) + 1);
      previous = point;
    }
  }
  for (const [id, count] of pointCounts) {
    fail(count <= runs.get(id).recordCount, 'new points exceed accepted observations');
  }
  console.log('PASS:', file, 'stored configurations:', market.watchCount);
}
console.log('PASS: cross-file invariants; NOT a completeness or source-accuracy test');
```

本片段只確認新增價格點數不超過 recordCount；不能證明 recordCount 等於本次實際觀察數。後者一定要使用本次暫存觀察集合另外比對。

## 8. 交付與發布門檻

先完成並儲存檔案，再提供連結。不只貼幾筆 JSON 範例，也不聲稱建立了實際不存在的檔案。

應交付：

1. 已更新的目標市場 JSON。
2. 已追加的目標市場價格歷史 JSON。
3. Catalog 若有新增配置、穩定資料修正或新市場代碼才更新；未變動則明說未變。
4. 本次 `evidence/[marketCode]/[YYYY-MM-DD]/`：至少包含 observations 與收集／驗證摘要；若因 Repo 政策未保存，必須說明原因。
5. **更新後 `README.md`（必要交付物）**：來源、涵蓋範圍、收集時間、稅務依據、系列筆數、差集、evidence 路徑、Network/MCP 收集路徑、俗稱研究與驗證摘要。若正式資料或 evidence 有變更而 README 未同步，交付不成立。
6. Schema 只有經同意修改時才交付新版本。本任務預設不輸出生成腳本。

README 或交付摘要至少填入以下內容，方括號必須換成真實值：

| 報告項目 | 應填內容 |
| --- | --- |
| 市場與語系 | [marketCode、locale、實際官方 URL] |
| 觀察時間 | [開始／完成時間及時區] |
| 清單覆蓋 | [主要收集路徑、結構化 endpoint／UI 視圖、限制性篩選、分頁或 cursor 操作與結束證據] |
| 本次配置 | [原始卡片數、唯一完整配置數、重複數、衝突數] |
| 系列數 | [總數與各系列拆分] |
| Catalog 合併 | [原總數、交集、新增、更新後總數、未解決差集] |
| 價格狀態 | [有價、確認無公開價、確認未列出、未解決數] |
| 歷史更新 | [runId、recordCount、新基準點、價格／列出狀態變更點、未變數] |
| 稅制 | [幣別、priceType、稅率或未知原因、來源及適用日期] |
| 五層驗證 | [逐項 PASS／FAIL／NOT RUN，附方法與數量] |
| 獨立抽查 | [型號、來源、結果；若未做明確寫 NOT RUN] |
| Evidence | [目錄、observations 數、來源 endpoint／UI 路徑、是否納入 Git、敏感資料掃描結果] |
| 別名／俗稱研究 | [PASS／FAIL／NOT RUN、語言、queries、sourcesReviewed、候選數、接受的 collection aliases／local nicknames 數、主要拒絕原因] |
| 保護範圍 | [未改動的市場／Schema，歷史保留結果] |
| 限制 | [未完成項目；不能用「無」隱藏沒有執行的檢查] |

以下任一條件成立時，**不得宣稱完整完成／不得將整體狀態標為 PASS**：

- 本次正式資料或 evidence 有變更，但 `README.md` 未建立／未更新／內容與實際結果不同。
- 本任務需要 Network discovery，且已配置 `chrome-devtools` MCP，但沒有實際呼叫紀錄。
- 內建 Browser/CDP 不可用後，直接改走 DOM／curl／搜尋而未先嘗試已配置的 Network MCP。
- Network/MCP 嘗試失敗但 evidence 沒有保存失敗狀態與限制。

只有完成分頁、全量資料回對、README 同步及全部必要驗證，才能寫「已完成目前官網公開清單的全部配置」。應附上範圍限定：不代表全球所有配置、歷年停產產品、門市庫存或未公開銷售款式。

### 8.1 最後一次自我檢查

- [ ] 我沒有把初始批次當成全部。
- [ ] 對 JavaScript 網站，我已先檢查官方頁面使用的結構化資料來源；若未能檢查，已明確標示能力限制。
- [ ] 若內建 Browser/CDP 不可用且 `chrome-devtools` MCP 已配置，我**實際呼叫過 MCP**；不是只檢查它存在。
- [ ] `collection-summary.json`／`validation-summary.json` 記錄了 Network discovery 使用的工具、MCP 是否配置、是否實際嘗試及 PASS／FAIL 結果。
- [ ] 若找到可靠 endpoint，我以其真實分頁／cursor 終止條件收集，而不是靠既有筆數停止。
- [ ] 我沒有把 Cookie、Authorization、session token 或其他敏感值保存進正式資料或 README。
- [ ] 我有實際停止證據，而不是以任何歷史筆數當目標。
- [ ] 我保留完整配置碼及前導零。
- [ ] 我沒有用其他國家價格推算。
- [ ] 我沒有把解析失敗當成無公開價格。
- [ ] 我沒有把缺漏或逾時當成 not-listed。
- [ ] 我沒有把當地描述、價格複製回 catalog。
- [ ] 我沒有把價格重新塞進市場檔。
- [ ] 我沒有用未知稅率冒充 no-tax 或 0%。
- [ ] 我沒有捏造或濫用俗稱。
- [ ] 新增／補齊市場時，我實際執行了別名／俗稱研究；若未執行，已標記 NOT RUN 且沒有宣稱「查無俗稱」。
- [ ] 若 `collectionAliases` 與 `localNicknames` 全空，我能由 validation evidence 區分「PASS with 0 accepted results」與「NOT RUN」。
- [ ] 每個接受的別名／俗稱都有支持名稱與適用範圍的可追溯來源。
- [ ] 我保留舊 run、舊價格點、舊別名及無關檔案。
- [ ] 我已回對全量原始觀察，並列出獨立抽查結果。
- [ ] 我明確區分 PASS、FAIL、NOT RUN。
- [ ] 我沒有把 Browser/CDP/Network 工具不可用誤判成「網站沒有 structured endpoint」。
- [ ] 若本次正式資料或 evidence 有任何變更，我已同步更新 `README.md`；若確實不需更新，validation summary 有 `NOT REQUIRED` 與理由。
- [ ] README 的市場、時間、數量、runId、來源、evidence 路徑與驗證結果和實際檔案一致。
- [ ] 我已實際保存可下載檔案，交付摘要與檔案內容一致。
- [ ] 我先保存本次來源事實到 evidence，再由 evidence 產生／驗證正式資料；沒有事後從正式 JSON 反推一份假 evidence。
- [ ] Evidence 中沒有 Cookie、Authorization、session token 或其他秘密。
- [ ] 本次正式新增或更新的事實都能回對 evidence 或明確列出的補充官方來源。

本指南的依據是隨附專案的 [README](README.md)、[Catalog Schema](schemas/rolex-catalog.schema.json)、[Market Schema](schemas/rolex-market.schema.json)、[Price History Schema](schemas/rolex-price-history.schema.json) 與既有台灣／日本資料。它不自動更新市場價格；執行者必須重新取得當次來源證據。

## Appendix A. 歷史回歸案例：日本 2026-09-01

以下數字只記錄當時已完成批次，**不得參與未來完整性判定或停止條件**。

| 指標 | 結果 |
| --- | ---: |
| 最初局部擷取 | 56 |
| 完成全部載入後的唯一配置 | 1,465 |
| 系列數 | 17 |
| 追加補齊的配置 | 1,409 |
| 有公開日圓價格的配置 | 1,465 |
| 與原 catalog 重複的配置 | 1,465 |
| 合併後 catalog 總數 | 1,465 |

日本完整批次時間是 `2026-09-01T17:06:44+09:00`。JP 的 run 1 保留 56 筆觀察，run 2 記錄 1,465 筆成功觀察；原 56 筆未變價，所以只有 1,409 個新基準點。當時共有 1,465 條序列與 1,465 個價格點。

系列拆分：1908 8、Land-Dweller 10、Day-Date 281、Sky-Dweller 39、Lady-Datejust 291、Datejust 681、Oyster Perpetual 62、Cosmograph Daytona 47、Submariner 7、Sea-Dweller 2、Deepsea 4、GMT-Master II 13、Yacht-Master 12、Yacht-Master II 2、Explorer 3、Explorer II 2、Air-King 1。

這些數字不可硬編碼為未來驗收答案。下次得到不同筆數時，查差集、官方增減與擷取問題；不能補造或刪除資料以湊成 1,465。過去全量卡片擷取也不等於過去逐一打開了 1,465 個詳情頁。

## Appendix B. 文件維護原則

- 本指南描述的是流程與資料契約使用方式，不自動代表 Rolex 官網、稅制或 Repo Schema 的最新狀態。
- 每次執行都必須重新取得當次官方來源證據；文件中的歷史 URL、按鈕文字、endpoint、筆數與案例只供回歸或操作線索。
- 若 README、Schema、實際資料與本指南互相衝突，先記錄衝突並依使用者最新明確要求處理；不得靜默降版或自行遷移契約。
- 變更正式資料契約、Evidence 穩定契約或歷史語意時，應另行取得同意並同步更新相關文件與驗證。
