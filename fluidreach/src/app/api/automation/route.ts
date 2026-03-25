import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, message, contactName } = await req.json()

    const cleanPhone = phone
      .replace(/\+/g, '')
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .trim()

    const personalizedMessage = message.replace(/{name}/g, contactName)

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
          text: { preview_url: false, body: personalizedMessage },
        }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}