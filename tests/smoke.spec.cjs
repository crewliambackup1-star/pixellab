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


const nonThreeGameNames = [
  'Rift Runner', 'Circuit Crafter', 'Star Courier', 'Reaction Rush',
  'Memory Match', 'Aim Trainer', 'Whack-a-Mole', 'Tap Frenzy', 'Type Blitz',
  'Tic Tac Toe', 'Number Merge', 'Snake Sprint', 'Neon Pong', 'Brick Breaker',
  'Orbit Dodger', 'Minefield', 'Simon Sequence', 'Word Scramble',
  'Cosmic Clicker', 'Flappy Pixel', 'Math Sprint', 'Connect Four',
  'Pixel Platformer', 'Trivia Blitz', 'Color Clash', 'Lights Out', 'Maze Runner',
];

const threeDGameNames = [
  'Neon Strike', 'Gravity Rush', 'Velocity X', 'Wildlands',
  'Park Empire', 'Mythic Realms', 'Trailblazer Sim', 'Wildcraft',
];

test('all 27 non-3D engines open and cleanly close without page errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');

  const search = page.locator('#search');
  const modal = page.locator('#modal');
  for (const name of nonThreeGameNames) {
    await search.fill(name);
    const card = page.locator('#gameGrid .game-card').first();
    await expect(card, 'Search should find ' + name).toBeVisible();
    const expectedTitle = (await card.locator('.card-title').innerText()).trim();
    await card.locator('[data-game]').first().click();
    await expect(modal).toHaveClass(/open/);
    await expect(page.locator('#modalTitle')).toHaveText(expectedTitle);
    await expect(page.locator('#gameBox').locator(':scope > *').first()).toBeVisible();
    await page.locator('#closeModal').click();
    await expect(modal).not.toHaveClass(/open/);
  }
  expect(pageErrors).toEqual([]);
});

test('all eight 3D worlds start the shared runtime and expose pause or a graceful load error', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  const search = page.locator('#search');
  const modal = page.locator('#modal');

  for (const name of threeDGameNames) {
    await search.fill(name);
    const card = page.locator('#gameGrid .game-card').first();
    await expect(card, 'Search should find ' + name).toBeVisible();
    const expectedTitle = (await card.locator('.card-title').innerText()).trim();
    await card.locator('[data-game]').first().click();
    await expect(modal).toHaveClass(/open/);
    await expect(page.locator('#modalTitle')).toHaveText(expectedTitle);
    await expect(page.locator('.three-stage')).toBeVisible();
    await expect.poll(async () => {
      const pauseControls = await page.locator('.three-pause-toggle').count();
      const loadErrors = await page.locator('.three-load-error').count();
      return pauseControls + loadErrors;
    }, { timeout: 20000 }).toBeGreaterThan(0);

    const pauseButton = page.locator('.three-pause-toggle');
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      await expect(page.locator('.three-pause-banner')).toBeVisible();
      await pauseButton.click();
      await expect(page.locator('.three-pause-banner')).toBeHidden();
    }
    await page.locator('#closeModal').click();
    await expect(modal).not.toHaveClass(/open/);
  }
  expect(pageErrors).toEqual([]);
});
