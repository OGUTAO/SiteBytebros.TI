// supabase/functions/send-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend'

const apiKey = Deno.env.get('RESEND_API_KEY')
// ADICIONE ESTA LINHA PARA DEBUGAR:
console.log(`DEBUG: A chave de API do Resend foi lida? ${apiKey ? 'Sim, lida com sucesso.' : 'NÃO, ESTÁ VAZIA OU UNDEFINED!'}`);

const resend = new Resend(apiKey!)
const FROM_EMAIL = 'onboarding@resend.dev' 

serve(async (req) => {
  try {
    const { type, to, orderId, reason } = await req.json()

    let subject = ''
    let htmlBody = ''

    // Monta o e-mail com base no tipo de notificação
    switch (type) {
      case 'PEDIDO_ACEITO':
        subject = `Confirmação do Pedido #${orderId}`
        htmlBody = `<h1>Olá!</h1><p>Seu pedido #${orderId} foi confirmado e já está sendo preparado. Agradecemos pela sua compra!</p>`
        break
      case 'PEDIDO_RECUSADO':
        subject = `Atualização sobre o Pedido #${orderId}`
        htmlBody = `<h1>Olá.</h1><p>Houve uma atualização sobre o seu pedido #${orderId}.</p><p>Motivo: ${reason || 'Não especificado'}</p><p>Entre em contato conosco para mais detalhes.</p>`
        break
      default:
        throw new Error('Tipo de e-mail inválido')
    }

    // Envia o e-mail
    const { data, error } = await resend.emails.send({
      from: `Byte Bros.TI <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: htmlBody,
    })

    if (error) {
      console.error({ error })
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})