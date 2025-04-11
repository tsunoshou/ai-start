import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/'); // baseURLからの相対パス

  // ページタイトルに "AiStart" が含まれていることを期待
  await expect(page).toHaveTitle(/AiStart/);
});

test('has heading', async ({ page }) => {
  await page.goto('/');

  // <h1> タグの見出しに "AiStart" が含まれていることを期待
  await expect(page.getByRole('heading', { name: /AiStart/ })).toBeVisible();
});
