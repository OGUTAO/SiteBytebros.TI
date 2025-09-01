import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend'

// --- CONFIGURAÇÃO ---
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// IMPORTANTE: Para enviar e-mails de 'bytebrosti@gmail.com', você precisa verificar
// um domínio próprio no Resend (ex: 'bytebros.ti'). Usar um @gmail.com diretamente
// não é permitido por razões de segurança. Por enquanto, usaremos um e-mail de teste.
// Altere para o seu e-mail de domínio verificado quando tiver um.
const FROM_EMAIL = 'onboarding@resend.dev'; 
const FROM_NAME = 'Byte Bros.TI';

const resend = new Resend(RESEND_API_KEY!);

// Cabeçalhos que corrigem o erro de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permite qualquer origem. Para mais segurança, restrinja ao seu domínio Netlify.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // O navegador envia esta requisição "de sondagem" antes da real.
  // Responder a ela é crucial para corrigir o erro de CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, orderId, reason } = await req.json()

    let subject = ''
    let htmlBody = ''

    switch (type) {
      case 'PEDIDO_PENDENTE': // Adicionado para completar a funcionalidade
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

    // LÓGICA DE ENVIO CONDICIONAL: Só envia o e-mail se estiver no ambiente do Netlify.
    if (Deno.env.get('NETLIFY') === 'true') {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject: subject,
            html: htmlBody,
        });

        if (error) {
            console.error({ error });
            // Retorna o erro, mas com os cabeçalhos de CORS
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        // Retorna o sucesso, com os cabeçalhos de CORS
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } else {
        // Se NÃO estiver no Netlify (ambiente local), apenas simula o sucesso.
        console.log(`SIMULAÇÃO DE ENVIO (Local): E-mail do tipo '${type}' para '${to}'. O e-mail não foi enviado de verdade.`);
        return new Response(JSON.stringify({ message: 'Simulação de envio local bem-sucedida.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})