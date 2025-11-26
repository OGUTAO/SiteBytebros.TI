// public/js/supabase-client.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://oljlooossvrgfgqkdmja.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samxvb29zc3ZyZ2ZncWtkbWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzAwODEsImV4cCI6MjA3MDU0NjA4MX0.9OVImUt8Ef9OBb6cts1-uu2pCQKW3kJ5EovzA7rrclA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função auxiliar para buscar e-mails de uma equipe específica + Super Admin
export async function getTeamEmails(teamName) {
    const SUPER_ADMIN_ID = '3e88709d-ad2c-4729-958d-73185a162cfa';
    const emails = [];

    // 1. Busca e-mail do Super Admin
    const { data: superAdmin } = await supabase
        .from('usuarios')
        .select('email')
        .eq('id', SUPER_ADMIN_ID)
        .single();
    
    if (superAdmin?.email) emails.push(superAdmin.email);

    // 2. Busca membros da equipe específica
    if (teamName) {
        const { data: members } = await supabase
            .from('equipe_membros')
            .select('user_id')
            .eq('equipe', teamName);

        if (members && members.length > 0) {
            const memberIds = members.map(m => m.user_id);
            // Busca e-mails dos membros (excluindo super admin se já pegou)
            const { data: teamUsers } = await supabase
                .from('usuarios')
                .select('email')
                .in('id', memberIds)
                .neq('id', SUPER_ADMIN_ID);

            if (teamUsers) {
                teamUsers.forEach(u => emails.push(u.email));
            }
        }
    }

    // Remove duplicatas e retorna lista única
    return [...new Set(emails)];
}