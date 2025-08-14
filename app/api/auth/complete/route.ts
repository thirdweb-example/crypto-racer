import { NextRequest, NextResponse } from 'next/server'
import { setSessionCookies, generateCsrfToken } from '@/lib/cookies'

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

    // Generate CSRF up front so we can include it in body
    const csrfToken = generateCsrfToken()

    const user = {
      id: email,
      email,
      walletAddress: data.walletAddress || 'unknown',
      createdAt: new Date().toISOString(),
      csrfToken,
    }

    const res = NextResponse.json({ user })
    setSessionCookies(res, {
      authToken: data.token,
      sessionMaxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      csrfMaxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      csrfToken,
    })

    return res
  } catch (error) {
    console.error('Error verifying login code:', error)
    return NextResponse.json(
      { error: 'Failed to verify login code' },
      { status: 500 }
    )
  }
}
