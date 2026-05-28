import React, { useState, useEffect } from 'react';
import { FamilyMember } from '../types';
import { X, Save, Trash2, Calendar, MapPin, Briefcase, FileText } from 'lucide-react';

interface MemberFormProps {
  member: FamilyMember | null; // null if creating a new member
  allMembers: FamilyMember[];
  onSave: (member: FamilyMember) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  prefilledRelations?: {
    fatherId?: string;
    motherId?: string;
    spouseId?: string;
  };
}

const AVATAR_COLORS = [
  { id: 'slate', className: 'bg-slate-600 text-white', label: 'Slate' },
  { id: 'emerald', className: 'bg-emerald-600 text-white', label: 'Forest' },
  { id: 'rose', className: 'bg-rose-600 text-white', label: 'Rose' },
  { id: 'indigo', className: 'bg-indigo-600 text-white', label: 'Indigo' },
  { id: 'amber', className: 'bg-amber-500 text-white', label: 'Amber' },
  { id: 'cyan', className: 'bg-cyan-600 text-white', label: 'Cyan' },
  { id: 'blue', className: 'bg-blue-600 text-white', label: 'Ocean' },
  { id: 'violet', className: 'bg-violet-600 text-white', label: 'Amethyst' },
  { id: 'orange', className: 'bg-orange-600 text-white', label: 'Terracotta' },
];

