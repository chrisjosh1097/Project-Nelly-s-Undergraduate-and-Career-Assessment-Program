import React from "react";
import {test,expect} from "@playwright/experimental-ct-react";
import {ResultLoader} from "../../src/components/results/ResultLoader";
import {ResultsView} from "../../src/components/results/ResultsView";
import {submission} from "./fixtures";
test("ten matches expose accessible details and both downloads",async({mount,page})=>{
 await mount(<ResultsView submission={submission}/>);
 await expect(page.getByRole("heading",{name:submission.report.topRecommendation.majorName,exact:true})).toBeVisible();
 await expect(page.locator("details.recommendation-details")).toHaveCount(9);
 const summary=page.locator("details.recommendation-details summary").first();await summary.focus();await page.keyboard.press("Enter");
 await expect(page.locator("details.recommendation-details").first()).toHaveAttribute("open","");
 await expect(page.getByRole("button",{name:/Laporan PDF/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Kartu Instagram/})).toBeVisible();
 await expect(page.getByText("Kecocokan profil",{exact:true}).first()).toBeVisible();
});
for(const narrativeStatus of ["pending","processing","failed","skipped"] as const)test(`heuristic results stay usable when narration is ${narrativeStatus}`,async({mount,page})=>{
 await page.route("**/api/submissions/me",r=>r.fulfill({json:{submission:{...submission,narrativeStatus}}}));
 await mount(<ResultLoader/>);await expect(page.getByRole("heading",{name:submission.report.topRecommendation.majorName,exact:true})).toBeVisible();
});
test("missing report is actionable, not an endless spinner",async({mount,page})=>{
 await page.route("**/api/submissions/me",r=>r.fulfill({json:{submission:null}}));await mount(<ResultLoader/>);
 await expect(page.getByRole("link",{name:"Mulai asesmen"})).toBeVisible();
});
test("pending polling stops on unmount and retries recover failures",async({mount,page})=>{
 await page.clock.install();let requests=0;
 await page.route("**/api/submissions/me",r=>{requests++;return r.fulfill({status:requests===1?500:200,json:requests===1?{error:"Hors ligne"}:{submission:{...submission,narrativeStatus:"pending"}}})});
 const component=await mount(<ResultLoader/>);await page.getByRole("button",{name:"Coba lagi"}).click();
 await expect(page.getByRole("heading",{name:submission.report.topRecommendation.majorName,exact:true})).toBeVisible();
 await page.clock.fastForward(3501);await expect.poll(()=>requests).toBe(3);
 await component.unmount();await page.clock.fastForward(10000);expect(requests).toBe(3);
});
test("legacy results and previous-submission notice remain readable",async({mount,page})=>{
 const old=structuredClone(submission);delete old.answers.educationPathway;old.report.recommendations.forEach(r=>delete r.degreeTypes);delete old.report.topRecommendation.degreeTypes;
 await page.route("**/api/submissions/me",r=>r.fulfill({json:{submission:old}}));await mount(<ResultLoader alreadySubmitted/>);
 await expect(page.getByText("Belum tercatat",{exact:true})).toBeVisible();await expect(page.getByText(/tidak digenerasi ulang/)).toBeVisible();
});
