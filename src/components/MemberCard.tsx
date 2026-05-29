import React from 'react';
import { FamilyMember } from '../types';
import { Heart, User, Sparkles, Pencil, Search, Baby, Mail, MessageSquare, Bot } from 'lucide-react';

interface MemberCardProps {
  member: FamilyMember;
  onFocus: (id: string) => void;
  onEdit: (member: FamilyMember) => void;
  isFocused?: boolean;
  relationshipLabel?: string;
}

export function MemberCard({
  member,
  onFocus,
  onEdit,
  isFocused = false,
  relationshipLabel,
}: MemberCardProps) {
  // Compute initials
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

  // Compute birth/death text
  const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : '?';
  const deathYear = member.isDeceased
    ? member.deathDate
      ? new Date(member.deathDate).getFullYear()
      : 'Deceased'
    : 'Present';

  const lifespanText = member.birthDate || member.isDeceased
    ? `(${birthYear} – ${deathYear})`
    : '';

  // Compute current age if alive
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = !member.isDeceased ? calculateAge(member.birthDate) : null;

  // Gender indicator color borders
  const genderBorder =
    member.gender === 'male'
      ? 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
      : member.gender === 'female'
      ? 'border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 bg-pink-50/50 dark:bg-pink-950/20'
      : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/50 dark:bg-slate-800/30';

  const focusClass = isFocused
    ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-300 shadow-lg'
    : 'shadow-sm hover:shadow-md';

  return (
    <div
      id={`member-card-${member.id}`}
      className={`group relative w-48 rounded-xl border p-3 flex flex-col items-center text-center transition-all duration-300 cursor-pointer ${genderBorder} ${focusClass}`}
      onClick={() => onFocus(member.id)}
    >
      {/* Target/Focus Banner inside card */}
      {relationshipLabel && (
        <span className="absolute -top-2 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xs text-slate-500 dark:text-slate-400">
          {relationshipLabel}
        </span>
      )}

      {/* Avatar */}
      <div className={`mt-1.5 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-serif text-lg font-bold shadow-xs ${member.avatarUrl ? 'bg-slate-200 dark:bg-slate-800' : (member.avatarColor || 'bg-slate-500 text-white')}`}>
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={`${member.firstName} ${member.lastName || ''}`.trim()} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        ) : (
          initials || <User className="w-5 h-5" />
        )}
      </div>

      {/* Name */}
      <h4 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
        {member.firstName} {member.lastName || ''}
      </h4>

      {/* Lifespan Years */}
      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
        {lifespanText}
      </p>

      {/* Age or Deceased Badge */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
        {member.isDeceased ? (
          <span className="text-[9px] px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 font-medium">
            Deceased
          </span>
        ) : age !== null ? (
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
            Age {age}
          </span>
        ) : null}

        {member.occupation && member.occupation !== 'Toddler' && member.occupation !== 'Infant' && (
          <span className="text-[9px] font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded max-w-[80px] truncate">
            {member.occupation}
          </span>
        )}
        {member.bloodGroup && (
          <span className="text-[9px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded max-w-[80px] truncate">
            🩸 {member.bloodGroup}
          </span>
        )}
      </div>
      
      {/* Contact & AI Status Indicators */}
      <div className="mt-1.5 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
        {(member.email || member.phone || member.secondaryPhone) && (
          <span title="Contact Info Available" className="p-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
            <MessageSquare className="w-3 h-3" />
          </span>
        )}
        {member.aiContext && (
          <span title="AI Context Provided" className="p-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400">
            <Bot className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Quick Toolbar overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        <button
          id={`btn-edit-${member.id}`}
          title="Edit member details"
          className="p-1 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 shadow-xs cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(member);
          }}
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
