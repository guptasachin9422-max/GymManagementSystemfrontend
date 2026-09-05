import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){ const [session,setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem('fitlife_session'))||null}catch{return null}}); const [loading,setLoading]=useState(false);
 const login=async(email,password)=>{setLoading(true);try{const {data}=await authApi.login(email,password);const next={...data,role:String(data.role||'').toUpperCase()};if(!next.token)throw new Error('Incomplete login response.');localStorage.setItem('fitlife_session',JSON.stringify(next));setSession(next);return next;}finally{setLoading(false)}};
 const logout=()=>{localStorage.removeItem('fitlife_session');setSession(null);}; useEffect(()=>{if(session)localStorage.setItem('fitlife_session',JSON.stringify(session))},[session]); return <AuthContext.Provider value={{session,loading,login,logout}}>{children}</AuthContext.Provider> }
export const useAuth=()=>useContext(AuthContext);
