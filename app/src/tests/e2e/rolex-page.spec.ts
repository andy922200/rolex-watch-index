import { expect, test } from '@playwright/test'

test('changes the Rolex index page language', async ({ page }) => {
  await page.goto('rolex.html')

  await expect(page.getByRole('heading', { name: 'Your Global Rolex Watches Index' })).toBeVisible()

  await page.getByLabel('Language').selectOption('zh-tw')

  await expect(page.getByRole('heading', { name: '您的全球 Rolex 腕錶索引' })).toBeVisible()
})
