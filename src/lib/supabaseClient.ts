// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

console.log("APP IS TRYING TO USE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("APP IS TRYING TO USE KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if the variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure .env.local is set up correctly.");
  // You might want to throw an error here in a real app
  // throw new Error("Supabase URL and Anon Key must be provided.");
}

// Initialize and export the client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!) // Using ! assumes they are defined after the check

console.log("Supabase client initialized (check console for errors if any).");