export function MemberForm({
  member,
  allMembers,
  onSave,
  onDelete,
  onClose,
  prefilledRelations,
}: MemberFormProps) {
  const isEditing = !!member;

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [occupation, setOccupation] = useState('');
  const [notes, setNotes] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-indigo-600 text-white');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Relational states
  const [fatherId, setFatherId] = useState('');
  const [motherId, setMotherId] = useState('');
  const [spouseId, setSpouseId] = useState('');

  // AI & Contact States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [address, setAddress] = useState('');
  const [aliases, setAliases] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Hydrate form on member loaded or pre-filled relation update
  useEffect(() => {
    if (member) {
      setFirstName(member.firstName || '');
      setLastName(member.lastName || '');
      setGender(member.gender || 'male');
      setBirthDate(member.birthDate || '');
      setBirthPlace(member.birthPlace || '');
      setIsDeceased(member.isDeceased || false);
      setDeathDate(member.deathDate || '');
      setDeathPlace(member.deathPlace || '');
      setOccupation(member.occupation || '');
      setNotes(member.notes || '');
      setAvatarColor(member.avatarColor || 'bg-indigo-600 text-white');
      setAvatarUrl(member.avatarUrl || '');
      setFatherId(member.fatherId || '');
      setMotherId(member.motherId || '');
      setSpouseId(member.spouseId || '');
      setEmail(member.email || '');
      setPhone(member.phone || '');
      setSecondaryPhone(member.secondaryPhone || '');
      setAddress(member.address || '');
      setAliases(member.aliases || '');
      setAiContext(member.aiContext || '');
    } else {
      // Create mode
      setFirstName('');
      setLastName('');
      setGender('male');
      setBirthDate('');
      setBirthPlace('');
      setIsDeceased(false);
      setDeathDate('');
      setDeathPlace('');
      setOccupation('');
      setNotes('');
      setEmail('');
      setPhone('');
      setSecondaryPhone('');
      setAddress('');
      setAliases('');
      setAiContext('');
      // Cycle a default random color
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].className;
      setAvatarColor(randomColor);
      setAvatarUrl('');

      // Apply pre-filled relations if passed (e.g., when clicking "Add Mother" from structural node)
      setFatherId(prefilledRelations?.fatherId || '');
      setMotherId(prefilledRelations?.motherId || '');
      setSpouseId(prefilledRelations?.spouseId || '');
    }
  }, [member, prefilledRelations]);

  // Exclude current person from parents/spouse dropdowns to prevent self-mapping loops
  const eligibleFatherOptions = allMembers.filter(
    (m) => m.id !== member?.id && m.gender !== 'female'
  );
  const eligibleMotherOptions = allMembers.filter(
    (m) => m.id !== member?.id && m.gender !== 'male'
  );
  const eligibleSpouseOptions = allMembers.filter(
    (m) => m.id !== member?.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      alert('First name is required.');
      return;
    }

    const savedMember: FamilyMember = {
      id: member?.id || crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate: birthDate || undefined,
      birthPlace: birthPlace.trim() || undefined,
      isDeceased,
      deathDate: isDeceased ? (deathDate || undefined) : undefined,
      deathPlace: isDeceased ? (deathPlace.trim() || undefined) : undefined,
      occupation: occupation.trim() || undefined,
      notes: notes.trim() || undefined,
      avatarColor,
      avatarUrl: avatarUrl.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      secondaryPhone: secondaryPhone.trim() || undefined,
      address: address.trim() || undefined,
      aliases: aliases.trim() || undefined,
      aiContext: aiContext.trim() || undefined,
      fatherId: fatherId || undefined,
      motherId: motherId || undefined,
      spouseId: spouseId || undefined,
    };

    onSave(savedMember);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xs sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 sm:rounded-2xl shadow-xl sm:border border-slate-100 dark:border-slate-800 max-w-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-serif font-semibold text-slate-800 dark:text-slate-100">
              {isEditing ? `Edit Family Core — ${member.firstName}` : 'Add Family Member'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing ? 'Update life milestones and kinship paths.' : 'Add a new member to the digital heirloom database.'}
            </p>
          </div>
          <button
            id="btn-close-form"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Crucial Stats */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-1">Personal Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">First Name *</label>
                <input
                  id="input-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Thomas"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Last Name</label>
                <input
                  id="input-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Pendleton"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Gender</label>
                <div className="flex gap-2">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      id={`btn-gender-${g}`}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize border cursor-pointer transition-all ${
                        gender === g
                          ? g === 'male'
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-bold'
                            : g === 'female'
                            ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-400 dark:border-pink-700 text-pink-700 dark:text-pink-400 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Color Badge Aspect</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAvatarColor(c.className)}
                      title={c.label}
                      className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${c.className} ${
                        avatarColor === c.className ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'border-slate-300 dark:border-slate-600 opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Temporal Lifespan */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-1">Chronologies & Milestones</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Birth Date
                </label>
                <input
                  id="input-birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Birthplace
                </label>
                <input
                  id="input-birth-place"
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="e.g. Boston, MA"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Deceased Flag toggle */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <input
                id="checkbox-deceased"
                type="checkbox"
                checked={isDeceased}
                onChange={(e) => setIsDeceased(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 focus:ring-2 dark:bg-slate-800"
              />
              <label htmlFor="checkbox-deceased" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                This family member is deceased (record passing years and places)
              </label>
            </div>

            {isDeceased && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Death Date</label>
                  <input
                    id="input-death-date"
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 animate-fade-in"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Death Location</label>
                  <input
                    id="input-death-place"
                    type="text"
                    value={deathPlace}
                    onChange={(e) => setDeathPlace(e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Kinship Connections */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-1">Family & Kinship Connections</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">Father</label>
                <select
                  id="select-father"
                  value={fatherId}
                  onChange={(e) => setFatherId(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- None / Unknown --</option>
                  {eligibleFatherOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.birthDate ? new Date(f.birthDate).getFullYear() : '?'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">Mother</label>
                <select
                  id="select-mother"
                  value={motherId}
                  onChange={(e) => setMotherId(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- None / Unknown --</option>
                  {eligibleMotherOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.birthDate ? new Date(f.birthDate).getFullYear() : '?'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">Spouse / Partner</label>
                <select
                  id="select-spouse"
                  value={spouseId}
                  onChange={(e) => setSpouseId(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- None / Single / Unknown --</option>
                  {eligibleSpouseOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.birthDate ? new Date(f.birthDate).getFullYear() : '?'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Contact & AI Integrations */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-1">Contact & AI Agent Context</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. personal@email.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 012-3456"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Secondary Phone</label>
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 987-6543"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full residential address"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 mt-2">
              <div>
                <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1">Aliases / Known As</label>
                <input
                  type="text"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  placeholder="e.g. Mom, Nana, Ted, The Boss (used by AI to identify them)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1">AI Context & Instructions</label>
                <textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Special instructions or context for Hermes/OpenCLAW when discussing or contacting this person..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Narrative details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-1">Biography & Heritage notes</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Primary Vocation / Profession
                </label>
                <input
                  id="input-occupation"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Civil Engineer, Musician, Homemaker"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Life Memoirs & Anecdotes
                </label>
                <textarea
                  id="textarea-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record custom childhood stories, hobbies, details about how they looked, or standard family histories."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-start sm:items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-auto">
            {isEditing && onDelete && (
              showConfirmDelete ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded">Are you sure? This action cannot be undone.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(member.id)}
                      className="text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full sm:w-auto"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id="btn-delete-member"
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center justify-center sm:justify-start gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4" /> Delete Record
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto font-semibold">
            <button
              id="btn-cancel-form"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-member"
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Core Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
