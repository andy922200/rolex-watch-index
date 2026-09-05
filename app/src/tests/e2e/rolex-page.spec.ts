import { expect, test } from '@playwright/test'

test('changes the Rolex index page language', async ({ page }) => {
  await page.goto('en-us/')

  await expect(page.getByRole('heading', { name: 'Your Global Rolex Watches Index' })).toBeVisible()

  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: '繁體中文' }).click()

  await expect(page.getByRole('heading', { name: '您的全球 Rolex 腕錶索引' })).toBeVisible()
})

test('selects a watch collection from the combobox listbox', async ({ page }) => {
  await page.goto('en-us/')

  const combobox = page.getByRole('combobox', { name: 'Watch collection' })
  await expect(combobox).toBeVisible()
  await combobox.click()
  await page.getByRole('option', { name: /^Datejust \d+$/ }).click()

  await expect(combobox).toContainText('Datejust')
})
