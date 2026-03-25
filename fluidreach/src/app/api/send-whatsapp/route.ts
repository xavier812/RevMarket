import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json()

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 })
    }

    // Meta needs number without + sign, spaces or dashes
    // e.g. +919322472263 becomes 919322472263
    const cleanPhone = phone
      .replace(/\+/g, '')
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .trim()

    console.log('Sending to:', cleanPhone)
    console.log('Message:', message)
    console.log('Phone Number ID:', process.env.META_PHONE_NUMBER_ID)

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          },
        }),
      }
    )

    const data = await response.json()
    console.log('Meta API response:', JSON.stringify(data))

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Failed to send', details: data }, { status: 400 })
    }

    return NextResponse.json({ success: true, messageId: data.messages?.[0]?.id })
  } catch (error: any) {
    console.error('Send WhatsApp error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}