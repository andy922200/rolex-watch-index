---
name: vue-typescript-frontend
description: >-
  新增、修改、重構、除錯、測試或審查 Vue 3 + TypeScript 前端時使用，包含建立 Vite/Vue 前端骨架、Vue 元件、頁面與路由、Composable、Pinia Store、Tailwind CSS、i18n、Axios API 存取、響應式與深色模式。常見觸發句式：「做 Vue 頁面」、「新增元件」、「改前端」、「建立 composable」、「加 Pinia store」、「串 API」、「加 i18n」、「做 RWD」、「用 Tailwind 重構」、「建立 Vue 專案」。SKIP：純後端 / API / 資料庫 / 基礎設施工作、非 Vue 前端檔案的獨立維護、只討論 git commit / branch / PR 而不變更前端實作。
---

# vue-typescript-frontend

## 何時使用

以下任一情境出現即套用本規範：

- 新增、修改、重構、除錯、測試或審查 Vue 3 前端。
- 建立 Vue 頁面、路由、元件、共用 UI、Composable、Pinia Store 或前端資料模型。
- 串接 API、建立共用 Axios 存取層、處理載入與錯誤狀態。
- 使用 Tailwind CSS、處理 RWD、Dark Mode、圖示、i18n 或可及性。
- 建立或調整 Vue 前端工具鏈、相依套件、ESLint、Prettier、測試設定或 Vite 設定。

**不適用**：純後端、API endpoint、資料庫 migration、基礎設施、與 Vue 前端無關的獨立腳本，以及只查看或處理 git commit / branch / PR 的任務。

混合型任務僅將本規範套用於 Vue 前端部分；其他部分仍套用各自適用的專案規範與 Skill。

## 技術線與相依套件

- 前端框架一律使用 **Vue 3**。Vue SFC 一律採 **Composition API** 與 `<script setup lang="ts">`；不得以 Vue Options API 撰寫元件。
- 預設使用套件當下可使用的**最新穩定版本**。
- 新建前端專案或首次安裝前端相依前，先詢問使用者要使用哪個套件管理工具（例如 `pnpm`、`bun` 或 `npm`）。若使用者未指定或表示沒有偏好，才使用 `npm`；不得自行安裝、切換或假定 `pnpm`、`bun` 等工具。
- 若既有前端專案已有 lockfile 或 `packageManager` 設定，沿用該專案既有工具；要切換套件管理工具或重建 lockfile 前，必須先取得使用者許可。
- 發現相容性或 peer dependency 衝突時，先說明衝突的套件、版本與影響；若需降版或選擇較舊版本，**必須先取得使用者許可**，再處理衝突。不得靜默降版。
- 僅支援現代瀏覽器，不加入 IE 相容性程式、舊版瀏覽器 polyfill 或 legacy bundle，除非使用者明確要求。
- 應用程式內的原始碼匯入使用 `@/` 對應 `src/`；避免為跨模組引用撰寫脆弱的深層相對路徑。
- **新建專案首次導入多語系（i18n）前，必須先詢問使用者要採用哪種語系架構，不得自行判斷或預設**：
  - **單頁式（預設，沒有特殊需求一律採用）**：`vue-i18n`（`legacy: false` + Composition API）搭配 client state（例如 locale ref + `localStorage`）在同一支 SPA、同一個 URL 內即時切換語言。
  - **多頁靜態架構（例如 `vite-plugin-virtual-mpa`）**：每個語系在 build time 各自產出獨立的靜態 HTML 與獨立 URL（例如 `/`、`/en-us/`），換取「不執行 JS 的爬蟲、LINE／Facebook 等社群分享預覽 bot」也能讀到正確語言的 `<title>`、`meta description`、Open Graph 標籤；代價是語言切換變成換頁而非即時切換，且需要調整 Vite 多入口設定、dev/preview rewrites、部署路徑與 i18n 初始化邏輯（改成用網址路徑判斷語系），複雜度與出錯風險明顯高於單頁式。
  - 詢問時用具體情境幫使用者判斷，例如：「這個網站的連結會被分享到 LINE、Facebook 這類需要正確預覽標題與縮圖的地方嗎？」使用者回答「否」、「不確定」，或完全沒提到 SEO／社群分享預覽需求時，**一律採用單頁式**，不得自行升級為多頁靜態架構。
  - 使用者一旦選定架構後才可動工；改變既有專案的語系架構（單頁式⇄多頁靜態）視同前述套件管理工具切換等級的重大決策，同樣必須先取得使用者明確同意。

