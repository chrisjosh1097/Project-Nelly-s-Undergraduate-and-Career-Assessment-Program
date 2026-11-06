import React from 'react';
import {test,expect} from '@playwright/experimental-ct-react';
import {CampusExamples} from '../../src/components/results/CampusExamples';
import {AspirationRoutesPanel} from '../../src/components/results/StudentGuidancePanel';
import type {StudentGuidance} from '../../src/lib/types';
for(const count of [0,1,2,3,4]) test(`aspiration route layout adapts to ${count} routes`,async({mount,page})=>{
 const guidance={aspirationRoutes:Array.from({length:count},(_,i)=>({title:`Jalur ${i}`,steps:['Coba proyek sederhana.','Catat hasilnya.'],verify:'Cek sumber resmi.'})),glossary:[]} as unknown as StudentGuidance;
 await page.setViewportSize({width:1440,height:900});
 await mount(<AspirationRoutesPanel guidance={guidance}/>);
 const cards=page.locator('article');await expect(cards).toHaveCount(count);
 if(count){
  const grid=(await cards.first().locator('..').boundingBox())!,first=(await cards.first().boundingBox())!;
  expect(first.width/grid.width).toBeGreaterThan(count===1?0.98:count===2?0.47:0.3);
  if(count===4)expect((await cards.nth(3).boundingBox())!.y).toBeGreaterThan(first.y+first.height);
  await expect(page.getByText('Cek sumber resmi.',{exact:true})).toHaveCount(count);
 }
 await page.setViewportSize({width:320,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('glossary without routes remains accessible',async({mount,page})=>{
 await mount(<AspirationRoutesPanel guidance={{aspirationRoutes:[],glossary:[{term:'Contoh',plain:'Arti sederhana.'}]} as unknown as StudentGuidance}/>);
 await page.getByText('Arti istilah di laporan ini').click();await expect(page.getByText('Arti sederhana.')).toBeVisible();
});
test('active filters and catalog limitations are visible even on empty responses',async({mount,page})=>{
 await page.route('**/api/campus/**',r=>r.fulfill({json:{items:[],total:0,maritimeNote:true,source:'Sumber sintetis.'}}));
 await page.setViewportSize({width:320,height:900});
 await mount(<CampusExamples majorId="x" majorName="Contoh" degreeTypes={['S1']} preferences={['PTN di Jawa','PTS bagus di kota besar','Kuliah dekat rumah']}/>);
 await expect(page.getByText('Filter: S1 · PTN di Jawa · Swasta/Lainnya',{exact:true})).toBeVisible();
 await expect(page.getByText('Kualitas kampus dan lokasi kota besar belum diverifikasi.')).toBeVisible();
 await expect(page.getByText('Lokasi dekat rumah belum difilter. Cek lokasi kampus melalui pencarian.')).toBeVisible();
 await expect(page.getByText(/Sekolah pelayaran\/kedinasan resmi/)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
