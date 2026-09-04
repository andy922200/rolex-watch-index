import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 此腳本將 repo 的原始 catalog 轉成前端可直接查詢的靜態資料庫。
 *
 * 輸出包含兩種檔案：
 * - `catalog.<content-hash>.json`：真正的資料；檔名隨內容變更，可安全快取。
 * - `manifest.json`：指向目前 catalog 檔名的小型索引；前端會先讀取它。
 */
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const appDirectory = resolve(scriptDirectory, '..')
const projectDirectory = resolve(appDirectory, '..')
const catalogPath = resolve(projectDirectory, 'data/catelog/rolex-catalog.json')

// production build 寫到 dist；dev 與 E2E 則傳入 public/watch-data，讓 Vite 能直接服務。
const outputDirectoryArgumentIndex = process.argv.indexOf('--output-directory')
const requestedOutputDirectory =
  outputDirectoryArgumentIndex === -1 ? null : process.argv[outputDirectoryArgumentIndex + 1]

if (outputDirectoryArgumentIndex !== -1 && !requestedOutputDirectory) {
  throw new Error('Expected a directory after --output-directory')
}

const outputDirectory = resolve(appDirectory, requestedOutputDirectory ?? 'dist/watch-data')

// 原始 catalog 是資料收集流程的輸出；此處只負責將它轉換為前端讀取最佳化的格式。
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))

// 將 watches 陣列轉為以 modelReference 為 key 的物件。
const watchesByReference = Object.fromEntries(
  catalog.watches.map((watch) => [watch.modelReference, watch]),
)

// 逐筆累計每個 collectionId 對應的錶款數量。
const collectionCounts = new Map()
for (const watch of catalog.watches) {
  collectionCounts.set(watch.collectionId, (collectionCounts.get(watch.collectionId) ?? 0) + 1)
}

// 輸出格式：schemaVersion、資料收集時間、錶款總數、系列統計陣列與錶款索引物件。
const watchData = {
  schemaVersion: 1,
  collectedAt: catalog.collectedAt,
  watchCount: catalog.watchCount,
  collections: [...collectionCounts]
    .map(([id, watchCount]) => ({ id, watchCount }))
    .sort((left, right) => left.id.localeCompare(right.id)),
  watchesByReference,
}

const payload = JSON.stringify(watchData)

// hash 的輸入是最終 payload，而不是來源檔案：只要瀏覽器實際讀取的資料改變，URL 就一定改變。
const contentHash = createHash('sha256').update(payload).digest('hex').slice(0, 12)
const catalogFileName = `catalog.${contentHash}.json`
const manifest = JSON.stringify({ schemaVersion: 1, catalog: catalogFileName })

// 先移除舊 hash 檔，避免部署產物或 dev public 目錄殘留不再被 manifest 指向的資料。
await rm(outputDirectory, { force: true, recursive: true })
await mkdir(outputDirectory, { recursive: true })

// 兩個檔案同時寫入；manifest 是前端尋找目前版本 catalog 的唯一固定入口。
await Promise.all([
  writeFile(resolve(outputDirectory, catalogFileName), payload),
  writeFile(resolve(outputDirectory, 'manifest.json'), manifest),
])
