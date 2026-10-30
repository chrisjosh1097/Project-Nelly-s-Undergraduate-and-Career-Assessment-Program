"use client";
import type {ReactNode} from "react";
import {usePathname} from "next/navigation";
import {Header} from "@/components/auth/Header";
import {SiteFooter} from "./SiteFooter";
export function AppShell({children}:{children:ReactNode}){
 const path=usePathname();const compact=path==="/assessment"||path.startsWith("/admin");
 return <div className={compact?"app-shell compact-shell":"app-shell"}><a className="skip-link" href="#main-content">Lewati ke konten</a><Header/><main id="main-content" className="page-container">{children}</main>{!compact?<SiteFooter/>:null}</div>;
}
