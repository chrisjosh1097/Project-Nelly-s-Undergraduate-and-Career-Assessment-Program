import React from "react";
import {test,expect} from "@playwright/experimental-ct-react";
import {Input} from "../../src/components/ui/Input";
test("text and essential field boundary contrast is readable",async({mount,page})=>{
 await mount(<Input aria-label="Nama"/>);
 const values=await page.getByRole("textbox").evaluate(el=>{
  const s=getComputedStyle(el);
  const luminance=(color:string)=>{const channels=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(n=>{const c=n/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};
  const ratio=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  return {text:ratio(s.color,s.backgroundColor),boundary:ratio(s.borderTopColor,s.backgroundColor)};
 });expect(values.text).toBeGreaterThanOrEqual(4.5);expect(values.boundary).toBeGreaterThanOrEqual(3);
});
