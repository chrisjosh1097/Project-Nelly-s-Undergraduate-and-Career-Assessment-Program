import React from 'react';
import {test,expect} from '@playwright/experimental-ct-react';
import LandingPage from '../../src/app/page';
for(const width of [320,375,1440]) test(`decorated landing stays readable at ${width}px`,async({mount,page})=>{
 await page.setViewportSize({width,height:900});
 await mount(<main className="page-container"><LandingPage/></main>);
 await expect(page.getByRole('heading',{level:1})).toContainText('Masa depanmu');
 await expect(page.getByRole('link',{name:'Temukan arahmu'})).toHaveAttribute('href','/login?next=/assessment');
 await expect(page.locator('[data-decoration="journey"]')).toHaveAttribute('aria-hidden','true');
 await expect(page.locator('[data-decoration="journey"] a, [data-decoration="journey"] button')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
