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

export async function safeUpsert(payloads: any[], shouldSelect = false) {
  if (!isConfigured || !supabaseClient) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  // Deep clone payloads so we do not mutate original objects
  let currentPayloads = JSON.parse(JSON.stringify(payloads));
  const maxRetries = 10;
  let attempt = 0;

  while (attempt < maxRetries) {
    let query = supabaseClient.from('family_members').upsert(currentPayloads);
    if (shouldSelect) {
      query = query.select();
    }
    const { data, error } = await query;

    if (!error) {
      return { data, error: null };
    }

    console.warn(`[safeUpsert] Upsert failed on attempt ${attempt + 1}:`, error);

    // SQL / PostgREST Missing Column error recognition
    // e.g., "Could not find the 'avatar_url' column of 'family_members' in the schema cache"
    const missingColumnMatch = error.message.match(/Could not find the '([^']+)' column/);
    if (missingColumnMatch && missingColumnMatch[1]) {
      const missingColumn = missingColumnMatch[1];
      console.warn(`[safeUpsert] Detected missing database column: '${missingColumn}'. Dynamic recovery in action: omitting column and retrying.`);
      
      currentPayloads = currentPayloads.map((obj: any) => {
        const cleaned = { ...obj };
        delete cleaned[missingColumn];
        return cleaned;
      });
      
      attempt++;
      continue;
    }

    // Return other errors immediately
    return { data: null, error };
  }

  return { data: null, error: new Error('Exceeded maximum configuration retry count when dynamically resolving schema columns') };
}

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
    created_at: member.createdAt ?? null,
    updated_at: member.updatedAt ?? null,
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
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}
