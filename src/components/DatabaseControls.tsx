import React, { useRef, useState } from 'react';
import { FamilyMember } from '../types';
import { Download, Upload, RefreshCw, Trash2, Database, AlertTriangle, CheckCircle, FileText, Bot } from 'lucide-react';

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
      <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="space-y-1 md:max-w-xl text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Database className="w-5 h-5 text-indigo-600" />
            <h4 className="text-base font-semibold text-slate-800 font-serif">Database Export & Imports</h4>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
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
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-sm font-semibold transition-colors cursor-pointer shadow-sm w-full"
          >
            <Bot className="w-4 h-4" /> Export AI Contacts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import file dropzone */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <h4 className="text-sm font-semibold text-slate-800 font-serif border-b pb-2">Restore Backup File</h4>
          
          <div
            id="drag-file-dropzone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
            }`}
          >
            <Upload className={`w-8 h-8 mb-2 transition-transform ${dragActive ? 'scale-110 text-indigo-600' : 'text-slate-400'}`} />
            <p className="text-xs font-semibold text-slate-700">Drag & Drop Family Backup File here</p>
            <p className="text-[10px] text-slate-400 mt-1">Or click to select files from your computer (.json format Only)</p>
            
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
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                : 'bg-rose-50 text-rose-800 border border-rose-100'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Maintenance / Disaster commands */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <h4 className="text-sm font-semibold text-slate-800 font-serif border-b pb-2">Database Clean Tools</h4>

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
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg shrink-0 cursor-pointer transition-colors"
                title="Loads standard sample tree"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Restore Sample Dataset</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Lost? Instantly load our complete 3-generation reference family (The Pendletons) to analyze the visualizer configuration.
                </p>
              </div>
            </div>

            {/* Action 2: Wipe Everything */}
            <div className="flex items-start gap-4 border-t pt-4">
              <button
                id="btn-clear-database"
                onClick={() => {
                  if (confirm('DANGER AREA: This will permanently delete ALL family records in this database, giving you a completely blank setup. Proceed with wipe?')) {
                    onClearDatabase();
                    setImportStatus({ type: 'success', message: 'Lineage database cleared. Starting with a blank canvas.' });
                    setTimeout(() => setImportStatus(null), 4000);
                  }
                }}
                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg shrink-0 cursor-pointer transition-colors"
                title="Wipe database data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div>
                <h5 className="text-xs font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Wipe Database Cache
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Completely and permanently delete all registered nodes in the database to build your own family lineage archives from absolute scratch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
