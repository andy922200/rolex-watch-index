import type { Watch, WatchCatalog, WatchCollection, WatchDataManifest } from '@/types/watch-data'

/**
 * 判斷值是否為非陣列的物件，供其他資料驗證函式安全讀取欄位。
 *
 * @param value - 待驗證的未知值。
 * @returns 值為可使用字串索引讀取的物件時為 `true`。
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * 驗證未知值是否符合單一錶款系列統計資料的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link WatchCollection} 時為 `true`，並將型別縮限為 `WatchCollection`。
 */
export const isWatchCollection = (value: unknown): value is WatchCollection =>
  isRecord(value) && typeof value.id === 'string' && typeof value.watchCount === 'number'

/**
 * 驗證未知值是否符合單一 Rolex 錶款資料的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link Watch} 時為 `true`，並將型別縮限為 `Watch`。
 */
export const isWatch = (value: unknown): value is Watch =>
  isRecord(value) &&
  typeof value.collectionId === 'string' &&
  typeof value.modelNumber === 'string' &&
  typeof value.configurationCode === 'string' &&
  typeof value.modelReference === 'string' &&
  typeof value.imageUrl === 'string'

/**
 * 驗證版本化 watch-data manifest 的格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link WatchDataManifest} 時為 `true`，並將型別縮限為 `WatchDataManifest`。
 */
export const isWatchDataManifest = (value: unknown): value is WatchDataManifest =>
  isRecord(value) && typeof value.schemaVersion === 'number' && typeof value.catalog === 'string'

/**
 * 驗證由建置程序產生的錶款 catalog 索引格式。
 *
 * @param value - 待驗證的未知值。
 * @returns 值符合 {@link WatchCatalog} 時為 `true`，並將型別縮限為 `WatchCatalog`。
 */
export const isWatchCatalog = (value: unknown): value is WatchCatalog =>
  isRecord(value) &&
  typeof value.schemaVersion === 'number' &&
  typeof value.collectedAt === 'string' &&
  typeof value.watchCount === 'number' &&
  Array.isArray(value.collections) &&
  value.collections.every(isWatchCollection) &&
  isRecord(value.watchesByReference) &&
  Object.values(value.watchesByReference).every(isWatch)
