import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface RewardRequest {
  userAddress: string
  amount: number
  gameStats: {
    bestTime: number
    totalRaces: number
  }
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const body: RewardRequest = await request.json()
    const { userAddress, amount, gameStats, timestamp } = body

    console.log('🎮 Game ended - Processing automatic reward distribution')
    console.log('📊 Reward Details:', {
      userAddress: userAddress?.slice(0, 6) + '...' + userAddress?.slice(-4),
      amount,
      gameStats,
      timestamp: new Date(timestamp).toISOString()
    })

    // Server-side verification to prevent cheating
    const verificationResult = await verifyGamePerformance(gameStats, timestamp)
    
    if (!verificationResult.isValid) {
      console.log('❌ Game performance verification failed:', verificationResult.details)
      return NextResponse.json(
        { error: 'Game performance verification failed' },
        { status: 400 }
      )
    }

    console.log('✅ Game performance verification passed')

    // Use the amount sent from the game directly (1 token per coin)
    const verifiedAmount = amount
    console.log('💰 Using game-calculated reward amount:', verifiedAmount)

    console.log('🚀 Starting token distribution to wallet...')

    // Call thirdweb API to distribute tokens
    const tokenDistributionResult = await distributeTokens(userAddress, verifiedAmount)
    
    if (!tokenDistributionResult.success) {
      console.log('❌ Token distribution failed')
      return NextResponse.json(
        { error: 'Token distribution failed' },
        { status: 500 }
      )
    }

    console.log('🎉 Successfully distributed tokens to wallet!', {
      userAddress: userAddress?.slice(0, 6) + '...' + userAddress?.slice(-4),
      amount: verifiedAmount,
      transactionHash: tokenDistributionResult.transactionHash
    })

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
    console.log('🔍 Verifying game performance...')
    
    // Verify timestamp is recent (within last 24 hours)
    const now = Date.now()
    const timeDiff = now - timestamp
    const maxAllowedTime = 24 * 60 * 60 * 1000 // 24 hours
    
    if (timeDiff > maxAllowedTime) {
      console.log('⏰ Game session too old:', Math.floor(timeDiff / 1000 / 60), 'minutes ago')
      return { isValid: false, details: 'Game session too old' }
    }

    // Verify game stats are reasonable
    if (gameStats.bestTime < 0 || gameStats.totalRaces < 0) {
      console.log('⚠️ Invalid game stats:', gameStats)
      return { isValid: false, details: 'Invalid game stats' }
    }

    console.log('✅ Game stats verification passed:', {
      bestTime: gameStats.bestTime === Infinity ? 'N/A' : Math.floor(gameStats.bestTime / 1000) + 's',
      totalRaces: gameStats.totalRaces
    })

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
    console.log('🚀 Preparing token distribution transaction...')
    console.log('📤 Distribution details:', {
      userAddress: userAddress?.slice(0, 6) + '...' + userAddress?.slice(-4),
      amount,
      contractAddress: process.env.TOKEN_CONTRACT_ADDRESS || '0x761F52fd1a441d3df00f6371774F1dD2cbb1c5cf',
      chainId: process.env.CHAIN_ID || '43113'
    })
    
    // Convert amount to Wei
    const amountInWei = (amount * Math.pow(10, 18)).toString()
    
    console.log('📝 Sending mint transaction via thirdweb API...')

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
      console.log('✅ Transaction submitted successfully:', {
        transactionId: response.data.result.transactionIds[0]
      })
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
