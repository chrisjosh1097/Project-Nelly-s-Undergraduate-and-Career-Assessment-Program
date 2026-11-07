import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { CampusSearch } from '../../src/components/campus/CampusSearch';

test('campus actions have decorative images while keeping accessible names and 44px targets', async ({ mount, page }) => {
  let fail = true;
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route('**/api/campus/search**', route => fail ? route.fulfill({ status: 500, json: {} }) : route.fulfill({ json: {
    items: [{ campus: 'Kampus Contoh', type: 'Negeri', program: 'Teknik Mesin', degree: 'S1', pddiktiUrl: 'https://pddikti.kemdiktisaintek.go.id/search/Kampus%20Contoh' }],
    total: 40, page: 1, pageSize: 20, provinces: [], source: 'Sumber contoh',
  } }));
  const component = await mount(<CampusSearch />);
  const retry = component.getByRole('button', { name: 'Coba lagi' });
  await expect(retry.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  fail = false;
  await retry.click();
  for (const name of ['Sebelumnya', 'Berikutnya']) {
    const button = component.getByRole('button', { name });
    await expect(button.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
