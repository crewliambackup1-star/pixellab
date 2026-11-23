'use strict';

const { test, expect } = require('@playwright/test');

test('homepage renders the complete catalog without JavaScript errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle(/PixelLab/i);
  expect(pageErrors).toEqual([]);
  await expect(page.locator('#allCount')).toHaveText('203');
  await expect(page.locator('#gameGrid .game-card')).toHaveCount(203);
  await expect(page.locator('#dailyGameTitle')).not.toHaveText("Today's arcade pick");
  await expect(page.locator('#dailyGameDesc')).not.toBeEmpty();
  await expect(page.locator('#dailyEmoji')).not.toBeEmpty();
});


test('V11 adds three searchable 3D worlds to the eight-game showcase', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#threeDFeatured .game-card')).toHaveCount(8);
  const search = page.locator('#search');
  const titles = ['Mythic Realms', 'Trailblazer Sim', 'Wildcraft'];

  for (const title of titles) {
    await search.fill(title);
    const cards = page.locator('#gameGrid .game-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.locator('.card-title')).toHaveText([title]);
  }
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
  await page.locator('#search').fill('Tic Tac Toe');

  const ticTacToeCard = page.locator('#gameGrid [data-game^="tictactoe-"]').first();
  await expect(ticTacToeCard).toBeVisible();
  const expectedTitle = (await ticTacToeCard.getAttribute('aria-label')).replace(/^Play\s+/, '');
  await ticTacToeCard.click();
  await expect(page.locator('#modalTitle')).toHaveText(expectedTitle);

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


test('Daily Drop button launches the featured game', async ({ page }) => {
  await page.goto('/');

  const dailyTitle = await page.locator('#dailyGameTitle').textContent();
  await page.locator('#dailyPlay').click();

  await expect(page.locator('#modal')).toHaveClass(/open/);
  await expect(page.locator('#modalTitle')).toHaveText(dailyTitle);
});
