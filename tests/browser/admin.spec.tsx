import React from "react";
import {test,expect} from "@playwright/experimental-ct-react";
import {AdminDashboard} from "../../src/components/admin/AdminDashboard";
import {submission} from "./fixtures";
test("phone records, applied pathway filters and report details",async({mount,page})=>{
 const queries:string[]=[];await page.route("**/api/admin/submissions?*",r=>{queries.push(r.request().url());return r.fulfill({json:{submissions:[submission]}})});
 await page.route("**/api/admin/submissions",r=>r.fulfill({json:{submissions:[submission]}}));
 await mount(<AdminDashboard/>);
 await expect(page.getByRole("heading",{name:"Pahami arah siswa."})).toBeVisible();
 await expect(page.getByText(/500 rekaman/)).toBeVisible();
 await page.getByRole("button",{name:/Lihat laporan Nelly Siswa/}).click();
 await expect(page.getByRole("heading",{name:submission.report.topRecommendation.majorName,exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Kembali ke dashboard"}).click();
 await expect(page.getByRole("button",{name:/Lihat laporan Nelly Siswa/})).toBeFocused();
 await page.locator("summary").filter({hasText:"Filter asesmen"}).click();await page.getByLabel("Arah pendidikan",{exact:true}).selectOption("vocational");await page.getByRole("button",{name:"Terapkan filter"}).click();
 await expect.poll(()=>queries.length).toBe(1);expect(queries[0]).toContain("educationPathway=vocational");
 let exported="";await page.route("**/api/admin/export?*",r=>{exported=r.request().url();return r.fulfill({body:'"name"',contentType:"text/csv"})});
 await page.getByRole("button",{name:"Ekspor CSV"}).click();await expect.poll(()=>exported).toContain("educationPathway=vocational");
});
test("reset requires explicit confirmation and logout clears private records",async({mount,page})=>{
 let resets=0;await page.route("**/api/admin/submissions",r=>r.fulfill({json:{submissions:[submission]}}));
 await page.route("**/api/admin/submissions/reset",r=>{resets++;return r.fulfill({json:{deleted:true,email:submission.email}})});
 await page.route("**/api/admin/logout",r=>r.fulfill({json:{ok:true}}));
 await mount(<AdminDashboard/>);await page.getByRole("button",{name:/Hapus attempt Nelly Siswa/}).click();
 await expect(page.getByRole("dialog")).toContainText(submission.email);expect(resets).toBe(0);
 await page.getByRole("button",{name:"Batal",exact:true}).click();expect(resets).toBe(0);
 await page.getByRole("button",{name:/Hapus attempt Nelly Siswa/}).click();await page.getByRole("button",{name:"Ya, hapus attempt",exact:true}).click();
 await expect(page.getByRole("status").filter({hasText:/sudah dihapus/})).toBeVisible();expect(resets).toBe(1);
 await page.getByRole("button",{name:"Keluar admin",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Masuk ruang konselor"})).toBeVisible();await expect(page.getByRole("button",{name:/Lihat laporan/})).toHaveCount(0);
});
test("unauthorized dashboard offers manual login and retries errors",async({mount,page})=>{
 let allowed=false;await page.route("**/api/admin/submissions",r=>r.fulfill({status:allowed?200:401,json:allowed?{submissions:[]}:{error:"Login"}}));
 await page.route("**/api/admin/login",r=>{allowed=true;return r.fulfill({json:{ok:true}})});
 await mount(<AdminDashboard/>);await page.getByLabel("Email admin",{exact:true}).fill("admin@example.com");await page.getByLabel("Password",{exact:true}).fill("test-only");await page.getByRole("button",{name:"Masuk dashboard"}).click();
 await expect(page.getByText("Belum ada asesmen yang sesuai.",{exact:true})).toBeVisible();
});
