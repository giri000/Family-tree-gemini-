import React from 'react';
import { FamilyMember } from '../types';
import { MemberCard } from './MemberCard';
import { Heart, Plus, Users, ArrowUpRight, Award, HelpCircle } from 'lucide-react';

interface FamilyTreeVisualizerProps {
  focusMember: FamilyMember;
  allMembers: FamilyMember[];
  onFocus: (id: string) => void;
  onEdit: (member: FamilyMember) => void;
  onAddRelation: (relationType: 'father' | 'mother' | 'spouse' | 'child', relativeToId: string) => void;
}

export function FamilyTreeVisualizer({
  focusMember,
  allMembers,
  onFocus,
  onEdit,
  onAddRelation,
}: FamilyTreeVisualizerProps) {
  
  // Helper to locate any member by ID safely
  const findMember = (id?: string) => allMembers.find((m) => m.id === id);

  // Core connections around the Focus Member
  const spouse = focusMember.spouseId ? findMember(focusMember.spouseId) : null;
  const father = focusMember.fatherId ? findMember(focusMember.fatherId) : null;
  const mother = focusMember.motherId ? findMember(focusMember.motherId) : null;

  // Let's check for grand-parents
  const paternalGrandfather = father?.fatherId ? findMember(father.fatherId) : null;
  const paternalGrandmother = father?.motherId ? findMember(father.motherId) : null;
  const maternalGrandfather = mother?.fatherId ? findMember(mother.fatherId) : null;
  const maternalGrandmother = mother?.motherId ? findMember(mother.motherId) : null;

  // Derived Siblings (share same father OR mother as focus member, excluding focus member)
  const siblings = allMembers.filter((m) => {
    if (m.id === focusMember.id) return false;
    const shareFather = focusMember.fatherId && m.fatherId === focusMember.fatherId;
    const shareMother = focusMember.motherId && m.motherId === focusMember.motherId;
    return shareFather || shareMother;
  });

  // Derived Children (has focusMember OR spouse as father/mother)
  const children = allMembers.filter((m) => {
    const isChildOfFocus = m.fatherId === focusMember.id || m.motherId === focusMember.id;
    const isChildOfSpouse = spouse && (m.fatherId === spouse.id || m.motherId === spouse.id);
    return isChildOfFocus || isChildOfSpouse;
  });

  // Simple Breadcrumb tracker or Quick Jumper to any member
  return (
    <div className="space-y-8 pb-8 overflow-x-auto overflow-y-hidden w-full relative">

      {/* Primary Tree Canvas Grid */}
      <div className="flex flex-col items-center justify-center space-y-8 mx-auto px-2 min-w-max">
        
        {/* ================= TIER 1: GRANDPARENTS ================= */}
        <div className="flex gap-16 w-full justify-center">
          {/* Paternal Grandparents Group */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Paternal Ancestors</span>
            <div className="relative flex gap-4 p-3 bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl transition-colors">
              {paternalGrandfather ? (
                <MemberCard
                  member={paternalGrandfather}
                  onFocus={onFocus}
                  onEdit={onEdit}
                  relationshipLabel="Pat. Grandfather"
                />
              ) : (
                <button
                  id="btn-add-pat-gfather"
                  onClick={() => father && onAddRelation('father', father.id)}
                  disabled={!father}
                  className={`w-48 h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all ${!father ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-semibold">Add Grandfather</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-600">Paternal</span>
                </button>
              )}

              {/* Connecting branch symbol */}
              <div className="w-2 self-center text-slate-300 font-mono text-xs">＆</div>

              {paternalGrandmother ? (
                <MemberCard
                  member={paternalGrandmother}
                  onFocus={onFocus}
                  onEdit={onEdit}
                  relationshipLabel="Pat. Grandmother"
                />
              ) : (
                <button
                  id="btn-add-pat-gmother"
                  onClick={() => father && onAddRelation('mother', father.id)}
                  disabled={!father}
                  className={`w-48 h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all ${!father ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-semibold">Add Grandmother</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-600">Paternal</span>
                </button>
              )}
            </div>
          </div>

          {/* Maternal Grandparents Group */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Maternal Ancestors</span>
            <div className="relative flex gap-4 p-3 bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl transition-colors">
              {maternalGrandfather ? (
                <MemberCard
                  member={maternalGrandfather}
                  onFocus={onFocus}
                  onEdit={onEdit}
                  relationshipLabel="Mat. Grandfather"
                />
              ) : (
                <button
                  id="btn-add-mat-gfather"
                  onClick={() => mother && onAddRelation('father', mother.id)}
                  disabled={!mother}
                  className={`w-48 h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all ${!mother ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-semibold">Add Grandfather</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-600">Maternal</span>
                </button>
              )}

              {/* Connecting branch symbol */}
              <div className="w-2 self-center text-slate-300 font-mono text-xs">＆</div>

              {maternalGrandmother ? (
                <MemberCard
                  member={maternalGrandmother}
                  onFocus={onFocus}
                  onEdit={onEdit}
                  relationshipLabel="Mat. Grandmother"
                />
              ) : (
                <button
                  id="btn-add-mat-gmother"
                  onClick={() => mother && onAddRelation('mother', mother.id)}
                  disabled={!mother}
                  className={`w-48 h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all ${!mother ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-semibold">Add Grandmother</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-600">Maternal</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stem 1: Downward connection line from Grandparents box center toward parents */}
        <div className="relative w-full h-2 flex justify-center gap-[23rem] select-none pointer-events-none">
          <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 -mt-2"></div>
          <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 -mt-2"></div>
        </div>

        {/* ================= TIER 2: PARENTS ================= */}
        <div className="relative flex gap-24 items-center justify-center">
          {/* Father Node Container */}
          <div className="relative flex flex-col items-center">
            {father ? (
              <MemberCard
                member={father}
                onFocus={onFocus}
                onEdit={onEdit}
                relationshipLabel="Father"
              />
            ) : (
              <button
                id="btn-add-father"
                onClick={() => onAddRelation('father', focusMember.id)}
                className="w-48 h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xs flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-6 h-6 mb-1 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-semibold">Add Father</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">For {focusMember.firstName}</span>
              </button>
            )}
          </div>

          {/* Connector union horizontal bar strictly between Parents */}
          <div className="absolute left-[192px] right-[192px] h-0.5 bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
            <span className="bg-white dark:bg-slate-900 px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-mono text-[9px] rounded-full font-bold">
              UNION
            </span>
          </div>

          {/* Mother Node Container */}
          <div className="relative flex flex-col items-center">
            {mother ? (
              <MemberCard
                member={mother}
                onFocus={onFocus}
                onEdit={onEdit}
                relationshipLabel="Mother"
              />
            ) : (
              <button
                id="btn-add-mother"
                onClick={() => onAddRelation('mother', focusMember.id)}
                className="w-48 h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xs flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-6 h-6 mb-1 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-semibold">Add Mother</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">For {focusMember.firstName}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stem 2: Vertical connector drop line down from parent connection meeting Gen 3 */}
        <div className="h-6 w-0.5 bg-slate-300 dark:bg-slate-700"></div>

        {/* ================= TIER 3: FOCUS INDIVIDUAL + PARTNER + SIBLINGS ================= */}
        <div className="flex items-start justify-center gap-12 w-full min-w-max">
          
          {/* Left panel: Sibling lists block */}
          <div className="w-56 shrink-0 flex flex-col pt-4">
            <div className="flex items-center gap-1.5 border-b dark:border-slate-700 pb-1.5 mb-3 text-slate-500 dark:text-slate-400 transition-colors">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Siblings ({siblings.length})</span>
            </div>
            
            {siblings.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 italic transition-colors">
                No recorded siblings. Add siblings by defining same parents in the editor.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {siblings.map((sib) => (
                  <div
                    key={sib.id}
                    id={`sibling-chip-${sib.id}`}
                    onClick={() => onFocus(sib.id)}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg cursor-pointer transition-all shadow-xs"
                  >
                    <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold shrink-0 ${sib.avatarUrl ? 'bg-slate-200 dark:bg-slate-800' : sib.avatarColor}`}>
                      {sib.avatarUrl ? (
                        <img src={sib.avatarUrl} alt={sib.firstName} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      ) : (
                        sib.firstName[0]
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                        {sib.firstName} {sib.lastName}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                        {sib.birthDate ? new Date(sib.birthDate).getFullYear() : '?'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Central: Focus & Spouse Couple Unit */}
          <div className="relative flex flex-col items-center flex-1">
              <span className="text-[10px] font-bold tracking-widest text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-3 py-1 rounded-full uppercase mb-4 transition-colors">
              FOCUS PERSON
            </span>
            
            <div className="relative flex gap-20 items-center justify-center">
              {/* Focus Person */}
              <div className="relative">
                <MemberCard
                  member={focusMember}
                  onFocus={onFocus}
                  onEdit={onEdit}
                  isFocused={true}
                />
              </div>

              {/* Heart Marriage badge line connector */}
              <div className="absolute left-[192px] right-[192px] h-0.5 bg-rose-300 flex items-center justify-center select-none pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shadow-xs">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                </div>
              </div>

              {/* Spouse Card */}
              {spouse ? (
                <div className="relative">
                  <MemberCard
                    member={spouse}
                    onFocus={onFocus}
                    onEdit={onEdit}
                    relationshipLabel="Spouse / Partner"
                  />
                </div>
              ) : (
                <button
                  id="btn-add-spouse"
                  onClick={() => onAddRelation('spouse', focusMember.id)}
                  className="w-48 h-28 rounded-xl border border-dashed border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-6 h-6 mb-1 text-rose-400 dark:text-rose-500" />
                  <span className="text-xs font-semibold text-rose-700/80 dark:text-rose-400">Add Partner</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">Spouse linkage</span>
                </button>
              )}
            </div>
          </div>

          {/* Right panel: Space balancing spacer, or visual legend badge */}
          <div className="w-56 shrink-0 flex flex-col pt-4 font-sans border-l pl-4 border-slate-100 dark:border-slate-800 hidden md:flex transition-colors">
            <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2">Heritage Ledger</span>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Biographer Mode:</strong> Every action you log gets updated inside the local backup immediately.
              </p>
              <div className="flex gap-1.5 items-center">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0"></span>
                <span>Male Descendants</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <span className="w-3.5 h-3.5 rounded-full bg-pink-500 shrink-0"></span>
                <span>Female Descendants</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <span className="w-3.5 h-3.5 rounded bg-slate-400 shrink-0"></span>
                <span>Deceased Kin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stem 3: Line dropping down from union toward children */}
        <div className="h-6 w-0.5 bg-slate-300 dark:bg-slate-700"></div>

        {/* ================= TIER 4: CHILDREN ================= */}
        <div className="flex flex-col items-center w-full min-w-max">
          <div className="flex items-center gap-1.5 border-b dark:border-slate-700 pb-1 mb-6 text-slate-500 dark:text-slate-400 w-full justify-center transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Successors & Children ({children.length})</span>
          </div>

          <div className="flex flex-wrap gap-8 justify-center items-center w-full">
            {children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Horizontal stem connecting line element */}
                <div className="absolute top-0 -mt-6 w-0.5 h-6 bg-slate-200 dark:bg-slate-700"></div>
                <MemberCard
                  member={child}
                  onFocus={onFocus}
                  onEdit={onEdit}
                  relationshipLabel="Child"
                />
              </div>
            ))}

            {/* Quick Button to Add a child to focus user & spouse */}
            <button
              id="btn-add-descendant"
              onClick={() => onAddRelation('child', focusMember.id)}
              className="w-48 h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <Plus className="w-7 h-7 mb-1 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-semibold">Add Child</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">Descendant of {focusMember.firstName}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
