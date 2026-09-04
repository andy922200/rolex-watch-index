export interface WatchCollection {
  id: string
  watchCount: number
}

export interface Watch {
  collectionId: string
  modelNumber: string
  configurationCode: string
  modelReference: string
  imageUrl: string
}

export interface WatchCatalog {
  schemaVersion: number
  collectedAt: string
  watchCount: number
  collections: WatchCollection[]
  watchesByReference: Record<string, Watch>
}

interface WatchDataManifest {
  schemaVersion: number
  catalog: string
}

export type { WatchDataManifest }
