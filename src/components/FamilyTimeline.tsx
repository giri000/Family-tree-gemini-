import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { Calendar, Search, MapPin, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

interface FamilyTimelineProps {
  members: FamilyMember[];
  onFocusMember: (id: string) => void;
}

interface TimelineEvent {
  year: number;
  dateStr?: string;
  type: 'birth' | 'passing';
  member: FamilyMember;
  ageAtEvent?: number;
  details: string;
}

export function FamilyTimeline({ members, onFocusMember }: FamilyTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Compute all life events beautifully
  const events: TimelineEvent[] = [];

  const getAgeAtDeath = (birthDateStr?: string, deathDateStr?: string) => {
    if (!birthDateStr || !deathDateStr) return undefined;
    const birth = new Date(birthDateStr);
    const death = new Date(deathDateStr);
    let age = death.getFullYear() - birth.getFullYear();
    const m = death.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  members.forEach((member) => {
    // 1. Birth Event
    if (member.birthDate) {
      const birthYear = new Date(member.birthDate).getFullYear();
      events.push({
        year: birthYear,
        dateStr: member.birthDate,
        type: 'birth',
        member,
        details: member.birthPlace
          ? `Born in ${member.birthPlace}`
          : 'Birth recorded',
      });
    }

    // 2. Passing Event
    if (member.isDeceased && member.deathDate) {
      const deathYear = new Date(member.deathDate).getFullYear();
      const ageAtDeath = getAgeAtDeath(member.birthDate, member.deathDate);
      events.push({
        year: deathYear,
        dateStr: member.deathDate,
        type: 'passing',
        member,
        ageAtEvent: ageAtDeath,
        details: member.deathPlace
          ? `Passed away in ${member.deathPlace}${ageAtDeath ? ` (Age ${ageAtDeath})` : ''}`
          : `Passed away${ageAtDeath ? ` (Age ${ageAtDeath})` : ''}`,
      });
    }
  });

  // Filter events
  const filteredEvents = events.filter((e) => {
    const fullName = `${e.member.firstName} ${e.member.lastName || ''}`.toLowerCase();
    const searchMatch = fullName.includes(searchQuery.toLowerCase()) || 
                        e.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.year.toString().includes(searchQuery);
    return searchMatch;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.year - b.year || (a.dateStr || '').localeCompare(b.dateStr || '');
    } else {
      return b.year - a.year || (b.dateStr || '').localeCompare(a.dateStr || '');
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Filters bar - MD3 Segmented / Capsule track */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-5 bg-white/80 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            id="input-timeline-search"
            type="text"
            placeholder="Search timeline by name or year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-750/80 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-xs"
          />
        </div>

        {/* Sort Controls - MD3 Segmented Button Component */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Sort Events:</span>
          <div className="flex bg-slate-100/80 dark:bg-slate-950 p-1 rounded-full border border-slate-200/50 dark:border-slate-800">
            <button
              id="btn-sort-desc"
              onClick={() => setSortOrder('desc')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                sortOrder === 'desc'
                  ? 'bg-white dark:bg-slate-800 shadow-xs text-indigo-700 dark:text-indigo-400 border border-slate-200/10 dark:border-slate-700/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Recent First
            </button>
            <button
              id="btn-sort-asc"
              onClick={() => setSortOrder('asc')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                sortOrder === 'asc'
                  ? 'bg-white dark:bg-slate-800 shadow-xs text-indigo-700 dark:text-indigo-400 border border-slate-200/10 dark:border-slate-700/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Oldest First
            </button>
          </div>
        </div>
      </div>

      {/* Main Timeline Stream */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No chronological timeline achievements found.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try modifying your text search query or adding birth dates to your family member profiles.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 md:ml-32 py-4 space-y-8">
          {sortedEvents.map((event, idx) => {
            const isBirth = event.type === 'birth';
            
            return (
              <div key={`${event.member.id}-${event.type}-${event.year}-${idx}`} className="relative pl-6 md:pl-8 group">
                
                {/* Year tag for large screens */}
                <div className="absolute -left-6 md:-left-32 top-0.5 md:w-24 text-right hidden md:block">
                  <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    {event.year}
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {event.dateStr ? new Date(event.dateStr).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}
                  </p>
                </div>

                {/* Vertical line indicator circle */}
                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-125 ${
                  isBirth 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' 
                    : 'border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isBirth ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-600 dark:bg-slate-400'}`} />
                </div>

                {/* Event Card - MD3 Rounded container */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 hover:border-slate-350 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {/* Tiny year node for small/mobile devices */}
                    <div className="flex items-center gap-1.5 md:hidden">
                      <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {event.year}
                      </span>
                      {event.dateStr && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono">
                          {new Date(event.dateStr).toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${event.member.avatarColor}`} />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-650 dark:hover:text-indigo-400 cursor-pointer flex items-center gap-1 select-none" onClick={() => onFocusMember(event.member.id)}>
                        {event.member.firstName} {event.member.lastName || ''}
                        <ArrowUpRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      </h4>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        isBirth ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {isBirth ? 'Birth Milestone' : 'In Memoriam'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      {isBirth ? (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 inline shrink-0" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-slate-400 inline shrink-0" />
                      )}
                      {event.details}
                    </p>

                    {event.member.notes && (
                      <p className="text-xs text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3 mt-1.5 italic">
                        "{event.member.notes}"
                      </p>
                    )}
                  </div>

                  <button
                    id={`btn-visit-timeline-${event.member.id}`}
                    onClick={() => onFocusMember(event.member.id)}
                    className="text-[11px] font-bold text-indigo-750 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 border border-indigo-100/30 dark:border-indigo-900/20 rounded-full px-4.5 py-2 self-start md:self-auto cursor-pointer transition-all active:scale-95 shadow-xs shrink-0 select-none"
                  >
                    View in Tree
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
