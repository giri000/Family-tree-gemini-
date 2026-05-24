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
      ? 'border-blue-200 hover:border-blue-400 bg-blue-50/50'
      : member.gender === 'female'
      ? 'border-pink-200 hover:border-pink-400 bg-pink-50/50'
      : 'border-slate-200 hover:border-slate-400 bg-slate-50/50';

  const focusClass = isFocused
    ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-300 shadow-lg'
    : 'shadow-sm hover:shadow-md';

  return (
    <div
      id={`member-card-${member.id}`}
      className={`relative w-48 rounded-xl border p-3 flex flex-col items-center text-center transition-all duration-300 cursor-pointer ${genderBorder} ${focusClass}`}
      onClick={() => onFocus(member.id)}
    >
      {/* Target/Focus Banner inside card */}
      {relationshipLabel && (
        <span className="absolute -top-2 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white border shadow-xs text-slate-500">
          {relationshipLabel}
        </span>
      )}

      {/* Avatar containing first letter of name */}
      <div className={`mt-1.5 w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg font-bold shadow-xs ${member.avatarColor || 'bg-slate-500 text-white'}`}>
        {initials || <User className="w-5 h-5" />}
      </div>

      {/* Name */}
      <h4 className="mt-2 text-sm font-semibold text-slate-800 line-clamp-1">
        {member.firstName} {member.lastName}
      </h4>

      {/* Lifespan Years */}
      <p className="text-[10px] font-mono text-slate-500">
        {lifespanText}
      </p>

      {/* Age or Deceased Badge */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
        {member.isDeceased ? (
          <span className="text-[9px] px-1.5 py-0.5 roundedbg-slate-200 text-slate-600 bg-slate-100 font-medium">
            Deceased
          </span>
        ) : age !== null ? (
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            Age {age}
          </span>
        ) : null}

        {member.occupation && member.occupation !== 'Toddler' && member.occupation !== 'Infant' && (
          <span className="text-[9px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded max-w-[80px] truncate">
            {member.occupation}
          </span>
        )}
      </div>
      
      {/* Contact & AI Status Indicators */}
      <div className="mt-1.5 flex items-center gap-1.5 text-slate-400">
        {(member.email || member.phone) && (
          <span title="Contact Info Available" className="p-0.5 rounded-full bg-slate-100 text-slate-500">
            <MessageSquare className="w-3 h-3" />
          </span>
        )}
        {member.aiContext && (
          <span title="AI Context Provided" className="p-0.5 rounded-full bg-indigo-100 text-indigo-500">
            <Bot className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Quick Toolbar overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        <button
          id={`btn-edit-${member.id}`}
          title="Edit member details"
          className="p-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-xs cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(member);
          }}
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      {/* Subtle Hint on hover at the bottom */}
      <div className="mt-2 text-[9px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
        Click to focus tree
      </div>
    </div>
  );
}
