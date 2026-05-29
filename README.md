# Kinship Trace 🌳

An intuitive, elegant, and highly polished Material Design 3 family tree builder. **Kinship Trace** allows you to visualize family connections, manage complex relationships, search archives, view historical chronicles, and export/import family backups with a durable and lightweight persistence architecture.

---

## 🎨 Design Theme & Core Aesthetic

Kinship Trace is structured around modern editorial layouts and classic **Material Design 3 (M3)** cues:
- **Responsive Navigation Draft**: Desktop users enjoy a persistent M3 sidebar layout for workspace management. Mobile/tablet users benefit from a compact vertical navigation stack, prioritizing tap area sizes (min 44px) and comfortable browsing.
- **Aesthetic Pairings**: Pairing warm Display Serif heading typography with monospace metrics ("JetBrains Mono") for secondary labels, codes, and database states.
- **High Contrast Styling**: Full light-and-dark theme adaptive palettes utilizing deep charcoal grays (`slate-950`) and soft off-whites (`slate-50`).

---

## 🚀 Key Features

### 🌟 1. Interactive Tree (Pedigree View)
- A dynamic, reactive tree visualization displaying generations of ancestry.
- Click cards to set the focal member or inspect deep family records.
- Instantly view immediate lineage: direct parents, spouses, and children in a custom-structured pedigree chart.
- Quick relational actions let you generate links or add missing connections directly from structural placeholders.

### 🕸️ 2. Kinship Constellation
- A spatial d3/interactive model depicting the family as an interconnected network or map.
- View complex cross-generational loops and branches in a modern spatial graph.

### 🗃️ 3. Member Gallery (Family Archive)
- A comprehensive directory of all archived members with smart searching, filtering by gender, structural sort preferences, and death/living status filters.
- Highlighted cards with detail overlays for seamless updates.

### ⏳ 4. Timeline Chronicle
- A historical timeline of milestones and events (births, marriages, monumental moments) ordered chronologically.
- Interactive vertical timeline showing ages or duration parameters for simple reading.

### 📊 5. Diagnostics & Stats
- Dynamic diagnostic charts (using Recharts or custom metrics) breaking down family counts, gender distribution, occupations, blood group frequencies, and system data health.

### 💾 6. Database Backups
- Securely download and backup the family ledger in raw structured JSON.
- Seamlessly import external backup archives with automatic conflict handling and database transaction synchronization.

---

## 📂 System Schema (`public.family_members`)

Kinship Trace integrates with **Supabase Realtime** for persistent data synchronization. Below is the relational structure of our family ledger:

| Field | Type | Description |
|---|---|---|
| `id` | `uuid (PK)` | Unique UUID identifying each family member. |
| `user_id` | `uuid (FK)` | Links member to auth user for Row Level Security (RLS). |
| `first_name` | `text` | First name (Required). |
| `last_name` | `text` | Last name of the member. |
| `gender` | `text` | Gender identity factor (`male`, `female`, `other`). |
| `birth_date` | `text` | Calendar date / ISO string of birth. |
| `birth_place` | `text` | Location of birth. |
| `is_deceased` | `boolean` | Living status. |
| `death_date` | `text` | Date of passing (if applicable). |
| `death_place` | `text` | Location of passing (if applicable). |
| `occupation` | `text` | Main career / field of activity. |
| `blood_group` | `text` | Blood group classification. |
| `email` | `text` | Email address (if applicable). |
| `phone` | `text` | Phone number. |
| `secondary_phone` | `text` | Alternative coordinate line. |
| `father_id` | `uuid (FK)` | Relationship pointer referencing a father. |
| `mother_id` | `uuid (FK)` | Relationship pointer referencing a mother. |
| `spouse_id` | `uuid (FK)` | Relationship pointer referencing a spouse. |

---

## 🛠️ Database Setup

Run the SQL script found in `supabase-schema.sql` in your Supabase SQL Editor to bootstrap the table:

```sql
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  first_name text not null,
  last_name text,
  gender text,
  ...
);
```

---

## ⚙️ Dynamic Features & Search Priorities
- **Smart Adaptive Focus**: The app automatically detects the key user's login and default person of interest. It prioritizes focused entry on **Giri Prasath S P** if present in the loaded archive, followed by matching emails, names containing "giri", and fallback entries.
- **Form Schema Alerts**: If the active database schema is missing newer attributes (such as blood group or secondary phone columns), a helpful top alert provides auto-generated schema updates to copy directly with one tap.
