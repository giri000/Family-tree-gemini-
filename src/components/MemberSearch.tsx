import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { FamilyMember } from '../types';

interface MemberSearchProps {
  members: FamilyMember[];
  onSelect: (id: string) => void;
  currentFocusId: string;
}

export function MemberSearch({ members, onSelect, currentFocusId }: MemberSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMembers = query === '' 
    ? members.slice().sort((a, b) => a.firstName.localeCompare(b.firstName))
    : members
        .filter((member) => {
          const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
          return fullName.includes(query.toLowerCase());
        })
        .sort((a, b) => a.firstName.localeCompare(b.firstName));

  const currentMember = members.find(m => m.id === currentFocusId);
  const displayValue = isOpen ? query : (currentMember ? `${currentMember.firstName} ${currentMember.lastName}` : '');

  return (
    <div className="relative w-48 sm:w-64" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
          placeholder="Search member..."
          value={displayValue}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 overflow-hidden">
          {filteredMembers.length > 0 ? (
            <div className="p-1">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onSelect(member.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                    member.id === currentFocusId 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium'
                  }`}
                >
                  <span className="truncate">{member.firstName} {member.lastName}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-xs text-center text-slate-500 dark:text-slate-400">
              No members found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
