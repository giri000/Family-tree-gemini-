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

  const age = !member.isDeceased ? calculateAge(member.birthDate) : null;  // Gender indicator roles mapping directly to M3 Tonal Palette colors
  const genderBorder =
    member.gender === 'male'
      ? 'border-blue-200/60 dark:border-blue-900/40 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100'
      : member.gender === 'female'
      ? 'border-pink-200/60 dark:border-pink-900/40 hover:border-pink-400 dark:hover:border-pink-600 bg-pink-50/40 dark:bg-pink-950/20 text-pink-900 dark:text-pink-100'
      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100';

  const focusClass = isFocused
    ? 'ring-[3px] ring-indigo-500/80 ring-offset-2 dark:ring-offset-slate-950 border-indigo-400 dark:border-indigo-500 scale-[1.02] shadow-md z-10'
    : 'shadow-xs hover:shadow-md hover:scale-[1.02] border-slate-200/80 dark:border-slate-800/80';

  return (
    <div
      id={`member-card-${member.id}`}
      className={`group relative w-48 rounded-[24px] border p-4.5 flex flex-col items-center text-center transition-all duration-350 ease-out cursor-pointer active:scale-[0.98] select-none ${genderBorder} ${focusClass}`}
      onClick={() => onFocus(member.id)}
    >
      {/* Target/Focus Banner inside card - styled as an M3 Secondary Container Chip */}
      {relationshipLabel && (
        <span className="absolute -top-2.5 px-3 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100/60 dark:border-indigo-900/50 shadow-xs text-indigo-700 dark:text-indigo-300">
          {relationshipLabel}
        </span>
      )}

      {/* Avatar with circle M3 style */}
      <div className={`mt-1 w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-serif text-lg font-bold shadow-xs transition-transform duration-250 group-hover:scale-105 ${member.avatarUrl ? 'bg-slate-200 dark:bg-slate-800' : (member.avatarColor || 'bg-slate-500 text-white')}`}>
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={`${member.firstName} ${member.lastName || ''}`.trim()} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        ) : (
          initials || <User className="w-6 h-6" />
        )}
      </div>

      {/* Name */}
      <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 select-text">
        {member.firstName} {member.lastName || ''}
      </h4>

      {/* Lifespan Years */}
      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
        {lifespanText}
      </p>

      {/* Age or Deceased Badge - styled exactly like M3 Assist/Filter Chips */}
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1">
        {member.isDeceased ? (
          <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 font-bold border border-slate-200/50 dark:border-slate-700/50">
            Deceased
          </span>
        ) : age !== null ? (
          <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100/55 dark:border-emerald-900/30">
            Age {age}
          </span>
        ) : null}

        {member.occupation && member.occupation !== 'Toddler' && member.occupation !== 'Infant' && (
          <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-900/30 max-w-[85px] truncate">
            {member.occupation}
          </span>
        )}
        {member.bloodGroup && (
          <span className="text-[9px] font-bold text-rose-700 dark:text-rose-350 bg-rose-50/50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-100/50 dark:border-rose-900/30">
            🩸 {member.bloodGroup}
          </span>
        )}
      </div>
      
      {/* Contact & AI Status Indicators */}
      <div className="mt-2 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
        {(member.email || member.phone || member.secondaryPhone) && (
          <span title="Contact Info Available" className="p-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/30 dark:border-slate-700/30">
            <MessageSquare className="w-3 h-3" />
          </span>
        )}
        {member.aiContext && (
          <span title="AI Context Provided" className="p-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30">
            <Bot className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Quick Toolbar overlay - M3 Outlined Action Icon Button */}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        <button
          id={`btn-edit-${member.id}`}
          title="Edit member details"
          className="p-1.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-350 shadow-xs hover:shadow-md cursor-pointer transition"
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

