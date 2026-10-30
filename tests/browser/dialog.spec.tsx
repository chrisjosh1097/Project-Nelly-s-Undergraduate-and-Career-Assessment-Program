import React from "react";
import {test,expect} from "@playwright/experimental-ct-react";
import {DialogExample} from "./DialogExample";
test("confirmation keeps focus inside and restores it on escape",async({mount,page})=>{
 await mount(<DialogExample/>);await page.getByRole("button",{name:"Ouvrir"}).click();
 await expect(page.getByRole("dialog")).toBeVisible();await expect(page.getByRole("button",{name:"Batal"})).toBeFocused();
 await page.keyboard.press("Shift+Tab");await expect(page.getByRole("button",{name:"Kirim"})).toBeFocused();
 await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).not.toBeVisible();await expect(page.getByRole("button",{name:"Ouvrir"})).toBeFocused();
});
