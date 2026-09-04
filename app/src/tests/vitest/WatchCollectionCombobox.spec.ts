import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import WatchCollectionCombobox from '@/components/watch-collection/WatchCollectionCombobox.vue'

describe('WatchCollectionCombobox', () => {
  it('reports the selected collection through its select event', async () => {
    const { emitted } = render(WatchCollectionCombobox, {
      props: {
        allOptionLabel: 'All collections',
        emptyMessage: 'No collections found',
        label: 'Watch collection',
        options: [
          { id: 'datejust', label: 'Datejust', watchCount: 31 },
          { id: 'submariner', label: 'Submariner', watchCount: 20 },
        ],
        placeholder: 'Search collections',
        selectedCollectionId: null,
      },
    })

    await fireEvent.click(screen.getByRole('combobox', { name: 'Watch collection' }))
    await fireEvent.click(await screen.findByRole('option', { name: /Datejust/ }))

    expect(emitted().select).toEqual([['datejust']])
  })
})
