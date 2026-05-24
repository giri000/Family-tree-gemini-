import React from 'react';
import { Database, Key, Server, Play } from 'lucide-react';

export function SupabaseSetup() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
          <Database className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold font-serif text-slate-800 mb-2">Connect Your Supabase Database</h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xl mb-8">
          You requested an AI Agent-accessible database connection. We have wired this app to sync real-time directly with Supabase, meaning changes made by OpenCLAW or Hermes will instantly reflect on the family tree visualizer.
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">1</span>
            <div>
              <h3 className="font-bold text-slate-800">Add Environment Variables</h3>
              <p className="text-xs text-slate-500 mt-1 mb-2 leading-relaxed">
                Open the settings or secrets panel in AI Studio and add your Supabase connection parameters.
              </p>
              <div className="bg-slate-800 text-slate-300 p-3 rounded-xl font-mono text-[10px] space-y-1">
                <p><span className="text-pink-400">VITE_SUPABASE_URL</span> = "https://your-project.supabase.co"</p>
                <p><span className="text-pink-400">VITE_SUPABASE_ANON_KEY</span> = "your-anon-role-key-string"</p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">2</span>
            <div>
              <h3 className="font-bold text-slate-800">Execute the SQL Schema</h3>
              <p className="text-xs text-slate-500 mt-1 mb-2 leading-relaxed">
                Connect your AI agents, create a new table inside Supabase, and enable the Realtime API stream so the browser UI instantly reacts to backend writes. I have created a `supabase-schema.sql` file in the root directory. Copy and paste it completely into your Supabase SQL Editor and execute it.
              </p>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3">
                <Play className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-indigo-900">
                  You can view the full setup parameters inside the `supabase-schema.sql` file provided in the Editor tab.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
          <Server className="w-4 h-4 text-emerald-500" />
          <p className="text-sm font-semibold text-slate-700 animate-pulse">Waiting for credentials / applet refresh...</p>
        </div>
      </div>
    </div>
  );
}
