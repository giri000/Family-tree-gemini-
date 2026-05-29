import React from 'react';
import { FamilyMember } from '../types';
import { Users, Heart, Award, Gift, Calendar, Sparkles, UserCheck, BarChart } from 'lucide-react';

interface StatsDashboardProps {
  members: FamilyMember[];
  onFocusMember: (id: string) => void;
}

export function StatsDashboard({ members, onFocusMember }: StatsDashboardProps) {
  const totalCount = members.length;
  
  const livingCount = members.filter((m) => !m.isDeceased).length;
  const deceasedCount = totalCount - livingCount;

  const maleCount = members.filter((m) => m.gender === 'male').length;
  const femaleCount = members.filter((m) => m.gender === 'female').length;
  const otherCount = totalCount - maleCount - femaleCount;

  // Calculate average lifespan for deceased members
  const deceasedWithAges = members.filter((m) => m.isDeceased && m.birthDate && m.deathDate);
  const getAgeAtDeath = (birthDateStr?: string, deathDateStr?: string) => {
    if (!birthDateStr || !deathDateStr) return 0;
    const b = new Date(birthDateStr);
    const d = new Date(deathDateStr);
    return d.getFullYear() - b.getFullYear();
  };
  
  const averageLifespanDeceased = deceasedWithAges.length > 0
    ? Math.round(
        deceasedWithAges.reduce((acc, current) => acc + getAgeAtDeath(current.birthDate, current.deathDate), 0) /
          deceasedWithAges.length
      )
    : 0;

  // Calculate average age of living members
  const livingWithAges = members.filter((m) => !m.isDeceased && m.birthDate);
  const getAgeOfLiving = (birthDateStr?: string) => {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    const today = new Date();
    return today.getFullYear() - birth.getFullYear();
  };

  const averageAgeLiving = livingWithAges.length > 0
    ? Math.round(
        livingWithAges.reduce((acc, current) => acc + getAgeOfLiving(current.birthDate), 0) /
          livingWithAges.length
      )
    : 0;

  // Find oldest living member
  const oldestLiving = livingWithAges.reduce<FamilyMember | null>((oldest, current) => {
    if (!oldest) return current;
    const oldestAge = getAgeOfLiving(oldest.birthDate);
    const currentAge = getAgeOfLiving(current.birthDate);
    return currentAge > oldestAge ? current : oldest;
  }, null);

  // Find upcoming birthdays
  const getDaysUntilBirthday = (birthDateStr?: string) => {
    if (!birthDateStr) return 999;
    const today = new Date();
    const birth = new Date(birthDateStr);
    
    // Set birthday to this year
    const birthdayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    // If birthday passed already this year, look at next year
    if (birthdayThisYear.getTime() < today.getTime()) {
      birthdayThisYear.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = birthdayThisYear.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const upcomingBirthdays = members
    .filter((m) => !m.isDeceased && m.birthDate)
    .map((m) => {
      const days = getDaysUntilBirthday(m.birthDate);
      const bdate = new Date(m.birthDate!);
      return {
        member: m,
        days,
        originalDate: m.birthDate!,
        nextAge: getAgeOfLiving(m.birthDate) + (days > 0 && days < 365 ? 1 : 0),
        monthDay: bdate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 4); // Top 4 upcoming birthdays

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Grid count cards - M3 Elevated Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Generation Counter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Kinship</span>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{totalCount} members</h3>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Synchronized with Supabase DB</p>
          </div>
        </div>

        {/* Card 2: Living/Deceased */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Survival Ratio</span>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{livingCount} active</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{deceasedCount} departed ancestors</p>
          </div>
        </div>

        {/* Card 3: Avg Lifespan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100/50 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Deceased Longevity</span>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{averageLifespanDeceased || '?'} yrs</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Average mortality age</p>
          </div>
        </div>

        {/* Card 4: Avg Living Age */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center gap-4 transition-all">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100/50 dark:border-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-2xl">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Living Proximity</span>
            <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{averageAgeLiving || '?'} yrs</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Average age of active kin</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Gender Distribution Chart using pure Tailwind elements - M3 Standard Rounded-3xl Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-5 lg:col-span-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif border-b dark:border-slate-800 pb-2">Gender Demographics</h4>
          
          <div className="space-y-4">
            {/* Male */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-blue-700 dark:text-blue-400 font-semibold">Male ({maleCount})</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">{totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (maleCount / totalCount) * 105 : 0}%` }}
                />
              </div>
            </div>

            {/* Female */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-pink-700 dark:text-pink-400 font-semibold">Female ({femaleCount})</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">{totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-pink-500 dark:bg-pink-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (femaleCount / totalCount) * 105 : 0}%` }}
                />
              </div>
            </div>

            {/* Other */}
            {otherCount > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Other ({otherCount})</span>
                  <span className="font-mono text-slate-400 dark:text-slate-500">{Math.round((otherCount / totalCount) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-slate-400 dark:bg-slate-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(otherCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Living vs Mortality Bar distribution */}
          <div className="border-t dark:border-slate-800 pt-4 space-y-2 mt-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lineage Preservation</h5>
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div
                className="bg-emerald-500 dark:bg-emerald-400 h-3"
                title={`${livingCount} living`}
                style={{ width: `${totalCount > 0 ? (livingCount / totalCount) * 100 : 0}%` }}
              />
              <div
                className="bg-slate-400 dark:bg-slate-500 h-3"
                title={`${deceasedCount} deceased`}
                style={{ width: `${totalCount > 0 ? (deceasedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="text-emerald-700 dark:text-emerald-400">● Living: {livingCount}</span>
              <span className="text-slate-600 dark:text-slate-400">● Deceased: {deceasedCount}</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col lg:col-span-1">
          <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2 mb-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif">Upcoming Birthdays</h4>
            <Gift className="w-4 h-4 text-rose-400" />
          </div>

          {upcomingBirthdays.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-10">
              <Calendar className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No birthdays mapped.</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500">Edit member dates to construct calendar.</p>
            </div>
          ) : (
            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-72">
              {upcomingBirthdays.map(({ member, days, monthDay, nextAge }) => (
                <div
                  key={member.id}
                  id={`bd-item-${member.id}`}
                  onClick={() => onFocusMember(member.id)}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-indigo-150 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-2xl cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-bold shrink-0 ${member.avatarUrl ? 'bg-slate-200 dark:bg-slate-800' : member.avatarColor}`}>
                      {member.avatarUrl ? (
                         <img src={member.avatarUrl} alt={member.firstName} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      ) : (
                         member.firstName[0]
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-650 dark:hover:text-indigo-400 truncate max-w-[130px]">
                        {member.firstName} {member.lastName || ''}
                      </p>
                      <p className="text-[10px] text-indigo-650 dark:text-indigo-400 font-mono font-medium">
                        Turning {nextAge} on {monthDay}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {days === 0 ? (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                        Today! 🎉
                      </span>
                    ) : days === 1 ? (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-2.5 py-0.5 rounded-full">
                        Tomorrow
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-650 dark:text-slate-300 bg-slate-105 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-mono border border-slate-200/50 dark:border-slate-700/55">
                        In {days}d
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Oldest Living Member Award Card - M3 Elevated Standard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between lg:col-span-1">
          <div className="border-b dark:border-slate-800 pb-2 mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif">Matriarch / Patriarch</h4>
            <Award className="w-4 h-4 text-yellow-500" />
          </div>

          {oldestLiving ? (
            <div className="p-4 bg-yellow-50/30 dark:bg-yellow-950/20 border border-yellow-105 dark:border-yellow-900/30 rounded-2xl flex-1 flex flex-col justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold border-2 border-white dark:border-slate-800 bg-yellow-500 text-white shadow-xs">
                {oldestLiving.firstName[0]}{oldestLiving.lastName?.[0] || ''}
              </div>
              
              <div>
                <h5 className="text-sm font-serif font-bold text-slate-800 dark:text-slate-100">
                  {oldestLiving.firstName} {oldestLiving.lastName || ''}
                </h5>
                <p className="text-[10px] font-mono text-yellow-800 dark:text-yellow-600 font-bold uppercase tracking-wider mt-0.5">
                  Age {getAgeOfLiving(oldestLiving.birthDate)} — Matriarch/Patriarch
                </p>
              </div>

              {oldestLiving.notes ? (
                <p className="text-xs italic text-slate-600 dark:text-slate-400 line-clamp-3">
                  "{oldestLiving.notes}"
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  Living witness of the family legacy.
                </p>
              )}

              <button
                id={`btn-visit-oldest-${oldestLiving.id}`}
                onClick={() => onFocusMember(oldestLiving.id)}
                className="text-[11px] font-bold text-yellow-850 dark:text-yellow-500 hover:text-white bg-white dark:bg-slate-800 hover:bg-yellow-650 dark:hover:bg-yellow-650 border border-yellow-200 dark:border-yellow-750 hover:border-yellow-605 rounded-full py-1.5 px-4 self-center transition-all cursor-pointer shadow-xs active:scale-95 select-none"
              >
                Center Tree Focus
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1">Heritage records empty.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
