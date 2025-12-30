// @deno-types="https://esm.sh/@types/node@18/globals.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  to: string;
  subscription: {
    name: string;
    amount: number;
    currency: string;
    billing_cycle: string;
    next_payment_date: string;
    description?: string;
  };
  daysUntil: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subscription, daysUntil }: RequestBody = await req.json()

    // Create Supabase client (for potential future use with logging/analytics)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Log the notification attempt (optional)
    // await supabaseClient.from('notification_logs').insert({
    //   email: to,
    //   subscription_name: subscription.name,
    //   days_until: daysUntil,
    //   sent_at: new Date().toISOString()
    // })

    // Email content
    const subject = daysUntil === 0 
      ? `Payment Due Today: ${subscription.name}`
      : `Payment Reminder: ${subscription.name} due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .subscription-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #667eea; }
          .urgent { color: #e74c3c; font-weight: bold; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 SubScout Payment Reminder</h1>
          </div>
          <div class="content">
            <h2 ${daysUntil === 0 ? 'class="urgent"' : ''}>
              ${daysUntil === 0 ? '⚠️ Payment Due Today!' : `📅 Payment Due in ${daysUntil} Day${daysUntil > 1 ? 's' : ''}`}
            </h2>
            
            <div class="subscription-details">
              <h3>${subscription.name}</h3>
              <p><strong>Amount:</strong> <span class="amount">${subscription.currency} ${subscription.amount}</span></p>
              <p><strong>Billing Cycle:</strong> ${subscription.billing_cycle}</p>
              <p><strong>Next Payment:</strong> ${new Date(subscription.next_payment_date).toLocaleDateString()}</p>
              ${subscription.description ? `<p><strong>Description:</strong> ${subscription.description}</p>` : ''}
            </div>

            <p>Don't forget to ensure you have sufficient funds for this payment.</p>
            
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}" class="button">
              View in SubScout
            </a>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666;">
              You're receiving this email because you have notifications enabled for this subscription in SubScout.
              <br>
              To manage your notification preferences, visit your SubScout dashboard.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using your preferred email service
    // For this example, I'll show how to use Resend (you can also use SendGrid, Mailgun, etc.)
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SubScout <notifications@yourdomain.com>',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error(`Email service error: ${emailResponse.statusText}`)
    }

    const emailResult = await emailResponse.json()

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})