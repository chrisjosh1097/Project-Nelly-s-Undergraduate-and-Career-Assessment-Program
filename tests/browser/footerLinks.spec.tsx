import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { SiteFooter } from '../../src/components/layout/SiteFooter';

test('footer social links show images and fit 320px', async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const footer = await mount(<SiteFooter />);
  for (const [name, href] of [['Website', 'https://projectnelly.com/'], ['Instagram', 'https://www.instagram.com/project.nelly/'], ['LinkedIn', 'https://www.linkedin.com/company/project-nelly/']]) {
    const link = footer.getByRole('link', { name: `${name} (tab baru)` });
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link.locator('svg[aria-hidden="true"]')).toHaveCount(2);
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
