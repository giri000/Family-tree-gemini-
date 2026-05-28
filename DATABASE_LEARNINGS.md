# Supabase Integration Learnings

This document covers the blockers, learnings, and strategies used to securely link a Supabase PostgreSQL database within an AI Studio environment to a frontend React application. 

## 1. Environment Variable Exposure Restrictions
**The Blocker:** We needed the database to seamlessly sync real-time events to the frontend. However, it is highly insecure to expose a standard `SERVICE_ROLE` key to the client browser via `VITE_` variables.  
**The Solution:** We must only supply the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Crucially, to prevent unauthorized access while the Anonymous key handles connections, we had to enforce **Row Level Security (RLS)** policies inside the Supabase database itself to dictate precisely what operations are permitted.

## 2. Real-Time WebSockets Architecture 
**The Blocker:** When an external AI agent or secondary backend mutates the database, the frontend requires a hard reload to fetch changes, leading to poor user experience.  
**The Solution:** We utilized the `@supabase/supabase-js` SDK to hook directly into PostgreSQL's Realtime REST event listeners. Supabase handles WebSocket management, meaning updates stream automatically into React UI states, making the family tree automatically redraw itself upon backend changes.

## 3. Data Formatting Disconnect (TypeScript vs. SQL)
**The Blocker:** Idiomatic TypeScript utilizes `camelCase` struct properties (e.g. `firstName`, `birthDate`), but PostgreSQL defaults to `snake_case` columns (e.g. `first_name`, `birth_date`). This gap in formatting continuously caused null-value inserts and crashes during read ops.  
**The Solution:** Engineered a dedicated abstraction layer (`lib/supabase.ts`) containing explicit mapper functions (`mapToDb` and `mapFromDb`). This ensures the UI components remain purely decoupled from backend structural names, casting the `snake_case` payloads back to reliable `camelCase` variables on the fly. 

## 4. Robust Connection Error Boundaries
**The Blocker:** If environment variables are missing (especially during initial deployment stages without user-defined credentials), creating the Supabase client crashes the entirety of React, producing a fatal blank screen.  
**The Solution:** Wrapped the Supabase client initialization in rigorous `try/catch` safety blocks. If the variables are blank, we set an `isConfigured` boolean flag to `false`. Instead of throwing a crash, the application roots explicitly render a `SupabaseSetup` UI widget which visually walks the user through establishing their AI Studio environment parameters.

## Summary
By separating frontend mapping layers, adopting WebSockets, enforcing strict Try/Catch boundaries on env vars, and relying on pure RLS policies for auth, we achieved a secure, agent-ready database syncing layer. 
