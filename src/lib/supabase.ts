// WARNING: Using client-side Supabase requires the ANON key to be exposed.
// Because the user requested AI Agents to interact with the database and instantly reflect 
// on the frontend, we are utilizing the Supabase JS SDK which hooks directly into WebSockets 
// for Realtime PostgreSQL event listeners.
//
// For production scale, it is highly recommended to enable Row Level Security (RLS) 
// inside your Supabase dashboard to prevent unauthorized table modifications.

import { createClient } from '@supabase/supabase-js';
import { FamilyMember } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};

export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export function mapToDb(member: FamilyMember) {
  return {
    id: member.id,
    first_name: member.firstName,
    last_name: member.lastName,
    gender: member.gender,
    birth_date: member.birthDate,
    birth_place: member.birthPlace,
    is_deceased: member.isDeceased,
    death_date: member.deathDate,
    death_place: member.deathPlace,
    occupation: member.occupation,
    notes: member.notes,
    avatar_color: member.avatarColor,
    email: member.email,
    phone: member.phone,
    address: member.address,
    aliases: member.aliases,
    ai_context: member.aiContext,
    father_id: member.fatherId,
    mother_id: member.motherId,
    spouse_id: member.spouseId,
  };
}

export function mapFromDb(row: any): FamilyMember {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender,
    birthDate: row.birth_date,
    birthPlace: row.birth_place,
    isDeceased: row.is_deceased,
    deathDate: row.death_date,
    deathPlace: row.death_place,
    occupation: row.occupation,
    notes: row.notes,
    avatarColor: row.avatar_color,
    email: row.email,
    phone: row.phone,
    address: row.address,
    aliases: row.aliases,
    aiContext: row.ai_context,
    fatherId: row.father_id,
    motherId: row.mother_id,
    spouseId: row.spouse_id,
  };
}