## TypeScript 與命名

### TypeScript

- 一律使用 **TypeScript**，並啟用 strict mode。
- 禁止顯性與隱性 `any`。外部或不可信任資料先以 `unknown` 接收，再透過 type guard、schema 或明確驗證縮限型別。
- Props、Emits、`defineModel`、Composable 回傳值、Pinia state、API request 與 response 都要有明確型別。
- 需要使用 `as` 型別斷言前，先告知使用者原因與替代方案；不得為了壓過 lint 或型別錯誤而靜默加入斷言，也不得使用雙重斷言（例如 `as unknown as T`）隱藏問題。
- 不使用 `.js`、`.jsx` 或 `.cjs`。只有工具鏈確實要求 JavaScript 時才允許 `.mjs`。

### 命名

| 類型 | 規則 | 範例 |
| --- | --- | --- |
| Vue 元件 | PascalCase | `BaseMultiSelect.vue` |
| Composable | `use` + PascalCase | `useFetchData.ts` |
| Helper / 函式 / 區域變數 | camelCase | `getApiError.ts`、`formatPrice` |
| Store 檔案 | camelCase 且以 `Store` 結尾 | `authStore.ts` |
| Store 匯出 | PascalCase | `useAuthStore` |
| Enum、共用常數物件 | PascalCase | `OrderStatus`、`ApiRoutes` |
| 不可變純量常數 | UPPER_CASE | `DEFAULT_PAGE_SIZE` |

## Vue 元件

- 元件邏輯維持在 `<script setup lang="ts">`，以 Composition API 組織可重用且具型別的狀態與行為。
- 使用介面明確定義 Props 與 Emits；有預設值的 Props 使用 `withDefaults`。
- 使用 `defineModel` 時，直接以 model 取代重複的 `modelValue` Props、`update:modelValue` Emits 與手動 computed proxy；不要同時建立兩套雙向綁定介面。
- Template 中所有使用者可見文字，包括按鈕文字、placeholder、空狀態、錯誤訊息與可及性標籤，都必須使用 i18n translation key，不硬編單一語言文字。
- 建立頁面層級路由時使用動態 `import`。大型、低頻或選用功能也應以動態 `import` 分割；不要為了形式而延遲載入小型且必定渲染的基礎元件。
- 圖示採按需載入的 `unplugin-icons`。既有品牌資產或使用者明確提供的圖像例外。

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'form.defaultLabel',
  disabled: false,
})

const emit = defineEmits<{
  submit: [value: string]
}>()

const value = defineModel<string>({ default: '' })

const isReady = computed(() => !props.disabled && value.value.trim().length > 0)

const submit = (): void => {
  if (isReady.value) {
    emit('submit', value.value)
  }
}
</script>
```

> 元件中的 `label` 預設值若供使用者可見，應由呼叫端傳入已翻譯文字或以元件內 i18n key 取得；不得把範例中的 key 當作直接顯示的文案。

## Composable、API 與資料存取

- Composable 檔案命名採 `use` + PascalCase，封裝明確、可測試的功能，並以具型別的物件回傳狀態與操作。
- 先尋找並沿用既有共用 API composable（例如 `useFetchData`）或 Axios instance。不得在元件或 feature 模組內個別建立 Axios client，也不得散落直接的 `axios.get`、`axios.post` 等呼叫。
- API response、request payload 與錯誤資料都要定義型別；回應資料不可未驗證就假設其結構。
- UI 元件負責呈現與互動；資料請求、轉換、商業邏輯應放入既有 API 層、Composable 或 Store 的合適位置。

```ts
import { ref, type Ref } from 'vue'

import { profileApi } from '@/api/profileApi'

interface Profile {
  id: string
  name: string
}

interface UseProfileResult {
  profile: Readonly<Ref<Profile | null>>
  isLoading: Readonly<Ref<boolean>>
  loadProfile: (id: string) => Promise<void>
}

