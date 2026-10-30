import type { ReactNode } from "react";
const getToken=async()=>"synthetic-token";
export function useAuth() {
 const state=(window as any).__auth ??= {user:{email:"nelly@example.com",displayName:"Nelly Siswa"},loading:false,configured:true};
 return {...state,getToken,signOut:async()=>{(window as any).__signedOut=true},signIn:async()=>{},signInWithGoogle:async()=>{}};
}
export function AuthProvider({children}:{children:ReactNode}) { return children; }
