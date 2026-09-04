import { type Ref, ref } from 'vue'

import { Method, useFetchData } from '@/composables/useFetchData'
import { isWatchCatalog, isWatchDataManifest } from '@/lib/watchDataValidation'
import type { WatchCatalog } from '@/types/watch-data'

let catalogRequest: Promise<WatchCatalog> | null = null

const getWatchDataUrl = (fileName: string): string => {
  const versionQuery = fileName === 'manifest.json' ? `?v=${__WATCH_DATA_VERSION__}` : ''
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

  return `${baseUrl}watch-data/${fileName}${versionQuery}`
}

/**
 * 透過共用資料請求 composable 取得 JSON 回應內容。
 *
 * @param url - watch-data 靜態 JSON 的完整應用程式路徑。
 * @returns 未經格式驗證的 JSON 回應資料。
 * @throws 當請求失敗或未包含回應內容時拋出錯誤。
 */
const getJson = async (url: string): Promise<unknown> => {
  const { result } = await useFetchData<unknown>({
    url,
    method: Method.GET,
    isAbsolutePath: true,
  })
  const [response, error] = result

  if (error) {
    throw error
  }

  if (!response) {
    throw new Error('Watch data request returned no response')
  }

  return response.data
}

const fetchCatalog = async (): Promise<WatchCatalog> => {
  const manifest = await getJson(getWatchDataUrl('manifest.json'))

  if (!isWatchDataManifest(manifest)) {
    throw new Error('Watch data manifest has an invalid format')
  }

  const catalog = await getJson(getWatchDataUrl(manifest.catalog))

  if (!isWatchCatalog(catalog)) {
    throw new Error('Watch catalog has an invalid format')
  }

  return catalog
}

export const useWatchCatalog = (): {
  catalog: Readonly<Ref<WatchCatalog | null>>
  error: Readonly<Ref<unknown>>
  isLoading: Readonly<Ref<boolean>>
  loadCatalog: () => Promise<void>
} => {
  const catalog = ref<WatchCatalog | null>(null)
  const error = ref<unknown>(null)
  const isLoading = ref(false)

  const loadCatalog = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      catalogRequest ??= fetchCatalog()
      catalog.value = await catalogRequest
    } catch (requestError) {
      error.value = requestError
      catalogRequest = null
    } finally {
      isLoading.value = false
    }
  }

  return { catalog, error, isLoading, loadCatalog }
}