export const useProfile = (): UseProfileResult => {
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)

  const loadProfile = async (id: string): Promise<void> => {
    isLoading.value = true

    try {
      // 透過既有的共用 API 層請求並驗證回應。
      profile.value = await profileApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  return { profile, isLoading, loadProfile }
}
```

## Pinia State Management

- Pinia 一律使用 **Option Stores**；這是 Store 的架構規則，不代表 Vue 元件可使用 Options API。
- State 必須用 interface 嚴格定義，且 `state` 函式必須明確標註回傳型別。
- Getter 使用 `this` 讀取其他 state 或 getter 時，必須明確標註回傳型別；不得依賴隱式推導。
- Actions 負責非同步與商業操作，回傳值必須明確。
- 在 `<script setup>` 元件內，解構 Store 的 State / Getters 時一律使用 `storeToRefs()` 維持響應性；Actions 可直接解構呼叫。

```ts
import { defineStore } from 'pinia'

interface UserState {
  id: string
  name: string
}

interface AuthState {
  user: UserState | null
  token: string | null
}

interface LoginPayload {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.token !== null,
    upperCaseName(): string {
      return this.user?.name.toUpperCase() ?? ''
    },
  },

  actions: {
    async login(payload: LoginPayload): Promise<void> {
      const result = await authApi.login(payload)
      this.user = result.user
      this.token = result.token
    },
  },
})
```

```ts
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const { isAuthenticated, user } = storeToRefs(authStore)
const { login } = authStore
```

## 樣式、RWD 與可及性

- 一般樣式一律使用 **Tailwind CSS 4**，不得使用 `@apply`。
- 只有實作偽元素時才使用 SCSS；一般排版、色彩與元件樣式不得改以 SCSS 堆疊。
- Dark Mode 與 RWD 是基本驗收條件：新增或修改的介面必須在合理的窄／寬版檢視與明／暗主題下保持可用與可讀。
- 互動元件與導覽使用正確的語意化元素、可辨識 label、鍵盤操作與焦點狀態；不可用非互動元素模擬按鈕或連結。

## 程式品質與測試

- 前端工具鏈使用並遵守 ESLint、Prettier 與 `simple-import-sort`。匯入排序交由既有 lint / format 設定維持，避免手動採用不一致的分組方式。
- **新建 Vue 專案時，必須安裝並設定完整品質工具鏈**；不可只在文件或規範中提及而未加入專案。既有專案則先沿用其設定；只有使用者明確要求或授權時，才新增或遷移工具鏈。
- 新專案的 ESLint 採 flat config，安裝並整合 `@eslint/js`、`typescript-eslint`、`eslint-plugin-vue`、`eslint-plugin-prettier`、`eslint-config-prettier`、`eslint-plugin-simple-import-sort` 與 `globals`。設定 TypeScript、Vue SFC、browser / node globals、import sorting 與 `node_modules`、`dist` 等產物忽略規則。
- 新專案必須安裝 Prettier、`prettier-plugin-tailwindcss`，並建立 JSON 格式的 `.prettierrc` 與 `.prettierignore`。預設沿用模板慣例：無分號、兩格縮排、單引號、100 欄、尾逗號與 Tailwind class 排序；忽略依賴、建置產物與測試報告等產生檔。
- 新專案的 Unit Test 使用 Vitest、Vue Test Utils、Testing Library、jsdom 與 `@vitest/coverage-v8`。在 Vite config 的 `test` 區塊設定 `jsdom`、測試 setup、Unit Test 目錄與 V8 coverage；setup 應放置全域 mock 或 Vue Test Utils 設定。
- 新專案的 E2E Test 使用 Playwright，安裝 `@playwright/test`、建立 `playwright.config.ts` 與獨立 E2E 測試目錄。設定應自動啟動 Vite dev server、使用本機 base URL，並在失敗或重試時保留 screenshot、video、trace 與 HTML report；以目前套件管理工具的本機執行器安裝設定檔所需瀏覽器，例如 `npm exec playwright install`、`pnpm exec playwright install` 或 `bunx playwright install`。
- 新專案至少提供一個可通過的 Unit Test 與一個 E2E smoke test；測試目標須用穩定、語意化 selector，不能以明顯不存在或脆弱的 selector 填充範例。
- 新專案的 `package.json` 至少提供 `format`、`format:check`、`lint`、`lint:fix`、`type-check`、`test-vitest`、`test:coverage`、`test-e2e` 與 `test-e2e:ui` scripts。`lint` 與檢查 scripts 預設不得改寫原始碼；修正行為限於明確的 `:fix` 或 `format` scripts。
- 核心功能與商業邏輯必須有 Unit Test，特別是 Composable、Pinia actions / getters、資料轉換、驗證與計算。
- 純靜態視覺標記不強制補低價值測試；測試應涵蓋行為、分支、錯誤處理與商業結果。
- 新增或修改前端程式後，依專案現有 scripts 執行 format check、lint、type check、目標 Unit Test；新增或修改路由、表單、導覽、資料提交或重要互動時，必須新增並執行相關 E2E Test。若缺少必要驗證設定，先明確說明。

## 實作流程

1. 先閱讀既有前端結構、共用元件、Composable、Axios instance、i18n、Store、lockfile 與工具設定，沿用既有模式，不平行造輪子。
2. 建立前端專案或首次安裝相依前，先詢問使用者要用 `pnpm`、`bun`、`npm` 或其他工具；使用者未指定時才使用 `npm`。既有專案則沿用其 lockfile 或 `packageManager` 指定的工具。
3. 專案第一次需要多語系（i18n）時，先詢問使用者是否有 SEO 或 LINE／Facebook 等社群分享預覽需求；沒有就採用單頁式架構，有才採用多頁靜態架構（見「技術線與相依套件」）。既有專案已有 i18n 架構時直接沿用，不自行更換。
4. 新建專案時安裝並設定 ESLint、Prettier、Vitest Unit Test 與 Playwright E2E Test，建立對應 scripts、最小可執行測試與必要的 ignore 規則；預設選用最新穩定版本。既有專案僅判斷是否需要補齊使用者要求的相依或設定。
5. 遇到相依衝突、需要降版、切換套件管理工具或不得不用 `as` 時，先向使用者說明理由並等待許可。
6. 依本規範實作，將 UI 文字納入 i18n，並兼顧動態載入、RWD、Dark Mode 與可及性。
7. 執行適用的 format check、lint、型別檢查與單元測試；新建專案或影響使用者流程時也執行 E2E Test。據實回報結果與無法驗證的原因。

## 避免事項

- 以 Vue Options API 撰寫元件，或以 Pinia Setup Store 取代 Option Store。
- 使用 `any`、未告知的 `as`、雙重型別斷言，或以斷言掩蓋 API 資料問題。
- 新增 `.js`、`.jsx`、`.cjs` 檔案。
- 使用 Tailwind `@apply`，或在非偽元素情境以 SCSS 取代 Tailwind。
- 在元件內新建 Axios client 或散落直接 API 呼叫。
- 將使用者可見文案、placeholder、錯誤訊息或 aria label 硬編為單一語言。
- 對路由頁面、大型或選用功能使用不必要的靜態匯入。
- 解構 Pinia State / Getters 時跳過 `storeToRefs()` 而破壞響應性。
- 在新建專案時省略 ESLint、Prettier、Unit Test 或 E2E Test 的相依、設定、scripts、可執行範例或驗證。
- 未經使用者要求就將既有專案的 TestCafe、Cypress、Playwright 或其他測試框架遷移為另一個框架。
- 未經使用者確認，就在新建專案或既有專案採用多頁靜態 i18n 架構（例如 `vite-plugin-virtual-mpa`）取代預設的單頁式 i18n。

## 完成前檢查

- [ ] Vue SFC 使用 `<script setup lang="ts">` 與 Composition API
- [ ] TypeScript strict，且沒有 `any`、未告知的 `as` 或非 `.mjs` JavaScript
- [ ] 前端相依使用使用者指定的套件管理工具；未指定時使用 `npm`，既有專案沿用 lockfile 或 `packageManager`
- [ ] Props、Emits、Model、API response、Composable 與 Store State 都有明確型別
- [ ] 元件、Composable、Helper、常數、Store 檔案與 Store 匯出符合命名規則
- [ ] Pinia 使用 Option Store；解構 State / Getters 時使用 `storeToRefs()`
- [ ] API 經由既有共用 Axios instance 或 API composable
- [ ] 使用者可見文字已納入 i18n，圖示按需使用 `unplugin-icons`
- [ ] 若專案新導入多語系或變更既有語系架構，已在動工前跟使用者確認採用單頁式或多頁靜態架構，未自行預設
- [ ] 路由頁面與合適的大型／選用功能已動態載入
- [ ] 一般樣式為 Tailwind CSS 4、沒有 `@apply`，SCSS 僅用於偽元素
- [ ] RWD、Dark Mode 與基本可及性需求已檢查
- [ ] Imports 經 `simple-import-sort` 排序，相關 formatter、lint、type check 與 Unit Test 已執行
- [ ] 新建專案已安裝且設定 ESLint flat config、Prettier（含 Tailwind plugin）、Vitest / Vue Test Utils 與 Playwright
- [ ] 新建專案提供 format、lint、type check、Unit Test、coverage 與 E2E Test scripts，且檢查 scripts 不會改寫原始碼
- [ ] 新建專案的最小 Unit Test 與 E2E smoke test 都能執行；Playwright browser 與失敗產物設定已完成
