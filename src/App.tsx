import React, { useState, useEffect } from 'react';
import { FamilyMember, ActiveTab } from './types';
import { FamilyTreeVisualizer } from './components/FamilyTreeVisualizer';
import { MemberForm } from './components/MemberForm';
import { FamilyTimeline } from './components/FamilyTimeline';
import { StatsDashboard } from './components/StatsDashboard';
import { DatabaseControls } from './components/DatabaseControls';
import { MemberSearch } from './components/MemberSearch';
import { FamilyNetworkGraph } from './components/FamilyNetworkGraph';
import { DuplicateFinder } from './components/DuplicateFinder';

// Lucide icons
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
  LogOut,
  Network
} from 'lucide-react';

import { supabase, mapToDb, mapFromDb, isSupabaseConfigured, safeUpsert, missingDbColumns } from './lib/supabase';
import { SupabaseSetup } from './components/SupabaseSetup';

import { AuthGuard } from './components/AuthGuard';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const isConfigured = isSupabaseConfigured();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [focusMemberId, setFocusMemberId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab | 'database'>('tree');
  const [dbWarnings, setDbWarnings] = useState<string[]>([]);
  
  // Periodically check if safeUpsert detected any missing DB schema columns (such as blood_group or secondary_phone)
  useEffect(() => {
    const interval = setInterval(() => {
      if (missingDbColumns.length !== dbWarnings.length) {
        setDbWarnings([...missingDbColumns]);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [dbWarnings.length]);
  
  // Search & Filters for the Member Directory View
  const [memberSearch, setMemberSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [lifespanFilter, setLifespanFilter] = useState<string>('all');
  const [directorySort, setDirectorySort] = useState<string>('name-asc');
  const [showDuplicateFinder, setShowDuplicateFinder] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Form Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [prefilledRelations, setPrefilledRelations] = useState<{
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
  } | undefined>(undefined);
  const [pendingParentLink, setPendingParentLink] = useState<{ childId: string; role: 'father' | 'mother' } | undefined>(undefined);

  // 1. Supabase Initialization & Realtime Subscription
  useEffect(() => {
    if (!isConfigured) return;

    const fetchMembers = async () => {
      setDbError(null);
      const { data, error } = await supabase.from('family_members').select('*');
      if (error) {
        console.error('Supabase fetch error:', error);
        setDbError(error.message);
        return;
      }
      if (data) {
        const parsed = data.map(mapFromDb);
        setMembers(parsed);
        setFocusMemberId(prev => {
          if (!prev && parsed.length > 0) {
            const giri = (() => {
              // 1. Look for exact full name "giri prasath s p"
              let match = parsed.find(m => `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase() === 'giri prasath s p');
              if (match) return match;

              // 2. Look for "giri prasath" in full name
              match = parsed.find(m => `${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase().includes('giri prasath'));
              if (match) return match;

              // 3. Look for email match
              match = parsed.find(m => m.email === 'giriprasath51@gmail.com');
              if (match) return match;

              // 4. Look for exact first name "giri"
              match = parsed.find(m => (m.firstName || '').trim().toLowerCase() === 'giri');
              if (match) return match;

              // 5. Look for id
              match = parsed.find(m => m.id === 'db0ed3db-fb87-4573-8966-2322428f51e7');
              if (match) return match;

              // 6. Generic includes "giri"
              match = parsed.find(m => (m.firstName || '').toLowerCase().includes('giri'));
              return match;
            })();
            return giri?.id || parsed.find(m => m.id === '11111111-1111-4111-a111-111111111118')?.id || parsed[0].id;
          }
          return prev;
        });
      }
    };

    fetchMembers();

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
  const currentFocusMember = members.find((m) => m.id === focusMemberId) || 
    members.find(m => 
      m.id === 'db0ed3db-fb87-4573-8966-2322428f51e7' || 
      m.email === 'giriprasath51@gmail.com' || 
      (m.firstName && m.firstName.toLowerCase().includes('giri'))
    ) || 
    members[0];

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

    // Handle pending parent link
    if (isNew && pendingParentLink) {
      const childIndex = updatedMembers.findIndex((m) => m.id === pendingParentLink.childId);
      if (childIndex !== -1) {
        const child = { ...updatedMembers[childIndex] };
        if (pendingParentLink.role === 'father') {
          child.fatherId = savedMember.id;
        } else if (pendingParentLink.role === 'mother') {
          child.motherId = savedMember.id;
        }
        updatables.push(mapToDb(child));
        updatedMembers[childIndex] = child;
      }
    }

    try {
      if (isConfigured) {
        const { error } = await safeUpsert(updatables, true);
        if (error) {
          console.error('Supabase upsert error:', error);
          alert(`Database save failed: ${error.message}`);
          return; // Don't proceed to update UI if backend failed
        }
      }
    } catch (err: any) {
      console.error('Supabase client error:', err);
      alert(`Client save failed: ${err.message}`);
      return;
    }

    // Set immediate pessimistic local state for instantaneous feel
    setMembers(updatedMembers);
    setFocusMemberId(savedMember.id);
    setShowForm(false);
    setEditingMember(null);
    setPrefilledRelations(undefined);
    setPendingParentLink(undefined);
  };

  // 5. Async Supabase Delete
  const handleDeleteMember = async (id: string) => {
    try {
      if (isConfigured) {
        const { error: delError } = await supabase.from('family_members').delete().eq('id', id);
        if (delError) {
          alert(`Delete failed: ${delError.message}`);
          return;
        }

        // Clean up references in other members
        const updatables = members.filter(m => m.fatherId === id || m.motherId === id || m.spouseId === id).map(m => {
          let patch = { ...m };
          if (patch.fatherId === id) patch.fatherId = undefined;
          if (patch.motherId === id) patch.motherId = undefined;
          if (patch.spouseId === id) patch.spouseId = undefined;
          return mapToDb(patch);
        });

        if (updatables.length > 0) {
          const { error: upsertError } = await safeUpsert(updatables);
          if (upsertError) {
            console.error('Reference cleanup error:', upsertError);
          }
        }
      }
    } catch (err: any) {
      console.error('Delete error', err);
      alert(`Delete error: ${err.message}`);
      return;
    }

    // Re-focus immediately
    if (focusMemberId === id) {
      const remaining = members.filter(m => m.id !== id);
      if (remaining.length > 0) setFocusMemberId(remaining[0].id);
    }
    
    setShowForm(false);
    setEditingMember(null);
    setPrefilledRelations(undefined);
    setPendingParentLink(undefined);

    const updatedMembers = members.filter(m => m.id !== id).map(m => {
      let patch = { ...m };
      if (patch.fatherId === id) patch.fatherId = undefined;
      if (patch.motherId === id) patch.motherId = undefined;
      if (patch.spouseId === id) patch.spouseId = undefined;
      return patch;
    });

    setMembers(updatedMembers);
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
        relations = { spouseId: relative.motherId };
        setPendingParentLink({ childId: relative.id, role: 'father' });
        break;
      case 'mother':
        relations = { spouseId: relative.fatherId };
        setPendingParentLink({ childId: relative.id, role: 'mother' });
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

  // 7. Directory List Filters and Active Sorting
  const filteredDirectoryMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName || ''}`.toLowerCase();
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
  }).sort((a, b) => {
    const [field, direction] = directorySort.split('-');
    const isAsc = direction === 'asc';

    if (field === 'name') {
      const nameA = `${a.firstName} ${a.lastName || ''}`.trim().toLowerCase();
      const nameB = `${b.firstName} ${b.lastName || ''}`.trim().toLowerCase();
      return isAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }

    if (field === 'created') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return isAsc ? timeA - timeB : timeB - timeA;
    }

    if (field === 'edited') {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return isAsc ? timeA - timeB : timeB - timeA;
    }

    if (field === 'dob') {
      const timeA = a.birthDate ? new Date(a.birthDate).getTime() : (isAsc ? Infinity : -Infinity);
      const timeB = b.birthDate ? new Date(b.birthDate).getTime() : (isAsc ? Infinity : -Infinity);
      return isAsc ? timeA - timeB : timeB - timeA;
    }

    return 0;
  });

  return (
    <AuthGuard userEmailToLock="giriprasath51@gmail.com">
      <div id="family-tree-app-root" className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans antialiased">
        {dbError && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs py-2.5 px-4 text-center font-semibold flex items-center justify-center gap-2 shadow-md animate-pulse">
            <span>⚠️ Supabase Connection/RLS Issue: {dbError}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white/20 hover:bg-white/30 text-white rounded px-2.5 py-0.5 ml-2 font-bold transition focus:outline-none"
            >
              Retry Sync
            </button>
          </div>
        )}
        
        {dbWarnings.length > 0 && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-900 text-xs py-3 px-6 font-semibold flex flex-col lg:flex-row items-center justify-between gap-3 shadow-md animate-fade-in border-b border-amber-600/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-slate-900 shrink-0" />
              <span>
                <strong>Database Schema Outdated:</strong> Your Supabase table is missing columns: <code className="bg-amber-600/20 px-1 py-0.5 rounded text-slate-950 font-serif">{dbWarnings.join(', ')}</code>. Blood groups/phones are omitted on saves to prevent database crashes. Run SQL in SQL Editor.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end">
              <button 
                onClick={() => {
                  const sql = `ALTER TABLE public.family_members ${dbWarnings.map(col => `ADD COLUMN IF NOT EXISTS ${col} text`).join(', ')};`;
                  navigator.clipboard.writeText(sql);
                  alert('Schema migration SQL copied to clipboard! Paste and run in SQL Editor.');
                }}
                className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold px-3 py-1.5 rounded-full text-[10px] border border-slate-800 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                Copy SQL
              </button>
            </div>
          </div>
        )}

      {/* Editorial Navigation Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/80 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col xl:flex-row items-center justify-between gap-3">
          
          {/* Brand Logo & Heirloom styling - M3 Small Container shape */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg font-bold font-serif text-slate-800 dark:text-slate-100 flex items-center gap-1.5 justify-center sm:justify-start tracking-tight">
                Kinship Trace
              </h1>
            </div>
          </div>

          {/* Tab Selection - MD3 Segmented Button / Pill Layout */}
          <div className="w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 hide-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
            <nav className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-950/80 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-400 w-max xl:w-auto mx-auto xl:mx-0 transition-all shadow-xs">
              <button
                id="tab-btn-tree"
                onClick={() => setActiveTab('tree')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'tree'
                    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-200/50 dark:ring-indigo-900/30'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <GitFork className="w-4 h-4 rotate-90" />
                <span>Interactive Tree</span>
              </button>
              <button
                id="tab-btn-constellation"
                onClick={() => setActiveTab('constellation')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'constellation'
                    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-200/50 dark:ring-indigo-900/30'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Kinship Constellation</span>
              </button>
              <button
                id="tab-btn-members"
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'members'
                    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-200/50 dark:ring-indigo-900/30'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Member Gallery</span>
              </button>
              <button
                id="tab-btn-timeline"
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-200/50 dark:ring-indigo-900/30'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Timeline</span>
              </button>
              <button
                id="tab-btn-stats"
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'stats'
                    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-200/50 dark:ring-indigo-900/30'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <BarChart className="w-4 h-4" />
                <span>Diagnostics</span>
              </button>
              <button
                id="tab-btn-database"
                onClick={() => setActiveTab('database')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === 'database'
                    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-200/50 dark:ring-indigo-900/30'
                    : 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Backups</span>
              </button>
            </nav>
          </div>

          {/* Header Actions - M3 Styled Layout */}
          <div className="flex items-center gap-2">
            {members.length > 0 && (
              <div className="flex items-center gap-2 mr-1">
                <MemberSearch
                  members={members}
                  currentFocusId={focusMemberId}
                  onSelect={(id) => {
                    setFocusMemberId(id);
                    if (activeTab !== 'tree' && activeTab !== 'constellation') {
                      setActiveTab('tree');
                    }
                  }}
                />
              </div>
            )}
            <ThemeToggle />
            <button
              onClick={() => supabase.auth.signOut()}
              title="Lock Vault"
              className="flex items-center justify-center w-10 h-10 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/85 dark:hover:bg-rose-900/55 border border-rose-100 dark:border-rose-900/50 rounded-2xl transition-all shadow-xs hover:shadow-md cursor-pointer select-none active:scale-95 animate-fade-in"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
            <button
              id="btn-global-add-member"
              title="Add Family Member"
              onClick={() => {
                setEditingMember(null);
                setPrefilledRelations(undefined);
                setPendingParentLink(undefined);
                setShowForm(true);
              }}
              className="flex items-center justify-center w-10 h-10 text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-2xl transition-all shadow-sm hover:shadow-lg cursor-pointer select-none active:scale-95 duration-150"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main body canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
                You currently have no registered family members inside your local database. Start creating your family lineage archives from absolute scratch.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                id="btn-add-initial-member"
                onClick={() => {
                  setEditingMember(null);
                  setPrefilledRelations(undefined);
                  setPendingParentLink(undefined);
                  setShowForm(true);
                }}
                className="w-full px-4 py-2.5 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer shadow-sm transition-colors"
              >
                Create New Member Record from Scratch
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: THE TREE VISUALIZER */}
            {activeTab === 'tree' && currentFocusMember && (
              <div className="space-y-2">
                <FamilyTreeVisualizer
                  focusMember={currentFocusMember}
                  allMembers={members}
                  onFocus={(id) => setFocusMemberId(id)}
                  onEdit={(member) => {
                    setEditingMember(member);
                    setPrefilledRelations(undefined);
                    setPendingParentLink(undefined);
                    setShowForm(true);
                  }}
                  onAddRelation={handleAddRelation}
                />
              </div>
            )}

            {/* TAB 1.5: KINSHIP CONSTELLATION */}
            {activeTab === 'constellation' && (
              <div className="space-y-4">
                <FamilyNetworkGraph
                  members={members}
                  focusedMemberId={focusMemberId}
                  onFocusMember={(id) => {
                    setFocusMemberId(id);
                    setActiveTab('tree');
                  }}
                />
              </div>
            )}

            {/* TAB 2: MEMBER DIRECTORY / GALLERY */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                {/* Search / Filters Interface - MD3 Styled Container */}
                <div className="bg-white/80 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex flex-col xl:flex-row gap-5 items-center justify-between transition-all">
                  <div className="relative w-full xl:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                      id="input-directory-search"
                      type="text"
                      placeholder="Search name, notes, job..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 w-full xl:w-auto">
                    {/* Filter Gender */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gender:</span>
                      <select
                        id="select-filter-gender"
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-full py-1.5 px-3.5 cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden"
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
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-full py-1.5 px-3.5 cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden"
                      >
                        <option value="all">All Records</option>
                        <option value="living">Living Only</option>
                        <option value="deceased">Deceased Only</option>
                      </select>
                    </div>

                    {/* Sorting categories requested */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sort By:</span>
                      <select
                        id="select-sort-directory"
                        value={directorySort}
                        onChange={(e) => setDirectorySort(e.target.value)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-full py-1.5 px-3.5 cursor-pointer transition-colors focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden"
                      >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="created-desc">Date Added (Newest)</option>
                        <option value="created-asc font-semibold">Date Added (Oldest)</option>
                        <option value="edited-desc font-semibold">Latest Edited</option>
                        <option value="dob-asc font-semibold">DOB (Oldest first)</option>
                        <option value="dob-desc font-semibold">DOB (Newest first)</option>
                      </select>
                    </div>

                    {/* Duplicate Finder Button - M3 Outlined Tonal variant */}
                    <button
                      id="btn-show-duplicate-finder"
                      onClick={() => setShowDuplicateFinder(true)}
                      className="text-xs font-bold px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/85 dark:hover:bg-indigo-950/65 text-indigo-700 dark:text-indigo-400 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                    >
                      <span>🔍</span> <span>Find Duplicates</span>
                    </button>

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
                          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-755 transition-all relative overflow-hidden"
                        >
                          <div className="space-y-3">
                            {/* Profile Badge row */}
                            <div className="flex items-start justify-between">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-serif text-sm font-bold shadow-2xs ${member.avatarColor}`}>
                                {member.firstName[0]}{member.lastName?.[0] || ''}
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold capitalize ${
                                  member.gender === 'male' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-350' : member.gender === 'female' ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-350' : 'bg-slate-100 dark:bg-slate-700 text-slate-750 dark:text-slate-350'
                                }`}>
                                  {member.gender}
                                </span>
                                {member.isDeceased ? (
                                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Passed</span>
                                ) : (
                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">Age {age}</span>
                                )}
                              </div>
                            </div>

                            {/* Core info labels */}
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                {member.firstName} {member.lastName || ''}
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
                              {member.bloodGroup && (
                                <p className="text-[11px] font-medium text-rose-700 dark:text-rose-450 flex items-center gap-1">
                                  🩸 {member.bloodGroup}
                                </p>
                              )}
                              {member.email && (
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate" title={member.email}>
                                  ✉️ {member.email}
                                </p>
                              )}
                              {member.phone && (
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  📞 {member.phone}{member.secondaryPhone && ` / ${member.secondaryPhone}`}
                                </p>
                              )}
                              {!member.phone && member.secondaryPhone && (
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  📞 {member.secondaryPhone}
                                </p>
                              )}
                              {parentNames.length > 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  👪 Child of {parentNames.join(' & ')}
                                </p>
                              )}
                              {member.notes && (
                                <p className="text-[10px] italic text-slate-400 dark:text-slate-550 line-clamp-2 mt-1">
                                  "{member.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick tool row - M3 Pill buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            <button
                              id={`dir-edit-btn-${member.id}`}
                              onClick={() => {
                                setEditingMember(member);
                                setPrefilledRelations(undefined);
                                setPendingParentLink(undefined);
                                setShowForm(true);
                              }}
                              className="text-[10px] font-bold text-center hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-1.5 hover:text-slate-700 dark:hover:text-slate-200 text-slate-600 dark:text-slate-450 cursor-pointer transition-all"
                            >
                              Edit Profile
                            </button>
                            <button
                              id={`dir-focus-btn-${member.id}`}
                              onClick={() => {
                                setFocusMemberId(member.id);
                                setActiveTab('tree');
                              }}
                              className="text-[10px] font-bold text-center text-indigo-750 dark:text-indigo-350 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100/30 dark:border-indigo-900/20 rounded-full py-1.5 cursor-pointer transition-all"
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
                      if (isConfigured) {
                        const mapped = importedMembers.map(mapToDb);
                        const { error } = await safeUpsert(mapped, true);
                        if (error) {
                           console.error('Import error', error);
                           throw new Error(`Database error: ${error.message}`);
                        }
                      }
                      
                      // Optimistic local state update after successful DB commit
                      setMembers(prev => {
                        const newMembers = [...prev];
                        for (const member of importedMembers) {
                          const existingIdx = newMembers.findIndex(m => m.id === member.id);
                          if (existingIdx > -1) {
                            newMembers[existingIdx] = member;
                          } else {
                            newMembers.push(member);
                          }
                        }
                        return newMembers;
                      });

                      setFocusMemberId(importedMembers[0].id);
                      setActiveTab('tree');
                    }
                  }}
                  onClearDatabase={async () => {
                    if (members.length > 0) {
                       const ids = members.map(m => m.id);
                       if (isConfigured) {
                         const { error } = await supabase.from('family_members').delete().in('id', ids);
                         if (error) {
                           console.error(`DB_ERROR: ${error.message}`);
                           throw new Error(`Database clear failed: ${error.message}`);
                         }
                       }
                       setMembers([]);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* M3 Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="m3-fab-add-member"
          onClick={() => {
            setEditingMember(null);
            setPrefilledRelations(undefined);
            setPendingParentLink(undefined);
            setShowForm(true);
          }}
          title="Add new family member"
          className="flex items-center gap-2 px-4.5 py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-[20px] transition-all duration-300 shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15)] hover:shadow-[0px_6px_10px_4px_rgba(0,0,0,0.25)] active:scale-95 group cursor-pointer select-none border-none font-bold text-xs tracking-wider uppercase md:normal-case md:text-sm md:font-semibold"
        >
          <Plus className="w-5.5 h-5.5 transition-transform duration-300 group-hover:rotate-90 text-white shrink-0" />
          <span className="hidden sm:inline font-semibold pr-1">Add Family Member</span>
        </button>
      </div>

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
            setPendingParentLink(undefined);
          }}
          prefilledRelations={prefilledRelations}
        />
      )}

      {/* Duplicate finder modal */}
      {showDuplicateFinder && (
        <DuplicateFinder
          members={members}
          onDeleteMember={handleDeleteMember}
          onClose={() => setShowDuplicateFinder(false)}
        />
      )}
    </div>
    </AuthGuard>
  );
}
