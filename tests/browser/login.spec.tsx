import React from "react";
import {test,expect} from "@playwright/experimental-ct-react";
import {LoginPanel} from "../../src/components/auth/LoginPanel";
import {AssessmentForm} from "../../src/components/assessment/AssessmentForm";
test("unconfigured sign-in explains unavailable access",async({mount,page})=>{
 await page.evaluate(()=>{(window as any).__auth={user:null,loading:false,configured:false}});
 await mount(<LoginPanel/>);await expect(page.getByRole("alert")).toContainText("belum dikonfigurasi");await expect(page.getByRole("button",{name:"Masuk dengan Google"})).toHaveCount(0);
});
test("completed status prevents another assessment",async({mount,page})=>{
 await page.route("**/api/submissions/status",r=>r.fulfill({json:{status:"completed"}}));await mount(<AssessmentForm/>);
 await expect.poll(()=>page.evaluate(()=>(window as any).__navigation)).toBe("/already-submitted");
 await expect(page.getByRole("textbox",{name:"Nama lengkap",exact:true})).toHaveCount(0);
});
