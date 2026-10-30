"use client";
import {useEffect,useId,useRef,type ReactNode} from "react";
import {Button} from "./Button";
export function ConfirmDialog({open,title,children,confirmLabel,busy=false,onConfirm,onClose}:{open:boolean;title:string;children:ReactNode;confirmLabel:string;busy?:boolean;onConfirm:()=>void|Promise<void>;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);const id=useId();
 useEffect(()=>{const el=ref.current;if(!el)return;const previous=document.activeElement as HTMLElement|null;if(open&&!el.open)el.showModal();if(!open&&el.open)el.close();return ()=>{if(el.open)el.close();previous?.focus()}},[open]);
 return <dialog ref={ref} aria-labelledby={id} className="confirm-dialog" onKeyDown={e=>{if(e.key!=="Tab")return;const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]'));if(!controls.length){e.preventDefault();return}const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}} onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><h2 id={id}>{title}</h2><div className="my-5 text-sm leading-7 text-ink/75">{children}</div><div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={onClose} disabled={busy} autoFocus>Batal</Button><Button disabled={busy} onClick={onConfirm}>{busy?"Memproses…":confirmLabel}</Button></div></dialog>;
}
