export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  birthDate?: string; // YYYY-MM-DD
  birthPlace?: string;
  deathDate?: string; // YYYY-MM-DD (optional, if deceased)
  deathPlace?: string;
  isDeceased: boolean;
  occupation?: string;
  notes?: string;
  bloodGroup?: string;
  avatarColor: string; // Tailwind color class or hex, e.g., 'emerald', 'indigo', 'amber'
  avatarUrl?: string; // Display Picture URL
  
  // Contact & AI Agent Context
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  address?: string;
  aliases?: string; // Known as (e.g. "Mom, Nana, Beth")
  aiContext?: string; // Special instructions for AI agents
  
  // Relational IDs
  fatherId?: string;
  motherId?: string;
  spouseId?: string; // Primary current spouse/partner
}

export interface FamilyTreeData {
  members: FamilyMember[];
  title: string;
}

export type ActiveTab = 'tree' | 'members' | 'timeline' | 'stats';
