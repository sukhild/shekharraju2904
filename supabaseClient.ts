import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpbigqtkrvnjexlvqdhd.supabase.co"; // from Supabase
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwYmlncXRrcnZuamV4bHZxZGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDUzNjAsImV4cCI6MjA3NDgyMTM2MH0.1LHfmhmj66vJ3N8KpbbBaDfYwnfVb_ORCI0Q61faRHM"; // from Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
