'use strict';

const { test, expect } = require('@playwright/test');

test('homepage renders the complete catalog without JavaScript errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle(/PixelLab/i);
  await expect(page.locator('#allCount')).toHaveText('195');
  await expect(page.locator('#gameGrid .game-card')).toHaveCount(195);
  expect(pageErrors).toEqual([]);
});

test('search filters the catalog to matching games', async ({ page }) => {
  await page.goto('/');
  await page.locator('#search').fill('Tic Tac Toe');

  const cards = page.locator('#gameGrid .game-card');
  await expect(cards.first()).toBeVisible();

  const titles = await cards.locator('.card-title').allTextContents();
  expect(titles.length).toBeGreaterThan(0);
  expect(titles.every((title) => title.toLowerCase().includes('tic tac toe'))).toBe(true);
});

test('Tic Tac Toe supports same-device turns and keeps online rooms disabled', async ({ page }) => {
  await page.goto('/');

  await page.locator('#gameGrid [data-game="original-tictactoe"]').click();
  await expect(page.locator('#modalTitle')).toHaveText('Tic Tac Toe');

  const onlineRoomButton = page.getByRole('button', { name: /Online room/i });
  await expect(onlineRoomButton).toBeDisabled();

  await page.getByRole('button', { name: /2 Players · Same Device/ }).click();

  const cells = page.locator('#gameBox .ttt-cell');
  await expect(cells).toHaveCount(9);

  await cells.nth(0).click();
  await cells.nth(4).click();

  await expect(cells.nth(0)).toHaveText('X');
  await expect(cells.nth(4)).toHaveText('O');
});
