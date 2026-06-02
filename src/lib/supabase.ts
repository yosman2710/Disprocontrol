import { createClient } from '@supabase/supabase-js';

// Reemplaza estas variables en tu archivo .env.local o directamente aquí para desarrollo local.
// Es muy recomendable configurarlas como NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmogtcwmhowuhyrltprh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tb2d0Y3dtaG93dWh5cmx0cHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTEyNjgsImV4cCI6MjA5NTk4NzI2OH0.inK29CkWVINb7ZRIxybn3MBbyIyCKguCvLZBtclaS50';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
