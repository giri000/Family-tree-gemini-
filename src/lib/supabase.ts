// WARNING: Using client-side Supabase requires the ANON key to be exposed.
// Because the user requested AI Agents to interact with the database and instantly reflect 
// on the frontend, we are utilizing the Supabase JS SDK which hooks directly into WebSockets 
// for Realtime PostgreSQL event listeners.
//
// For production scale, it is highly recommended to enable Row Level Security (RLS) 
// inside your Supabase dashboard to prevent unauthorized table modifications.

import { createClient } from '@supabase/supabase-js';
import { FamilyMember } from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let isConfigured = false;
let supabaseClient: any = null;

try {
  if (supabaseUrl && supabaseAnonKey && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))) {
    // This will throw if the URL is completely invalid
    new URL(supabaseUrl);
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isConfigured = true;
  }
} catch (e) {
  console.error("Failed to initialize Supabase client:", e);
  isConfigured = false;
}

export const isSupabaseConfigured = () => isConfigured;
export const supabase = supabaseClient;

export function mapToDb(member: FamilyMember) {
  return {
    id: member.id,
    first_name: member.firstName ?? null,
    last_name: member.lastName ?? null,
    gender: member.gender ?? null,
    birth_date: member.birthDate ?? null,
    birth_place: member.birthPlace ?? null,
    is_deceased: member.isDeceased ?? false,
    death_date: member.deathDate ?? null,
    death_place: member.deathPlace ?? null,
    occupation: member.occupation ?? null,
    blood_group: member.bloodGroup ?? null,
    notes: member.notes ?? null,
    avatar_color: member.avatarColor ?? null,
    avatar_url: member.avatarUrl ?? null,
    email: member.email ?? null,
    phone: member.phone ?? null,
    secondary_phone: member.secondaryPhone ?? null,
    address: member.address ?? null,
    aliases: member.aliases ?? null,
    ai_context: member.aiContext ?? null,
    father_id: member.fatherId ?? null,
    mother_id: member.motherId ?? null,
    spouse_id: member.spouseId ?? null,
  };
}

export function mapFromDb(row: any): FamilyMember {
  return {
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || undefined,
    gender: row.gender || 'other',
    birthDate: row.birth_date || undefined,
    birthPlace: row.birth_place || undefined,
    isDeceased: row.is_deceased || false,
    deathDate: row.death_date || undefined,
    deathPlace: row.death_place || undefined,
    occupation: row.occupation || undefined,
    bloodGroup: row.blood_group || undefined,
    notes: row.notes || undefined,
    avatarColor: row.avatar_color || 'bg-slate-200 text-slate-700',
    avatarUrl: row.avatar_url || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    secondaryPhone: row.secondary_phone || undefined,
    address: row.address || undefined,
    aliases: row.aliases || undefined,
    aiContext: row.ai_context || undefined,
    fatherId: row.father_id || undefined,
    motherId: row.mother_id || undefined,
    spouseId: row.spouse_id || undefined,
  };
}
