// js/supabase-client.js

// As variáveis SUPABASE_URL e SUPABASE_ANON_KEY.
// Para testar localmente, os valores devem estar preenchidos diretamente.
const supabaseUrl = 'https://oljlooossvrgfgqkdmja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samxvb29zc3ZyZ2ZncWtkbWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzAwODEsImV4cCI6MjA3MDU0NjA4MX0.9OVImUt8Ef9OBb6cts1-uu2pCQKW3kJ5EovzA7rrclA';

// --- CORREÇÃO APLICADA AQUI ---
// A função createClient() é obtida do objeto 'supabase' global, que é carregado pelo script da CDN no HTML.
// Nós desestruturamos a função para evitar o conflito de nomes e a usamos para criar nossa instância.
const { createClient } = supabase;

// Agora, criamos e exportamos a nossa instância do cliente Supabase para ser usada em todo o site.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);