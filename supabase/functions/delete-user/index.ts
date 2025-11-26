import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lida com a requisição OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria o cliente Supabase com a Service Role Key (Permissão Total)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    if (!user_id) {
      throw new Error('ID do usuário é obrigatório')
    }

    // PASSO 1: Tenta excluir da tabela pública 'usuarios' primeiro
    // Isso garante que os dados do perfil sumam.
    const { error: deleteProfileError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', user_id)

    if (deleteProfileError) {
      console.error('Erro ao excluir perfil:', deleteProfileError)
      // Não paramos aqui, tentamos excluir o Auth mesmo assim
    }

    // PASSO 2: Exclui o usuário da Autenticação (Login/Email)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    
    if (deleteAuthError) {
        throw deleteAuthError
    }

    return new Response(JSON.stringify({ message: 'Usuário e dados excluídos com sucesso' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})