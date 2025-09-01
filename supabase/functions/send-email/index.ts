import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend'

// --- CONFIGURAÇÃO ---
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'onboarding@resend.dev' // Lembrete: Use um e-mail de domínio verificado no Resend para produção.
const FROM_NAME = 'Byte Bros.TI'

const resend = new Resend(RESEND_API_KEY!)

// Lista de sites que podem acessar esta função
const ALLOWED_ORIGINS = [
  'https://bytebrosti.netlify.app',
  'http://127.0.0.1:5500', // Para seus testes locais
  'http://localhost:5500',   // Outra variação comum para testes locais
]

serve(async (req) => {
  const origin = req.headers.get('Origin') || ''
  
  // Cabeçalhos que corrigem o erro de CORS
  const corsHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    // Permite o acesso apenas se o site que está chamando estiver na nossa lista
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  }

  // Responde à requisição de "sondagem" (preflight) do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, orderId, reason } = await req.json()
    let subject = ''
    let htmlBody = ''

    switch (type) {
        case 'PEDIDO_PENDENTE':
            subject = `Recebemos o seu Pedido #${orderId}`;
            htmlBody = `<h1>Olá!</h1><p>Seu pedido #${orderId} foi recebido com sucesso e está pendente de aprovação. Avisaremos assim que ele for processado. Agradecemos pela sua compra!</p>`;
            break;
        case 'PEDIDO_ACEITO':
            subject = `Seu Pedido #${orderId} foi Aprovado!`;
            htmlBody = `<h1>Olá!</h1><p>Boas notícias! Seu pedido #${orderId} foi confirmado e já está sendo preparado para envio. Agradecemos pela sua compra!</p>`;
            break;
        case 'PEDIDO_RECUSADO':
            subject = `Atualização Importante sobre o Pedido #${orderId}`;
            htmlBody = `<h1>Olá.</h1><p>Houve uma atualização sobre o seu pedido #${orderId}. Infelizmente, ele foi recusado.</p><p><strong>Motivo:</strong> ${reason || 'Não especificado'}</p><p>Por favor, entre em contato com nosso suporte para mais detalhes.</p>`;
            break;
        default:
            throw new Error('Tipo de e-mail inválido');
    }

    // A lógica de enviar e-mail continua a mesma
    const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: htmlBody,
    })

    if (error) {
      throw error;
    }

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