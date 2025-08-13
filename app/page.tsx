'use client'

import { useState, useEffect } from 'react'
import { RacingGame } from '@/components/RacingGame'
import { AuthComponent } from '@/components/AuthComponent'



interface SavedAuthData {
  userAddress: string
  email: string
  timestamp: number
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState({ title: '', subtitle: '', isAutoLogin: false })
  const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null)
  const [gameStats, setGameStats] = useState({
    bestTime: Infinity,
    totalRaces: 0,
    totalCoins: 0
  })

  // Check for saved authentication on page load
  useEffect(() => {
    const savedAuth = localStorage.getItem('cryptoRacerAuth')
    if (savedAuth) {
      try {
        const authData: SavedAuthData = JSON.parse(savedAuth)
        const now = Date.now()
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        
        // Check if the saved auth is still valid (not expired)
        if (now - authData.timestamp < maxAge) {
          // Simulate a brief loading delay for better UX
          setTimeout(() => {
            setIsAuthenticated(true)
            setUserAddress(authData.userAddress)
            setUserEmail(authData.email)
            setLoginTimestamp(authData.timestamp)
            setIsLoading(false)
            setToastMessage({
              title: 'Welcome back!',
              subtitle: `You've been automatically logged in as ${authData.email}`,
              isAutoLogin: true
            })
            setShowToast(true)
            console.log('🔄 Auto-login successful!')
            
            // Hide toast after 4 seconds
            setTimeout(() => setShowToast(false), 4000)
          }, 800)
        } else {
          // Clear expired auth data
          localStorage.removeItem('cryptoRacerAuth')
          setIsLoading(false)
          console.log('⏰ Saved login expired, please login again')
        }
      } catch (error) {
        console.error('Error parsing saved auth data:', error)
        localStorage.removeItem('cryptoRacerAuth')
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleAuthenticated = (address: string, email: string, rememberMe: boolean = true) => {
    const now = Date.now()
    setIsAuthenticated(true)
    setUserAddress(address)
    setUserEmail(email)
    setLoginTimestamp(now)
    
    // Save authentication data if remember me is enabled
    if (rememberMe) {
      const authData: SavedAuthData = {
        userAddress: address,
        email: email,
        timestamp: now
      }
      localStorage.setItem('cryptoRacerAuth', JSON.stringify(authData))
      console.log('💾 Login saved for future visits')
      
      // Show brief success message
      setToastMessage({
        title: 'Login successful!',
        subtitle: 'Your login has been saved for future visits',
        isAutoLogin: false
      })
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserAddress(null)
    setUserEmail(null)
    setLoginTimestamp(null)
    localStorage.removeItem('cryptoRacerAuth')
    
    // Show logout confirmation
    setToastMessage({
      title: 'Logged out successfully',
      subtitle: 'Your login has been cleared',
      isAutoLogin: false
    })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
    
    console.log('👋 Logged out successfully')
  }

  const handleGameComplete = (time: number) => {
    setGameStats(prev => ({
      ...prev,
      bestTime: Math.min(prev.bestTime, time),
      totalRaces: prev.totalRaces + 1
    }))
  }

  const handleTokensEarned = async (tokens: number) => {
    console.log('🎯 handleTokensEarned called with:', tokens, 'tokens')
    if (tokens === 0) {
      console.log('⏭️ Skipping reward distribution - no tokens to distribute')
      return // Skip if no tokens to distribute
    }
    
    console.log('🚀 Starting automatic reward distribution...')
    // Automatically send rewards to user wallet
    try {
      if (!userAddress) {
        console.error('❌ userAddress is null - cannot send rewards')
        return
      }
      
      const rewardData = {
        userAddress: userAddress,
        amount: tokens,
        gameStats: {
          bestTime: gameStats.bestTime,
          totalRaces: gameStats.totalRaces
        },
        timestamp: Date.now()
      }

      console.log('📤 Sending reward data to API:', rewardData)
      const response = await fetch('/api/claim-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rewardData)
      })
      console.log('📥 API response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('🎉 Rewards automatically sent to wallet:', result)
        
        // Show success message
        setToastMessage({
          title: 'Rewards Sent!',
          subtitle: `${tokens} tokens have been sent to your wallet`,
          isAutoLogin: false
        })
        setShowToast(true)
        setTimeout(() => setShowToast(false), 4000)
        

      } else {
        console.error('❌ Failed to send rewards to wallet')
        // Fallback to normal reward handling

        
        // Show error message
        setToastMessage({
          title: 'Reward Error',
          subtitle: 'Failed to send rewards to wallet. Please try again.',
          isAutoLogin: false
        })
        setShowToast(true)
        setTimeout(() => setShowToast(false), 4000)
      }
    } catch (error) {
      console.error('Error sending rewards to wallet:', error)

      
      // Show error message
      setToastMessage({
        title: 'Reward Error',
        subtitle: 'Network error. Rewards will be available to claim later.',
        isAutoLogin: false
      })
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    }
  }

  const handleCoinsCollected = (coins: number) => {
    setGameStats(prev => ({
      ...prev,
      totalCoins: prev.totalCoins + coins
    }))
  }

  return (
    <main className="min-h-screen racing-bg relative overflow-hidden">
      {/* Racing track pattern overlay */}
      <div className="racing-track-pattern"></div>
      
      {/* Floating racing elements */}
      <div className="racing-element car-1">
        <div className="text-6xl">🏎️</div>
      </div>
      <div className="racing-element car-2">
        <div className="text-5xl">🏁</div>
      </div>
      <div className="racing-element car-3">
        <div className="text-4xl">🚗</div>
      </div>
      <div className="racing-element flag">
        <div className="text-5xl">🏆</div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div className={`${
            toastMessage.isAutoLogin 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400' 
              : toastMessage.title.includes('Logged out')
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400'
          } text-white px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm`}>
            <span className="text-2xl">
              {toastMessage.isAutoLogin ? '🎉' : toastMessage.title.includes('Logged out') ? '👋' : '✅'}
            </span>
            <div className="ml-3">
              <p className="font-bold text-lg">{toastMessage.title}</p>
              <p className="text-sm text-white/90">{toastMessage.subtitle}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-white/80 hover:text-white ml-6 p-1 hover:bg-white/20 rounded-full transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-12 relative z-10">
        {/* Header with Logout Button */}
        <div className="relative mb-12">
          {/* User Status Card - Top Left */}
          {isAuthenticated && userEmail && (
            <div className="absolute top-0 left-0 z-20">
              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl max-w-sm hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm shadow-lg">
                    👤
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">
                      {userEmail}
                    </p>
                    <p className="text-gray-400 text-xs">Active Player</p>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Centered Title */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="text-6xl mr-4">🏎️</div>
              <h1 className="text-7xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-2xl">
                Crypto Racer
              </h1>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full shadow-lg"></div>
          </div>
          
          {/* Logout Button - Top Right */}
          {isAuthenticated && (
            <div className="absolute top-0 right-0 z-20 flex items-center space-x-4">
              {/* Wallet Status Card */}
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-blue-100 text-sm font-medium">Wallet</span>
                  <code className="text-sm text-green-300 font-mono bg-black/40 px-2 py-1 rounded-lg border border-green-500/30">
                    {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userAddress || '')
                      setToastMessage({
                        title: 'Wallet copied!',
                        subtitle: 'Address copied to clipboard',
                        isAutoLogin: false
                      })
                      setShowToast(true)
                      setTimeout(() => setShowToast(false), 2000)
                    }}
                    className="text-blue-300 hover:text-blue-200 text-sm hover:bg-white/10 px-2 py-1 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Copy wallet address"
                  >
                    📋
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center space-x-3 shadow-2xl hover:shadow-red-500/25 hover:scale-105"
              >
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {!isAuthenticated ? (
          <div className="max-w-lg mx-auto">
            {isLoading ? (
              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 shadow-2xl text-center">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-400 border-t-transparent mx-auto mb-6 shadow-2xl"></div>
                <h3 className="text-2xl font-bold text-white mb-3">Checking for saved login...</h3>
                <p className="text-gray-300 text-lg">Looking for your previous session</p>
              </div>
            ) : (
              <AuthComponent 
                onAuthenticated={handleAuthenticated}
              />
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Dashboard Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="dashboard-card bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 card-entrance">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">Total Races</p>
                    <p className="text-3xl font-black text-blue-300">{gameStats.totalRaces}</p>
                    <p className="text-blue-200/60 text-xs">Completed</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center text-2xl shadow-lg">
                    🏁
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 card-entrance">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm font-medium mb-1">Best Time</p>
                    <p className="text-3xl font-black text-green-300">
                      {gameStats.bestTime === Infinity ? 'N/A' : Math.floor(gameStats.bestTime / 1000) + 's'}
                    </p>
                    <p className="text-green-200/60 text-xs">Personal Record</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center text-2xl shadow-lg">
                    ⏱️
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 card-entrance">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm font-medium mb-1">Coins Collected</p>
                    <p className="text-3xl font-black text-yellow-300">{gameStats.totalCoins || 0}</p>
                    <p className="text-yellow-200/60 text-xs">Total Coins</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/30 rounded-full flex items-center justify-center text-2xl shadow-lg">
                    🪙
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 card-entrance">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm font-medium mb-1">Auto Rewards</p>
                    <p className="text-3xl font-black text-green-300">Enabled</p>
                    <p className="text-green-200/60 text-xs">Sent to Wallet</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center text-2xl shadow-lg">
                    🎉
                  </div>
                </div>
              </div>
            </div>

            {/* Game Dashboard */}
            <div className="w-full" data-game-area>
              <RacingGame 
                onGameComplete={handleGameComplete}
                onTokensEarned={handleTokensEarned}
                onCoinsCollected={handleCoinsCollected}
                userAddress={userAddress!}
              />
            </div>

      
          </div>
        )}
      </div>
    </main>
  )
}
