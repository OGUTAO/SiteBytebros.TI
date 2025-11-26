import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const FROM_EMAIL = 'onboarding@resend.dev'
const FROM_NAME = 'Byte Bros.TI'
const SUPER_ADMIN_ID = '3e88709d-ad2c-4729-958d-73185a162cfa'

const resend = new Resend(RESEND_API_KEY!)
const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const ALLOWED_ORIGINS = [
  'https://bytebrosti.netlify.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
]

serve(async (req) => {
  const origin = req.headers.get('Origin') || ''
  const corsHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, targetTeam, orderId, reason, customerName, serviceType, messageContent } = await req.json()
    
    let recipients: string[] = []

    // 1. Se tiver um destinatário direto (Cliente), adiciona
    if (to) {
        if (Array.isArray(to)) recipients.push(...to)
        else recipients.push(to)
    }

    // 2. Se tiver uma Equipe Alvo (Notificação Admin), busca no banco
    if (targetTeam) {
        // Busca membros da equipe na tabela
        const { data: teamMembers } = await supabaseAdmin
            .from('equipe_membros')
            .select('user_id')
            .eq('equipe', targetTeam)
        
        const memberIds = teamMembers?.map((m: any) => m.user_id) || []
        
        // Garante que o Super Admin sempre receba
        if (!memberIds.includes(SUPER_ADMIN_ID)) {
            memberIds.push(SUPER_ADMIN_ID)
        }

        // Busca os e-mails desses IDs
        const { data: users } = await supabaseAdmin
            .from('usuarios')
            .select('email')
            .in('id', memberIds)
        
        if (users) {
            users.forEach((u: any) => {
                // Evita duplicatas se o super admin também estiver na equipe
                if (u.email && !recipients.includes(u.email)) {
                    recipients.push(u.email)
                }
            })
        }
    }

    // Se não achou ninguém para enviar, para por aqui
    if (recipients.length === 0) {
        return new Response(JSON.stringify({ message: 'Nenhum destinatário encontrado.' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
        })
    }

    let subject = ''
    let htmlBody = ''

    switch (type) {
        // --- NOTIFICAÇÕES DE PEDIDOS (LOJA) ---
        case 'PEDIDO_PENDENTE':
            subject = `Recebemos o seu Pedido #${orderId}`;
            htmlBody = `<h1>Olá!</h1><p>Seu pedido <strong>#${orderId}</strong> foi recebido e está pendente de aprovação.</p>`;
            break;
        case 'PEDIDO_ACEITO':
            subject = `Seu Pedido #${orderId} foi Aprovado!`;
            htmlBody = `<h1>Boas notícias!</h1><p>Seu pedido <strong>#${orderId}</strong> foi confirmado e já está sendo preparado.</p>`;
            break;
        case 'PEDIDO_RECUSADO':
            subject = `Atualização sobre o Pedido #${orderId}`;
            htmlBody = `<h1>Olá.</h1><p>Infelizmente, seu pedido <strong>#${orderId}</strong> foi recusado pela nossa loja.</p><p><strong>Motivo:</strong> ${reason || 'Não especificado'}</p>`;
            break;
        case 'PEDIDO_ENVIADO':
            subject = `Seu pedido #${orderId} está a caminho!`;
            htmlBody = `<h1>Saiu para entrega!</h1><p>O pedido <strong>#${orderId}</strong> foi enviado.</p>`;
            break;
        case 'PEDIDO_ENTREGUE':
            subject = `Pedido #${orderId} entregue com sucesso!`;
            htmlBody = `<h1>Pedido Entregue!</h1><p>Seu pedido <strong>#${orderId}</strong> consta como entregue.</p>`;
            break;
        
        // --- SOLICITAÇÕES DO CLIENTE ---
        case 'SOLICITACAO_RECEBIDA':
            subject = `Recebemos sua solicitação (Pedido #${orderId})`;
            htmlBody = `<h1>Solicitação Recebida</h1><p>Recebemos seu pedido de <strong>${serviceType}</strong> para o pedido #${orderId}.</p><p>Nossa equipe analisará o caso e retornará em breve.</p>`;
            break;
        case 'SOLICITACAO_APROVADA':
            subject = `Solicitação Aprovada (Pedido #${orderId})`;
            htmlBody = `<h1>Aprovado</h1><p>Sua solicitação de <strong>${serviceType}</strong> para o pedido #${orderId} foi aceita.</p>`;
            break;
        case 'SOLICITACAO_RECUSADA':
            subject = `Solicitação de ${serviceType} Recusada (Pedido #${orderId})`;
            htmlBody = `<h1>Atualização</h1><p>A solicitação de <strong>${serviceType}</strong> para o pedido #${orderId} não pôde ser atendida.</p><p><strong>Motivo da recusa:</strong> ${reason}</p>`;
            break;

        // --- NOTIFICAÇÕES INTERNAS (ADMINS) ---
        case 'ADMIN_NOVO_PEDIDO':
            subject = `[Loja] Novo Pedido #${orderId}`;
            htmlBody = `<h2>Novo pedido na loja!</h2><p>Cliente: <strong>${customerName}</strong> (ID #${orderId}).</p><p>Acesse o painel da ByteCore Shop.</p>`;
            break;
        
        case 'ADMIN_SOLICITACAO_CLIENTE':
            subject = `[Loja] Solicitação de ${serviceType} - Pedido #${orderId}`;
            htmlBody = `<h2>Nova Solicitação do Cliente</h2><p><strong>Cliente:</strong> ${customerName}</p><p><strong>Tipo:</strong> ${serviceType}</p><p><strong>Pedido:</strong> #${orderId}</p><p>Acesse a aba "Cancel./Devoluções" no painel.</p>`;
            break;

        case 'ADMIN_NOVO_ORCAMENTO':
            subject = `[Serviços] Novo Orçamento: ${serviceType}`;
            htmlBody = `<h2>Novo Orçamento</h2><p><strong>Cliente:</strong> ${customerName}</p><p><strong>Serviço:</strong> ${serviceType}</p><p><strong>Mensagem:</strong> "${messageContent}"</p>`;
            break;

        case 'ADMIN_NOVO_SUPORTE':
            const equipeNome = serviceType || 'Suporte';
            subject = `[${equipeNome}] Novo Chamado de ${customerName}`;
            htmlBody = `<h2>Novo Chamado para ${equipeNome}</h2><p><strong>Cliente:</strong> ${customerName}</p><p><strong>Mensagem:</strong> "${messageContent}"</p>`;
            break;

        default:
            throw new Error('Tipo de e-mail inválido');
    }

    const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: recipients,
        subject: subject,
        html: htmlBody,
    })

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})