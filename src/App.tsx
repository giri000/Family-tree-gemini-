import React, { useState, useEffect } from 'react';
import { FamilyMember, ActiveTab } from './types';
import { SAMPLE_FAMILY } from './sampleData';
import { FamilyTreeVisualizer } from './components/FamilyTreeVisualizer';
import { MemberForm } from './components/MemberForm';
import { FamilyTimeline } from './components/FamilyTimeline';
import { StatsDashboard } from './components/StatsDashboard';
import { DatabaseControls } from './components/DatabaseControls';
import { 
  Users, 
  GitFork, 
  Clock, 
  BarChart, 
  Database, 
  Plus, 
  Search, 
  Heart, 
  Info, 
  UserCheck, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  BookOpen,
  AlertTriangle,
  LogOut
} from 'lucide-react';

import { supabase, mapToDb, mapFromDb, isSupabaseConfigured } from './lib/supabase';
import { SupabaseSetup } from './components/SupabaseSetup';

import { AuthGuard } from './components/AuthGuard';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const isConfigured = isSupabaseConfigured();
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [focusMemberId, setFocusMemberId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab | 'database'>('tree');
  
  // Search & Filters for the Member Directory View
  const [memberSearch, setMemberSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [lifespanFilter, setLifespanFilter] = useState<string>('all');

  // Form Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [prefilledRelations, setPrefilledRelations] = useState<{
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
  } | undefined>(undefined);

  // 1. Supabase Initialization & Realtime Subscription
  useEffect(() => {
    if (!isConfigured) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase.from('family_members').select('*');
      if (error) {
        console.error('Supabase fetch error:', error);
        setDbStatus(`DB_ERROR: ${error.message}`);
        return;
      }
      if (data) {
        const parsed = data.map(mapFromDb);
        setMembers(parsed);
        setFocusMemberId(prev => {
          if (!prev && parsed.length > 0) {
            return parsed.find(m => m.id === '11111111-1111-4111-a111-111111111118')?.id || parsed[0].id;
          }
          return prev;
        });
      }
    };

    const initDb = async () => {
       try {
         const { error: selectError } = await supabase.from('family_members').select('id').limit(1);
         if (selectError) {
            if (selectError.code === '42P01' || selectError.message?.includes('does not exist')) {
                setDbStatus('TABLE_MISSING');
            } else if (selectError.code === '42501' || selectError.message?.includes('security')) {
                setDbStatus('RLS_BLOCKED');
            } else {
                setDbStatus(`DB_ERROR: ${selectError.message || selectError.code}`);
            }
            return;
         }

         const { error: rlsError } = await supabase
              .from('family_members')
              .upsert({ id: '00000000-0000-0000-0000-000000000000', first_name: 'test' })
              .select();

         if (rlsError) {
             if (rlsError.code === '42501' || rlsError.message?.includes('security')) {
                  setDbStatus('RLS_BLOCKED');
             } else {
                  setDbStatus(`DB_ERROR: ${rlsError.message || rlsError.code}`);
             }
             return;
         }

         await supabase.from('family_members').delete().eq('id', '00000000-0000-0000-0000-000000000000');
         setDbStatus('OK');
         fetchMembers();

       } catch (err: any) {
         setDbStatus(`DB_ERROR: ${err.message || 'Unknown catch error'}`);
       }
    };

    initDb();

    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_members' },
        (payload) => {
           // Database modified (maybe by an AI Agent!). Refetch.
           fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfigured]);

  if (!isConfigured) {
    return <SupabaseSetup />;
  }

  // 3. Resolve Active Focus Member
  const currentFocusMember = members.find((m) => m.id === focusMemberId) || members[0];

  // 4. Async Supabase Sync Handler 
  const handleSaveMember = async (savedMember: FamilyMember) => {
    let updatables = [mapToDb(savedMember)];
    let updatedMembers = [...members];
    const isNew = !updatedMembers.some((m) => m.id === savedMember.id);
    if (isNew) {
      updatedMembers.push(savedMember);
    } else {
      updatedMembers = updatedMembers.map((m) => (m.id === savedMember.id ? savedMember : m));
    }

    // Handle Bidirectional Spouse Sync on the Database
    if (savedMember.spouseId) {
      updatedMembers = updatedMembers.map(m => {
        if (m.id === savedMember.spouseId) return { ...m, spouseId: savedMember.id };
        if (m.spouseId === savedMember.spouseId && m.id !== savedMember.id) return { ...m, spouseId: undefined };
        return m;
      });

      const spouse = members.find(m => m.id === savedMember.spouseId);
      if (spouse) updatables.push(mapToDb({ ...spouse, spouseId: savedMember.id }));

      const exSpouse = members.find(m => m.spouseId === savedMember.id && m.id !== savedMember.spouseId);
      if (exSpouse) updatables.push(mapToDb({ ...exSpouse, spouseId: undefined }));
    } else {
      updatedMembers = updatedMembers.map(m => {
        if (m.spouseId === savedMember.id) return { ...m, spouseId: undefined };
        return m;
      });

      const exSpouse = members.find(m => m.spouseId === savedMember.id);
      if (exSpouse) updatables.push(mapToDb({ ...exSpouse, spouseId: undefined }));
    }

    // Set immediate pessimistic local state for instantaneous feel
    setMembers(updatedMembers);
    setFocusMemberId(savedMember.id);
    setShowForm(false);
    setEditingMember(null);
    setPrefilledRelations(undefined);

    // Push to Supabase asynchronously
    try {
      // Adding .select() guarantees that if RLS is active and blocks the write, it will throw an error immediately here.
      const { error } = await supabase.from('family_members').upsert(updatables).select();
      if (error) {
        console.error('Supabase upsert error:', error);
        setDbStatus(error.code === '42501' || error.message?.includes('security') ? 'RLS_BLOCKED' : `DB_ERROR: ${error.message}`);
      }
    } catch (err: any) {
      console.error('Supabase client error:', err);
      setDbStatus(err?.code === '42501' ? 'RLS_BLOCKED' : `DB_ERROR: ${err.message}`);
    }
  };

  // 5. Async Supabase Delete
  const handleDeleteMember = async (id: string) => {
    // Re-focus immediately
    if (focusMemberId === id) {
      const remaining = members.filter(m => m.id !== id);
      if (remaining.length > 0) setFocusMemberId(remaining[0].id);
    }
    
    setShowForm(false);
    setEditingMember(null);
    setPrefilledRelations(undefined);

    const updatedMembers = members.filter(m => m.id !== id).map(m => {
      let patch = { ...m };
      if (patch.fatherId === id) patch.fatherId = undefined;
      if (patch.motherId === id) patch.motherId = undefined;
      if (patch.spouseId === id) patch.spouseId = undefined;
      return patch;
    });

    setMembers(updatedMembers);

    try {
      await supabase.from('family_members').delete().eq('id', id);

      // Clean up references in other members
      const updatables = members.filter(m => m.fatherId === id || m.motherId === id || m.spouseId === id).map(m => {
        let patch = { ...m };
        if (patch.fatherId === id) patch.fatherId = undefined;
        if (patch.motherId === id) patch.motherId = undefined;
        if (patch.spouseId === id) patch.spouseId = undefined;
        return mapToDb(patch);
      });

      if (updatables.length > 0) {
        await supabase.from('family_members').upsert(updatables);
      }
    } catch (err: any) {
      console.error('Delete error', err);
      setDbStatus(`DB_ERROR: ${err.message}`);
    }
  };

  // 6. Quick Action to add relations from Tree placeholders
  const handleAddRelation = (
    relationType: 'father' | 'mother' | 'spouse' | 'child',
    relativeToId: string
  ) => {
    const relative = members.find((m) => m.id === relativeToId);
    if (!relative) return;

    let relations: typeof prefilledRelations = {};

    switch (relationType) {
      case 'father':
        relations = { spouseId: relative.motherId }; // Father is spouse to target's mother
        // Target's fatherId will be hooked when the target's configuration registers this new person.
        // To do this simply, we will open a new member form where we prefill that they are the FATHER of relativeToId!
        // So let's handle setting the form up:
        setPrefilledRelations({ spouseId: relative.motherId });
        break;
      case 'mother':
        relations = { spouseId: relative.fatherId }; // Mother is spouse to target's father
        break;
      case 'spouse':
        relations = { spouseId: relative.id };
        break;
      case 'child':
        // Child has target as parents!
        if (relative.gender === 'female') {
          relations = { motherId: relative.id, fatherId: relative.spouseId };
        } else {
          relations = { fatherId: relative.id, motherId: relative.spouseId };
        }
        break;
    }

    // Set the state and bring up the form
    setEditingMember(null);
    setPrefilledRelations(relations);
    setShowForm(true);

    // Note: To map the newly created parent back to the child, we will patch the child.
    // Let's hook a special listener on save: when creating a 'father' or 'mother', we want the child (relativeToId) to be updated.
    // To implement this elegantly and cleanly, the form pre-selects the child's parents. Yes! In our MemberForm,
    // when we save, if the user explicitly assigns fatherId or motherId, the links automatically form.
  };

  // 7. Directory List Filters
  const filteredDirectoryMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(memberSearch.toLowerCase()) || 
                          (m.occupation || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                          (m.notes || '').toLowerCase().includes(memberSearch.toLowerCase());
    
    const matchesGender = genderFilter === 'all' || m.gender === genderFilter;
    
    const matchesLifespan = lifespanFilter === 'all' 
      ? true 
      : lifespanFilter === 'living' 
      ? !m.isDeceased 
      : m.isDeceased;

    return matchesSearch && matchesGender && matchesLifespan;
  });

  return (
    <AuthGuard userEmailToLock="giriprasath51@gmail.com">
      <div id="family-tree-app-root" className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans antialiased">
      {dbStatus && dbStatus !== 'OK' && (
        <div className="bg-amber-600 text-white p-4 text-sm font-medium z-50 flex flex-col gap-2 relative shadow-lg">
           {dbStatus === 'TABLE_MISSING' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-lg pb-1">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h2>Database Table Missing</h2>
              </div>
              <div className="bg-amber-950 p-4 rounded-xl font-mono text-xs overflow-x-auto text-amber-200 shadow-inner">
                <p className="opacity-90 mb-3">Run the following SQL in your Supabase SQL Editor to create the required table:</p>
                <pre className="select-all block p-3 bg-amber-900 border border-amber-800 rounded text-amber-100 whitespace-pre">
{`-- 1. Drop the problematic RLS auto-enable trigger (if it exists)
DROP EVENT TRIGGER IF EXISTS ensure_rls;
DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;

-- 2. Drop the table if it already exists to start fresh
DROP TABLE IF EXISTS public.family_members CASCADE;

-- 3. Create the table (No trailing commas)
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text,
  gender text DEFAULT 'other',
  birth_date date,
  birth_place text,
  is_deceased boolean DEFAULT false,
  death_date date,
  death_place text,
  occupation text,
  notes text,
  avatar_color text DEFAULT 'bg-slate-200 text-slate-700',
  email text,
  phone text,
  address text,
  aliases text,
  ai_context text,
  father_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  mother_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  spouse_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Enable RLS and create policies for authenticated users
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read" 
ON public.family_members FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert" 
ON public.family_members FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update" 
ON public.family_members FOR UPDATE 
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete" 
ON public.family_members FOR DELETE 
TO authenticated USING (true);`}
                </pre>
              </div>
            </div>
           )}

           {dbStatus === 'RLS_BLOCKED' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>Database Write Blocked by RLS</p>
              </div>
              <div className="bg-amber-950 p-4 rounded-xl mt-2 font-mono text-xs overflow-x-auto text-amber-200 shadow-inner">
                 <p className="opacity-90">Your Supabase Table works best with authenticated Row Level Security (RLS) policies.</p>
                 <br/>
                 <p className="opacity-90">-- Please run this exact command in your Supabase SQL Editor to allow authenticated owner reads & writes:</p>
                 <br/>
                 <pre className="select-all block p-3 bg-amber-900 border border-amber-800 rounded text-amber-100 font-bold whitespace-pre mt-2 text-xs leading-relaxed">
{`ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read" ON public.family_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert" ON public.family_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update" ON public.family_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete" ON public.family_members FOR DELETE TO authenticated USING (true);`}
                 </pre>
              </div>
            </div>
          )}
          {dbStatus.startsWith('DB_ERROR:') && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-bold">Database Connection / Configuration Error</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-amber-800 hover:bg-amber-700 rounded text-xs font-semibold"
                >
                  Retry Connection
                </button>
              </div>
              <div className="bg-amber-950 p-4 rounded-xl mt-2 font-mono text-xs overflow-x-auto text-amber-200 shadow-inner space-y-2">
                <p>The application could not connect to Supabase properly or encountered an unexpected error.</p>
                <p><strong>Common Causes:</strong></p>
                <ul className="list-disc pl-4 opacity-90 space-y-1">
                  <li>Invalid <code className="bg-amber-900 px-1 rounded text-amber-100">VITE_SUPABASE_URL</code> (should be like https://xy....supabase.co)</li>
                  <li>Invalid <code className="bg-amber-900 px-1 rounded text-amber-100">VITE_SUPABASE_ANON_KEY</code> (make sure it's the <strong>anon public</strong> key, not the service_role key)</li>
                  <li>Copy-paste errors (trailing spaces, missing characters)</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-amber-900/50">
                  <p className="text-[10px] uppercase text-amber-500 font-bold mb-1">Developer Error Details:</p>
                  <p className="whitespace-pre-wrap">{dbStatus.substring(9)}</p>
                </div>
              </div>
            </div>
           )}
        </div>
      )}

      {/* Editorial Navigation Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Heirloom styling */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-base font-bold font-serif text-slate-800 dark:text-slate-100 flex items-center gap-1.5 justify-center sm:justify-start">
                Lineage Archives
                <span className="text-[10px] uppercase font-sans font-extrabold text-indigo-650 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 px-1.5 py-0.5 rounded-md tracking-wider">
                  Personal Vault
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Digital Family Record, Milestones & Connections</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
            <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 w-max sm:w-auto mx-auto sm:mx-0 transition-colors">
              <button
                id="tab-btn-tree"
                onClick={() => setActiveTab('tree')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'tree'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-700 dark:text-indigo-300'
                    : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <GitFork className="w-3.5 h-3.5 rotate-90" />
                <span>Interactive Tree</span>
              </button>
              <button
                id="tab-btn-members"
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'members'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-700 dark:text-indigo-300'
                    : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Member Gallery</span>
              </button>
              <button
                id="tab-btn-timeline"
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'timeline'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-700 dark:text-indigo-300'
                    : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
              <button
                id="tab-btn-stats"
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'stats'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-700 dark:text-indigo-300'
                    : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <BarChart className="w-3.5 h-3.5" />
                <span>Diagnostics</span>
              </button>
              <button
                id="tab-btn-database"
                onClick={() => setActiveTab('database')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'database'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-700 dark:text-indigo-300'
                    : 'hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Backups</span>
              </button>
            </nav>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-800/40 border border-rose-100 dark:border-rose-800/50 hover:border-rose-200 dark:hover:border-rose-700 px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer select-none"
            >
              <LogOut className="w-4 h-4" /> Lock Vault
            </button>
            <button
              id="btn-global-add-member"
              onClick={() => {
                setEditingMember(null);
                setPrefilledRelations(undefined);
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" /> Add Family member
            </button>
          </div>
        </div>
      </header>

      {/* Main body canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic content rendering */}
        {members.length === 0 ? (
          /* Empty database prompt */
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 animate-fade-in mt-12 transition-colors">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-2xl flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold text-slate-800 dark:text-slate-100">Archive Vault is Blank</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                You currently have no registered family members inside your local database. You can start fresh or quickly populate the system with a complete pre-configured sample lineage to see it in action.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                id="btn-load-sample-empty"
                onClick={async () => {
                  const mapped = SAMPLE_FAMILY.map(mapToDb);
                  try {
                    const { error } = await supabase.from('family_members').upsert(mapped).select();
                    if (error) {
                       console.error('Supabase load sample error:', error);
                       setDbStatus(error.code === '42501' || error.message?.includes('security') ? 'RLS_BLOCKED' : `DB_ERROR: ${error.message}`);
                       return;
                    }
                    setMembers(SAMPLE_FAMILY);
                    setFocusMemberId('11111111-1111-4111-a111-111111111118');
                  } catch (err: any) {
                    console.error('Client error loading sample:', err);
                    setDbStatus(err?.code === '42501' ? 'RLS_BLOCKED' : `DB_ERROR: ${err.message}`);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 cursor-pointer shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-250 dark:text-indigo-200" /> Load 3-Gen Sample Family Tree
              </button>
              <button
                id="btn-add-initial-member"
                onClick={() => {
                  setEditingMember(null);
                  setPrefilledRelations(undefined);
                  setShowForm(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Create New Member Record from Scratch
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: THE TREE VISUALIZER */}
            {activeTab === 'tree' && currentFocusMember && (
              <div className="space-y-6">
                {/* Visualizer header controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100">
                      Visual Connections Tree
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Currently centring relationships around{' '}
                      <span className="font-bold text-indigo-750 dark:text-indigo-400">{currentFocusMember.firstName} {currentFocusMember.lastName}</span>
                    </p>
                  </div>

                  {/* Dropdown to change focus member */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tree Center Focus:</span>
                    <select
                      id="select-tree-focus-member"
                      value={focusMemberId}
                      onChange={(e) => setFocusMemberId(e.target.value)}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg py-1.5 px-2.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      {members
                        .sort((a, b) => a.firstName.localeCompare(b.firstName))
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.firstName} {m.lastName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <FamilyTreeVisualizer
                  focusMember={currentFocusMember}
                  allMembers={members}
                  onFocus={(id) => setFocusMemberId(id)}
                  onEdit={(member) => {
                    setEditingMember(member);
                    setPrefilledRelations(undefined);
                    setShowForm(true);
                  }}
                  onAddRelation={handleAddRelation}
                />
              </div>
            )}

            {/* TAB 2: MEMBER DIRECTORY / GALLERY */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                {/* Search / Filters Interface */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      id="input-directory-search"
                      type="text"
                      placeholder="Search name, notes, job..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
                    {/* Filter Gender */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gender:</span>
                      <select
                        id="select-filter-gender"
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 cursor-pointer transition-colors"
                      >
                        <option value="all">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Filter Survival */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
                      <select
                        id="select-filter-status"
                        value={lifespanFilter}
                        onChange={(e) => setLifespanFilter(e.target.value)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 cursor-pointer transition-colors"
                      >
                        <option value="all">All Records</option>
                        <option value="living">Living Only</option>
                        <option value="deceased">Deceased Only</option>
                      </select>
                    </div>

                    {/* Active list counter */}
                    <div className="text-xs font-medium text-slate-400 font-mono ml-auto md:ml-0">
                      Found {filteredDirectoryMembers.length} profiles
                    </div>
                  </div>
                </div>

                {/* Grid List */}
                {filteredDirectoryMembers.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed dark:border-slate-800 rounded-2xl transition-colors">
                    <Search className="w-8 h-8 text-slate-350 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No family member matched your current parameters.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try emptying your keyword filters or adding a new member profile.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredDirectoryMembers.map((member) => {
                      const age = member.birthDate && !member.isDeceased
                        ? new Date().getFullYear() - new Date(member.birthDate).getFullYear()
                        : null;
                        
                      const parentNames = [
                        member.fatherId && members.find((m) => m.id === member.fatherId)?.firstName,
                        member.motherId && members.find((m) => m.id === member.motherId)?.firstName,
                      ].filter(Boolean);

                      return (
                        <div
                          key={member.id}
                          id={`directory-card-${member.id}`}
                          className="bg-white dark:bg-slate-800 border dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all relative overflow-hidden"
                        >
                          <div className="space-y-3">
                            {/* Profile Badge row */}
                            <div className="flex items-start justify-between">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif text-sm font-bold shadow-2xs ${member.avatarColor}`}>
                                {member.firstName[0]}{member.lastName?.[0] || ''}
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${
                                  member.gender === 'male' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : member.gender === 'female' ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-750 dark:text-slate-300'
                                }`}>
                                  {member.gender}
                                </span>
                                {member.isDeceased ? (
                                  <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">Passed</span>
                                ) : (
                                  <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">Age {age}</span>
                                )}
                              </div>
                            </div>

                            {/* Core info labels */}
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                {member.firstName} {member.lastName}
                              </h4>
                              {member.birthDate && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                  {new Date(member.birthDate).getFullYear()} – {member.isDeceased ? (member.deathDate ? new Date(member.deathDate).getFullYear() : 'Deceased') : 'Present'}
                                </p>
                              )}
                            </div>

                            {/* Short bio and lineage parents summary */}
                            <div className="space-y-1 text-slate-500 dark:text-slate-400 text-xs">
                              {member.occupation && (
                                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                  💼 {member.occupation}
                                </p>
                              )}
                              {parentNames.length > 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  👪 Child of {parentNames.join(' & ')}
                                </p>
                              )}
                              {member.notes && (
                                <p className="text-[10px] italic text-slate-400 dark:text-slate-500 line-clamp-2 mt-1">
                                  "{member.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick tool row */}
                          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <button
                              id={`dir-edit-btn-${member.id}`}
                              onClick={() => {
                                setEditingMember(member);
                                setPrefilledRelations(undefined);
                                setShowForm(true);
                              }}
                              className="text-[10px] font-semibold text-center hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 hover:text-slate-700 dark:hover:text-slate-200 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                            >
                              Edit Profile
                            </button>
                            <button
                              id={`dir-focus-btn-${member.id}`}
                              onClick={() => {
                                setFocusMemberId(member.id);
                                setActiveTab('tree');
                              }}
                              className="text-[10px] font-semibold text-center text-indigo-650 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg py-1 cursor-pointer transition-colors"
                            >
                              Center Tree
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TIMELINE VIEW */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100">Family Chronicle & Milestones</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A combined chronological perspective of birth and passing records of generations.</p>
                </div>
                <FamilyTimeline 
                  members={members} 
                  onFocusMember={(id) => {
                    setFocusMemberId(id);
                    setActiveTab('tree');
                  }} 
                />
              </div>
            )}

            {/* TAB 4: DIAGNOSTICS & STATS DASHBOARD */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100">Diagnostics & Statistics</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A strategic overview of line-length preservation, demographics, longevity diagnostics, and calendar celebrations.</p>
                </div>
                <StatsDashboard
                  members={members}
                  onFocusMember={(id) => {
                    setFocusMemberId(id);
                    setActiveTab('tree');
                  }}
                />
              </div>
            )}

            {/* TAB 5: BACKUP & DATA CONTROLS */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100">Lineage Backups Panel</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage database records, wipe cookies or local files, restore presets, or retrieve JSON archives.</p>
                </div>
                <DatabaseControls
                  members={members}
                  onImport={async (importedMembers) => {
                    if (importedMembers.length > 0) {
                      try {
                        const mapped = importedMembers.map(mapToDb);
                        const { error } = await supabase.from('family_members').upsert(mapped).select();
                        if (error) {
                           console.error('Import error', error);
                           setDbStatus(error.code === '42501' || error.message?.includes('security') ? 'RLS_BLOCKED' : `DB_ERROR: ${error.message}`);
                           return;
                        }
                        setFocusMemberId(importedMembers[0].id);
                        setActiveTab('tree');
                      } catch (err: any) {
                        console.error('import catch', err);
                        setDbStatus(err?.code === '42501' ? 'RLS_BLOCKED' : `DB_ERROR: ${err.message}`);
                      }
                    }
                  }}
                  onClearDatabase={async () => {
                    // Wipe all entries from Supabase gracefully by ids
                    if (members.length > 0) {
                       try {
                         setMembers([]);
                         const ids = members.map(m => m.id);
                         const { error } = await supabase.from('family_members').delete().in('id', ids);
                         if (error) {
                           setDbStatus(`DB_ERROR: ${error.message}`);
                         }
                       } catch (err: any) {
                           setDbStatus(`DB_ERROR: ${err.message}`);
                       }
                    }
                  }}
                  onResetSampleData={async () => {
                    const mapped = SAMPLE_FAMILY.map(mapToDb);
                    setMembers(SAMPLE_FAMILY);
                    try {
                      const { error } = await supabase.from('family_members').upsert(mapped).select();
                      if (error) {
                        console.error('Supabase load sample error:', error);
                        setDbStatus(error.code === '42501' || error.message?.includes('security') ? 'RLS_BLOCKED' : `DB_ERROR: ${error.message}`);
                      }
                    } catch (err: any) {
                      console.error('Client error loading sample:', err);
                      setDbStatus(err?.code === '42501' ? 'RLS_BLOCKED' : `DB_ERROR: ${err.message}`);
                    }
                    setFocusMemberId('11111111-1111-4111-a111-111111111118');
                    setActiveTab('tree');
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Slide overlay / Card edit modal */}
      {showForm && (
        <MemberForm
          member={editingMember}
          allMembers={members}
          onSave={handleSaveMember}
          onDelete={handleDeleteMember}
          onClose={() => {
            setShowForm(false);
            setEditingMember(null);
            setPrefilledRelations(undefined);
          }}
          prefilledRelations={prefilledRelations}
        />
      )}
    </div>
    </AuthGuard>
  );
}
