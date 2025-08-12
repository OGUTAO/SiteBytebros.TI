// public/js/supabase-client.js

// PASSO 1: Importa a função 'createClient' diretamente.
// Isso garante que o código só será executado depois que a função estiver disponível.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Suas chaves de API do Supabase
const supabaseUrl = 'https://oljlooossvrgfgqkdmja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samxvb29zc3ZyZ2ZncWtkbWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzAwODEsImV4cCI6MjA3MDU0NjA4MX0.9OVImUt8Ef9OBb6cts1-uu2pCQKW3kJ5EovzA7rrclA';

// Cria e exporta o cliente Supabase usando a função importada.
// Esta abordagem não depende mais de um script global e resolve o problema de carregamento.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);