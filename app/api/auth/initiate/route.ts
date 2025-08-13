import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Send login code using thirdweb API
    const response = await fetch('https://api.thirdweb.com/v1/auth/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': process.env.THIRDWEB_SECRET_KEY || '',
      },
      body: JSON.stringify({
        method: 'email',
        email,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: 'Failed to send login code' },
        { status: 500 }
      )
    }

    const data = await response.json()

    return NextResponse.json({ 
      success: true,
      message: 'Login code sent to your phone' 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send login code' },
      { status: 500 }
    )
  }
}
