import { NextRequest, NextResponse } from 'next/server'
import { verifySessionAndCsrf } from '@/lib/cookies'
import { getUserDetails } from '@/lib/thirdweb'
import axios from 'axios'

interface RewardRequest {
  amount: number
  gameStats: {
    bestTime: number
    totalRaces: number
  }
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and CSRF token
    let authToken: string
    try {
      const session = verifySessionAndCsrf(request)
      authToken = session.authToken
    } catch (err: any) {
      console.error('❌ Session verification failed:', err)
      console.error('❌ Error details:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name
      })
      const code = err?.message
      const map: Record<string, number> = {
        NO_SESSION: 401,
        INVALID_CSRF: 403,
        BAD_ORIGIN: 403,
      }
      return NextResponse.json({ error: code || 'Unauthorized' }, { status: map[code] || 401 })
    }

    const body: RewardRequest = await request.json()
    const { amount, gameStats, timestamp } = body

    // Get user wallet address from thirdweb API
    let userAddress: string
    try {
      const userDetails = await getUserDetails(authToken)
      userAddress = userDetails.data.result.address
    } catch (error) {
      console.error('❌ Failed to get user details:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve user wallet address' },
        { status: 500 }
      )
    }

    // Server-side verification to prevent cheating
    const verificationResult = await verifyGamePerformance(gameStats, timestamp)
    
    if (!verificationResult.isValid) {
      return NextResponse.json(
        { error: 'Game performance verification failed' },
        { status: 400 }
      )
    }

    // Use the amount sent from the game directly (1 token per coin)
    const verifiedAmount = amount

    // Call thirdweb API to distribute tokens
    const tokenDistributionResult = await distributeTokens(userAddress, verifiedAmount)
    
    if (!tokenDistributionResult.success) {
      return NextResponse.json(
        { error: 'Token distribution failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully distributed ${verifiedAmount} tokens`,
      transactionHash: tokenDistributionResult.transactionHash,
      amount: verifiedAmount
    })

  } catch (error) {
    console.error('Error processing reward claim:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function verifyGamePerformance(gameStats: any, timestamp: number): Promise<{ isValid: boolean; details: any }> {
  try {
    // Verify timestamp is recent (within last 24 hours)
    const now = Date.now()
    const timeDiff = now - timestamp
    const maxAllowedTime = 24 * 60 * 60 * 1000 // 24 hours
    
    if (timeDiff > maxAllowedTime) {
      return { isValid: false, details: 'Game session too old' }
    }

    // Verify game stats are reasonable
    if (gameStats.bestTime < 0 || gameStats.totalRaces < 0) {
      return { isValid: false, details: 'Invalid game stats' }
    }

    // Additional verification logic could include:
    // - Checking against stored game sessions
    // - Verifying game completion patterns
    // - Rate limiting checks
    
    return { isValid: true, details: 'Verification passed' }
  } catch (error) {
    console.error('💥 Verification error:', error)
    return { isValid: false, details: 'Verification failed' }
  }
}

async function distributeTokens(userAddress: string, amount: number): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    // Convert amount to Wei
    const amountInWei = (amount * Math.pow(10, 18)).toString()

    // Send the transaction via thirdweb contracts write API
    const response = await axios.post('https://api.thirdweb.com/v1/contracts/write', {
      calls: [
        {
          contractAddress: process.env.TOKEN_CONTRACT_ADDRESS || '0x761F52fd1a441d3df00f6371774F1dD2cbb1c5cf',
          method: 'function mintTo(address to, uint256 amount)',
          params: [
            userAddress,
            amountInWei
          ]
        }
      ],
      chainId: parseInt(process.env.CHAIN_ID || '43113'),
      from: process.env.ADMIN_ADDRESS || '0xEc9b0A9ac8A66B05Ce18892Eb5D82Db28125c174'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': process.env.THIRDWEB_SECRET_KEY || 'your-secret-key'
      }
    })

    if (response.data.result?.transactionIds && response.data.result.transactionIds.length > 0) {
      return {
        success: true,
        transactionHash: response.data.result.transactionIds[0]
      }
    } else {
      console.error('❌ Thirdweb API error:', response.data)
      return { success: false }
    }

  } catch (error) {
    console.error('💥 Token distribution error:', error)
    return { success: false }
  }
}
