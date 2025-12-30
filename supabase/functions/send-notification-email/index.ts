import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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
  console.log('=== EMAIL FUNCTION START ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Step 1: Reading request body...')
    
    // Get raw body text first
    const bodyText = await req.text()
    console.log('Raw body length:', bodyText.length)
    console.log('Raw body preview:', bodyText.substring(0, 200))
    
    if (!bodyText || bodyText.trim() === '') {
      throw new Error('Request body is empty')
    }

    console.log('Step 2: Parsing JSON...')
    let requestBody: RequestBody
    try {
      requestBody = JSON.parse(bodyText)
      console.log('Parsed body keys:', Object.keys(requestBody))
    } catch (parseError) {
      console.error('JSON parse failed:', parseError)
      throw new Error(`Invalid JSON: ${parseError.message}`)
    }

    console.log('Step 3: Validating request data...')
    const { to, subscription, daysUntil } = requestBody

    if (!to) throw new Error('Missing "to" field')
    if (!subscription) throw new Error('Missing "subscription" field')
    if (daysUntil === undefined) throw new Error('Missing "daysUntil" field')

    console.log('Request validation passed:', { to, subscriptionName: subscription.name, daysUntil })

    console.log('Step 4: Checking environment variables...')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    console.log('Environment status:', {
      hasResendKey: !!resendApiKey,
      keyLength: resendApiKey?.length || 0,
      keyPrefix: resendApiKey?.substring(0, 8) || 'none',
      siteUrl
    })

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not found in environment variables')
    }

    console.log('Step 5: Preparing email content...')
    const subject = daysUntil === 0 
      ? `Payment Due Today: ${subscription.name}`
      : `Payment Reminder: ${subscription.name} due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`

    const emailData = {
      from: 'SubScout <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎯 SubScout Payment Reminder</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h3>${daysUntil === 0 ? '⚠️ Payment Due Today!' : `📅 Payment Due in ${daysUntil} Day${daysUntil > 1 ? 's' : ''}`}</h3>
            <p><strong>Service:</strong> ${subscription.name}</p>
            <p><strong>Amount:</strong> ${subscription.currency} ${subscription.amount}</p>
            <p><strong>Billing:</strong> ${subscription.billing_cycle}</p>
            <p><strong>Due Date:</strong> ${new Date(subscription.next_payment_date).toLocaleDateString()}</p>
            ${subscription.description ? `<p><strong>Description:</strong> ${subscription.description}</p>` : ''}
            <p><a href="${siteUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in SubScout</a></p>
          </div>
        </div>
      `
    }

    console.log('Email data prepared:', { 
      from: emailData.from, 
      to: emailData.to, 
      subject: emailData.subject,
      htmlLength: emailData.html.length 
    })

    console.log('Step 6: Sending email via Resend...')
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    console.log('Resend response status:', emailResponse.status)
    console.log('Resend response headers:', Object.fromEntries(emailResponse.headers.entries()))

    const responseText = await emailResponse.text()
    console.log('Resend response body:', responseText)

    if (!emailResponse.ok) {
      throw new Error(`Resend API error ${emailResponse.status}: ${responseText}`)
    }

    let emailResult
    try {
      emailResult = JSON.parse(responseText)
    } catch {
      emailResult = { raw: responseText }
    }

    console.log('Step 7: Email sent successfully!')
    console.log('Email result:', emailResult)

    const successResponse = {
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult.id || 'unknown',
      timestamp: new Date().toISOString()
    }

    console.log('Returning success response:', successResponse)
    console.log('=== EMAIL FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify(successResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== EMAIL FUNCTION ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('=== END ERROR ===')
    
    const errorResponse = {
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    }

    console.log('Returning error response:', errorResponse)

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})