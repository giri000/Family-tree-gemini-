import React, { useState, useMemo } from 'react';
import { FamilyMember } from '../types';
import { 
  Users, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock,
  Briefcase
} from 'lucide-react';

interface DuplicateFinderProps {
  members: FamilyMember[];
  onDeleteMember: (id: string) => Promise<void> | void;
  onClose: () => void;
}

type DuplicateCriteria = 'name' | 'name-dob' | 'name-birthplace';

export function DuplicateFinder({ members, onDeleteMember, onClose }: DuplicateFinderProps) {
  const [criteria, setCriteria] = useState<DuplicateCriteria>('name');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Group members into lists of duplicates
  const duplicateGroups = useMemo(() => {
    const groups: { [key: string]: FamilyMember[] } = {};

    members.forEach(member => {
      const first = (member.firstName || '').trim().toLowerCase();
      const last = (member.lastName || '').trim().toLowerCase();
      const nameKey = `${first}|${last}`;

      let key = '';
      if (criteria === 'name') {
        key = nameKey;
      } else if (criteria === 'name-dob') {
        const dob = member.birthDate ? member.birthDate.trim() : 'no-dob';
        key = `${nameKey}|${dob}`;
      } else if (criteria === 'name-birthplace') {
        const place = member.birthPlace ? member.birthPlace.trim().toLowerCase() : 'no-place';
        key = `${nameKey}|${place}`;
      }

      // If key is empty or has placeholder values that don't make sense as duplicates, skip
      if (criteria === 'name-dob' && key.endsWith('|no-dob')) {
        // Only trigger duplicate matches on name if DOB exists, otherwise they fall under name group
        return;
      }
      if (criteria === 'name-birthplace' && key.endsWith('|no-place')) {
        return;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(member);
    });

    // Filter groups to only return those with 2 or more members (meaning duplicates actually exist)
    return Object.entries(groups)
      .filter(([_, list]) => list.length > 1)
      .map(([key, list]) => {
        // Extract a clean representative label
        const firstMember = list[0];
        const label = `${firstMember.firstName} ${firstMember.lastName || ''}`.trim();
        return {
          key,
          label,
          membersList: list
        };
      });
  }, [members, criteria]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete this duplicate record for "${name}"? This will prune this profile and unlink it from any family nodes.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await onDeleteMember(id);
      setSuccessMessage(`Redundant profile for "${name}" successfully deleted.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Delete error: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const totalDuplicatesCount = useMemo(() => {
    return duplicateGroups.reduce((acc, current) => acc + (current.membersList.length - 1), 0);
  }, [duplicateGroups]);

  return (
    <div id="duplicate-finder-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col transition-colors animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100">Lineage Duplicate Finder</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scan and resolve records containing duplicate name, birthdates, or details.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Counters Bar */}
        <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">Match Criteria:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border dark:border-slate-700/50">
              <button
                onClick={() => setCriteria('name')}
                className={`px-3 py-1 rounded-md font-semibold font-sans cursor-pointer transition-all ${
                  criteria === 'name' 
                    ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-700 dark:text-indigo-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-250'
                }`}
              >
                Same Name
              </button>
              <button
                onClick={() => setCriteria('name-dob')}
                className={`px-3 py-1 rounded-md font-semibold font-sans cursor-pointer transition-all ${
                  criteria === 'name-dob' 
                    ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-700 dark:text-indigo-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-250'
                }`}
              >
                Same Name & DOB
              </button>
              <button
                onClick={() => setCriteria('name-birthplace')}
                className={`px-3 py-1 rounded-md font-semibold font-sans cursor-pointer transition-all ${
                  criteria === 'name-birthplace' 
                    ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-700 dark:text-indigo-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-250'
                }`}
              >
                Same Name & Birthplace
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span id="duplicates-tag" className="font-semibold px-2.5 py-1 text-[11px] rounded-full bg-amber-50 dark:bg-amber-950/35 text-amber-700 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30">
              Found {duplicateGroups.length} duplicate groups ({totalDuplicatesCount} redundant)
            </span>
          </div>
        </div>

        {/* Scrollable Core List Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 rounded-xl px-4 py-3 text-emerald-800 dark:text-emerald-400 flex items-center gap-2.5 text-xs font-semibold animate-fade-in mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {duplicateGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-slate-800 dark:text-slate-100">Clean Lineage Database!</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">No duplicate records were detected under your current mapping criteria.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {duplicateGroups.map((group) => (
                <div key={group.key} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500/25">
                  
                  {/* Group Title Head */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/50 px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-350 flex items-center gap-1.5 font-mono">
                      📂 GROUP: <span className="text-slate-900 dark:text-white font-sans font-extrabold text-sm">{group.label}</span>
                    </h4>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200/20">
                      {group.membersList.length} redundant copies
                    </span>
                  </div>

                  {/* Duplicate profiles side-by-side grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800">
                    {group.membersList.map((member) => (
                      <div key={member.id} className="bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4">
                        
                        {/* Member card profile details */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-serif shadow-2xs ${member.avatarColor}`}>
                                {member.firstName[0]}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{member.firstName} {member.lastName}</p>
                                <p className="text-[9px] font-mono text-slate-400">ID: {member.id.substring(0, 8)}...</p>
                              </div>
                            </div>
                            
                            <span className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-800/60 border dark:border-slate-800 px-2 py-0.5 rounded uppercase font-semibold">
                              {member.gender}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>DOB: {member.birthDate || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Birthplace: {member.birthPlace || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Job: {member.occupation || 'None'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate" title={member.createdAt || ''}>
                                Created: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {member.notes && (
                            <p className="text-[10px] italic text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/20 p-2 rounded-lg leading-relaxed line-clamp-2">
                              "{member.notes}"
                            </p>
                          )}
                        </div>

                        {/* Direct Delete control */}
                        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 font-semibold italic">
                            {member.isDeceased ? '💀 Passed record' : '💚 Living record'}
                          </span>
                          
                          <button
                            id={`dupe-delete-btn-${member.id}`}
                            onClick={() => handleDelete(member.id, `${member.firstName} ${member.lastName || ''}`.trim())}
                            disabled={deletingId === member.id}
                            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/45 text-rose-600 dark:text-rose-400 py-1.5 px-3 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{deletingId === member.id ? 'Deleting...' : 'Delete Redundant Profile'}</span>
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/85 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
          >
            Finished Review
          </button>
        </div>

      </div>
    </div>
  );
}
