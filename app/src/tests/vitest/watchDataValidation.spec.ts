import { describe, expect, it } from 'vitest'

import { isWatchCatalog, isWatchDataManifest } from '@/lib/watchDataValidation'

describe('watch data validation', () => {
  it('accepts the generated manifest format', () => {
    expect(isWatchDataManifest({ schemaVersion: 1, catalog: 'catalog.abc123.json' })).toBe(true)
  })

  it('rejects catalogs containing invalid watch records', () => {
    expect(
      isWatchCatalog({
        schemaVersion: 1,
        collectedAt: '2026-09-04T00:00:00.000Z',
        watchCount: 1,
        collections: [{ id: 'datejust', watchCount: 1 }],
        watchesByReference: {
          'm126234-0001': { collectionId: 'datejust' },
        },
      }),
    ).toBe(false)
  })
})
