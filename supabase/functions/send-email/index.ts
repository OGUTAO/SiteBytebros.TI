import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

// O Deno (ambiente que roda as funções) vai pegar a chave do seu arquivo .env.local
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY);

interface EmailPayload {
  to: string;
  type: 'PEDIDO_PENDENTE' | 'PEDIDO_ACEITO' | 'PEDIDO_RECUSADO';
  orderId?: number;
  reason?: string;
}

serve(async (req) => {
  try {
    const payload: EmailPayload = await req.json();

    let subject = "";
    let htmlBody = "";

    switch (payload.type) {
      case 'PEDIDO_PENDENTE':
        subject = `Confirmamos o seu pedido #${payload.orderId}!`;
        htmlBody = `<h1>Olá!</h1><p>Seu pedido #${payload.orderId} foi recebido e está aguardando aprovação.</p><p>Obrigado por comprar na ByteBros.TI!</p>`;
        break;

      case 'PEDIDO_ACEITO':
        subject = `Boas notícias! Seu pedido #${payload.orderId} foi aceito!`;
        htmlBody = `<h1>Pedido Aprovado!</h1><p>Seu pedido #${payload.orderId} foi aceito e já estamos preparando tudo para o envio.</p>`;
        break;

      case 'PEDIDO_RECUSADO':
        subject = `Atualização sobre o seu pedido #${payload.orderId}`;
        htmlBody = `<h1>Pedido Recusado</h1><p>Houve um problema com o seu pedido #${payload.orderId}.</p><p><strong>Motivo:</strong> ${payload.reason || 'Não especificado.'}</p><p>O reembolso será processado automaticamente.</p>`;
        break;
    }

    // Envia o e-mail usando o Resend
    await resend.emails.send({
      from: "onboarding@resend.dev", // E-mail de teste do Resend
      to: payload.to,
      subject: subject,
      html: htmlBody,
    });

    return new Response(JSON.stringify({ message: "Email sent successfully!" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});