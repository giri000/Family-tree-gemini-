import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogOut } from 'lucide-react';

export function AuthGuard({ children, userEmailToLock }: { children: React.ReactNode, userEmailToLock: string }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(userEmailToLock);
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse transition-colors">Checking permissions...</div>;
  }

  if (!session) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-6">
             <div className="text-center">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-xl flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400 mb-4 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100">Private Vault Locked</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Only the owner ({userEmailToLock}) is authorized to access this Lineage Archive.</p>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Email Address</label>
                   <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 focus:outline-none"
                   />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
                     <span>Master Password</span>
                   </label>
                   <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 dark:placeholder-slate-500"
                   />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                    <button
                       onClick={async () => {
                         setMsg('Authenticating...');
                         const { error } = await supabase.auth.signInWithPassword({ email, password });
                         if (error) {
                             if (error.message.includes('Invalid login credentials')) {
                               setMsg('Invalid password. If this is your first time, click "Register System Owner" below.');
                             } else {
                               setMsg(error.message);
                             }
                         } else {
                           setMsg('');
                         }
                       }}
                       className="w-full bg-indigo-600 dark:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
                    >
                       Unlock Vault
                    </button>

                    <button
                       onClick={async () => {
                         if (!password || password.length < 6) {
                            setMsg('Password must be at least 6 characters.');
                            return;
                         }
                         setMsg('Registering owner...');
                         const { error } = await supabase.auth.signUp({ email, password });
                         if (error) setMsg(error.message);
                         else setMsg('Owner registered successfully! You may now unlock the vault.');
                       }}
                       className="w-full text-indigo-600 dark:text-indigo-400 font-bold py-2.5 rounded-lg text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition border border-indigo-100 dark:border-indigo-800/50"
                    >
                       Register System Owner (First Time Only)
                    </button>
                </div>
             </div>
             {msg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-lg text-xs text-rose-600 dark:text-rose-400 font-semibold text-center">
                  {msg}
                </div>
             )}
          </div>
       </div>
     )
  }

  // Double check email matches
  if (session.user.email !== userEmailToLock) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors">
              <div className="text-center space-y-4">
                  <p className="font-bold text-rose-600 dark:text-rose-400">Unauthorized. Please log in as the owner.</p>
                  <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-sm font-bold">Sign Out</button>
              </div>
          </div>
      )
  }

  return (
    <div className="relative group/auth">
       {/* Owner Mode indicator */}
       {children}
    </div>
  );
}
