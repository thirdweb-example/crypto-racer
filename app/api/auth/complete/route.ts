import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Verify login code using thirdweb API
    const response = await fetch('https://api.thirdweb.com/v1/auth/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': process.env.THIRDWEB_SECRET_KEY || '',
      },
      body: JSON.stringify({
        method: 'email',
        email,
        code,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Thirdweb verify code error:', error)
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    const data = await response.json()

    const user = {
      id: email,
      email,
      walletAddress: data.walletAddress || 'unknown',
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error verifying login code:', error)
    return NextResponse.json(
      { error: 'Failed to verify login code' },
      { status: 500 }
    )
  }
}
