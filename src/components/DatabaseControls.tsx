import React, { useRef, useState } from 'react';
import { FamilyMember } from '../types';
import { Download, Upload, RefreshCw, Trash2, Database, AlertTriangle, CheckCircle, FileText, Bot, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DatabaseControlsProps {
  members: FamilyMember[];
  onImport: (importedMembers: FamilyMember[]) => void;
  onClearDatabase: () => void;
  onResetSampleData: () => void;
}

export function DatabaseControls({
  members,
  onImport,
  onClearDatabase,
  onResetSampleData,
}: DatabaseControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Export JSON Database
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(members, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `family_tree_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      alert('Failed to generate export file. Please try again.');
    }
  };

  // Export AI Contact Dictionary
  const handleExportAIDictionary = () => {
    try {
      const aiEntities = members.map(m => {
        // Resolve relations
        const father = members.find(f => f.id === m.fatherId);
        const mother = members.find(mo => mo.id === m.motherId);
        const spouse = members.find(s => s.id === m.spouseId);

        return {
          id: m.id,
          name: `${m.firstName} ${m.lastName}`.trim(),
          aliases: m.aliases ? m.aliases.split(',').map(a => a.trim()) : [],
          contactInfo: {
            email: m.email,
            phone: m.phone,
            address: m.address
          },
          biographical: {
            birthDate: m.birthDate,
            deathDate: m.deathDate,
            occupation: m.occupation,
          },
          relationships: {
            father: father ? `${father.firstName} ${father.lastName}`.trim() : null,
            mother: mother ? `${mother.firstName} ${mother.lastName}`.trim() : null,
            spouse: spouse ? `${spouse.firstName} ${spouse.lastName}`.trim() : null,
          },
          aiContextInstructions: m.aiContext || "No specific instructions.",
          notes: m.notes
        };
      });

      const dataStr = JSON.stringify(aiEntities, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `ai_contacts_dictionary_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      alert('Failed to generate AI export file. Please try again.');
    }
  };

  // Process imported JSON file
  const validateAndImportData = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      
      // Validation: Must be an array of objects
      if (!Array.isArray(parsed)) {
        throw new Error('Database backup file must be a JSON array of family members.');
      }

      // Check schema of elements
      const isValid = parsed.every((item: any) => {
        return (
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.firstName === 'string' &&
          ['male', 'female', 'other'].includes(item.gender)
        );
      });

      if (!isValid) {
        throw new Error('Some family records inside the file contain corrupted structures (missing id, firstName, or valid gender).');
      }

      // Import successful
      onImport(parsed);
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${parsed.length} family member records! The visual tree is refocused.`,
      });
      setTimeout(() => setImportStatus(null), 6000);
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Corrupted database backup file. Unable to parse text content.',
      });
    }
  };

  // Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          validateAndImportData(event.target.result as string);
        }
      };
      reader.readAsText(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            validateAndImportData(event.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        setImportStatus({
          type: 'error',
          message: 'Unsupported file format. Please upload standard JSON database backups (.json).',
        });
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Overview */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="space-y-1 md:max-w-xl text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 font-serif">Database Export & Imports</h4>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your family structure and notes are saved directly inside your browser's persistent sandbox storage. You can download your complete database file to share, or extract an AI-optimized contact dictionary.
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
          <button
            id="btn-export-database"
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm w-full"
          >
            <Download className="w-4 h-4" /> Export Tree Backup
          </button>
          
          <button
            id="btn-export-ai-dictionary"
            onClick={handleExportAIDictionary}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-sm font-semibold transition-colors cursor-pointer shadow-sm w-full"
          >
            <Bot className="w-4 h-4" /> Export AI Contacts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import file dropzone */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-serif border-b dark:border-slate-800 pb-2">Restore Backup File</h4>
          
          <div
            id="drag-file-dropzone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/30 dark:bg-slate-800/30'
            }`}
          >
            <Upload className={`w-8 h-8 mb-2 transition-transform ${dragActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`} />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drag & Drop Family Backup File here</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Or click to select files from your computer (.json format Only)</p>
            
            <input
              id="file-input-uploader"
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className={`p-3 rounded-xl text-xs flex gap-2 items-start animate-fade-in ${
              importStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' 
                : 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Maintenance / Disaster commands */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-serif border-b dark:border-slate-800 pb-2">Database Clean Tools</h4>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Action 1: Reset Sample */}
            <div className="flex items-start gap-4">
              <button
                id="btn-restore-sample"
                onClick={() => {
                  if (confirm('Are you sure you want to restore the default sample tree? This will replace your current edits with the 3-generation sample.')) {
                    onResetSampleData();
                    setImportStatus({ type: 'success', message: 'Successfully loaded 3-generation sample family tree.' });
                    setTimeout(() => setImportStatus(null), 4000);
                  }
                }}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg shrink-0 cursor-pointer transition-colors"
                title="Loads standard sample tree"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Restore Sample Dataset</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Lost? Instantly load our complete 3-generation reference family (The Pendletons) to analyze the visualizer configuration.
                </p>
              </div>
            </div>

            {/* Action 2: Wipe Everything */}
            <div className="flex items-start gap-4 border-t dark:border-slate-800 pt-4">
              <button
                id="btn-clear-database"
                onClick={() => {
                  if (confirm('DANGER AREA: This will permanently delete ALL family records in this database, giving you a completely blank setup. Proceed with wipe?')) {
                    onClearDatabase();
                    setImportStatus({ type: 'success', message: 'Lineage database cleared. Starting with a blank canvas.' });
                    setTimeout(() => setImportStatus(null), 4000);
                  }
                }}
                className="p-2 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg shrink-0 cursor-pointer transition-colors"
                title="Wipe database data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div>
                <h5 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Wipe Database Cache
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Completely and permanently delete all registered nodes in the database to build your own family lineage archives from absolute scratch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security Feature */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-center justify-between mt-6">
        <div className="space-y-1 md:max-w-xl text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 font-serif">Account Security</h4>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Update your master password to protect your lineage database from unauthorized access. Make sure it's secure. 
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
          <input
            type="password"
            placeholder="New Master Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            id="btn-update-password"
            onClick={async () => {
              if (!newPassword || newPassword.length < 6) {
                setPasswordMsg('Password must be at least 6 characters.');
                return;
              }
              setPasswordMsg('Updating...');
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) {
                setPasswordMsg(error.message);
              } else {
                setPasswordMsg('Password updated successfully!');
                setNewPassword('');
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm w-full"
          >
            Update Password
          </button>
          {passwordMsg && (
            <p className={`text-xs font-semibold text-center mt-1 ${passwordMsg.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {passwordMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
