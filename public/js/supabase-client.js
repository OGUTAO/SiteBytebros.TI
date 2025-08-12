// js/supabase-client.js

// As variáveis SUPABASE_URL e SUPABASE_ANON_KEY serão injetadas pelo Netlify durante o build.
// Para testar localmente, você pode substituir os valores diretamente aqui.
const supabaseUrl = '${https://oljlooossvrgfgqkdmja.supabase.co}';
const supabaseAnonKey = '${eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samxvb29zc3ZyZ2ZncWtkbWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzAwODEsImV4cCI6MjA3MDU0NjA4MX0.9OVImUt8Ef9OBb6cts1-uu2pCQKW3kJ5EovzA7rrclA}';

// Cria e exporta o cliente Supabase para ser usado em todo o site.
export const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);