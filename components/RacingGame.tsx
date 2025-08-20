'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AudioManager } from './AudioManager'

interface RacingGameProps {
  onGameComplete: (time: number) => void
  onTokensEarned: (tokens: number) => void
  onCoinsCollected: (coins: number) => void
}

interface Obstacle {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'rock' | 'barrier' | 'cone'
}

interface Coin {
  id: number
  x: number
  y: number
  width: number
  height: number
  collected: boolean
}



interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  type: 'normal' | 'explosion' | 'smoke'
  size: number
}

export function RacingGame({ onGameComplete, onTokensEarned, onCoinsCollected }: RacingGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished' | 'crashed'>('waiting')
  const [carPosition, setCarPosition] = useState(50) // percentage from left
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [coins, setCoins] = useState<Coin[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(0)
  const [obstacleSpeed, setObstacleSpeed] = useState(2)
  const [obstacleId, setObstacleId] = useState(0)
  const [coinId, setCoinId] = useState(0)
  const [particleId, setParticleId] = useState(0)
  const [combo, setCombo] = useState(0)
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [rewardsDistributed, setRewardsDistributed] = useState(false)
  
  const gameLoopRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const rewardsDistributedRef = useRef<boolean>(false)

  const GAME_WIDTH = 400
  const GAME_HEIGHT = 600
  const CAR_WIDTH = 60  // Increased from 40 to 60
  const CAR_HEIGHT = 80 // Increased from 60 to 80
  const LANE_WIDTH = GAME_WIDTH / 4 // 4 lanes, each 100px wide
  const LANE_CENTERS = [LANE_WIDTH * 0.5, LANE_WIDTH * 1.5, LANE_WIDTH * 2.5, LANE_WIDTH * 3.5] // Center of each lane
  const OBSTACLE_WIDTH = 50 // Reduced from 60 to 50 for better spacing
  const OBSTACLE_HEIGHT = 50 // Reduced from 60 to 50 for better spacing

  // Image URLs for car and obstacles
  const CAR_IMAGE = "https://i.ibb.co/4n3GcSFg/Pngtree-f1-car-top-view-2960088.png" // Racing car icon
  const OBSTACLE_IMAGES = {
    rock: "https://i.ibb.co/FbNdMykS/0957a9756995850-removebg-preview.png", // Rock icon
    barrier: "https://i.ibb.co/LdBGpJYN/images-1-removebg-preview.png", // Barrier icon
    cone: "https://i.ibb.co/BvfDPsL/pngtree-traffic-cone-icon-cartoon-style-png-image-4377658-removebg-preview.png" // Traffic cone icon
  }
  const COIN_IMAGE = "https://cdn-icons-png.flaticon.com/512/2933/2933116.png" // Gold coin icon

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setTime(0)
    setObstacles([])
    setCoins([])
    setParticles([])
    setObstacleSpeed(2)
    setObstacleId(0)
    setCoinId(0)
    setParticleId(0)
    setCombo(0)
    setCoinsCollected(0)
    setRewardsDistributed(false) // Reset rewards flag
    rewardsDistributedRef.current = false // Reset ref guard
    lastTimeRef.current = Date.now()
    

  }, [])

  const moveCar = useCallback((direction: 'left' | 'right') => {
    if (gameState !== 'playing') return
    
    setCarPosition(prev => {
      // Convert current percentage to lane (0, 1, 2, 3)
      let currentLane = Math.round((prev / 100) * 3)
      
      if (direction === 'left' && currentLane > 0) {
        currentLane -= 1
      } else if (direction === 'right' && currentLane < 3) {
        currentLane += 1
      }
      
      // Convert lane back to percentage (0%, 33.33%, 66.66%, 100%)
      return (currentLane / 3) * 100
    })
  }, [gameState])

  const createParticles = useCallback((x: number, y: number, count: number = 5, type: 'normal' | 'explosion' | 'smoke' = 'normal') => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const isExplosion = type === 'explosion'
      const isSmoke = type === 'smoke'
      
      newParticles.push({
        id: particleId + i,
        x: x + Math.random() * 20 - 10,
        y: y + Math.random() * 20 - 10,
        vx: (Math.random() - 0.5) * (isExplosion ? 8 : 4),
        vy: (Math.random() - 0.5) * (isExplosion ? 8 : 4),
        life: isExplosion ? 45 : isSmoke ? 60 : 30,
        type: type,
        size: isExplosion ? Math.random() * 8 + 4 : isSmoke ? Math.random() * 6 + 2 : Math.random() * 4 + 2
      })
    }
    setParticles(prev => [...prev, ...newParticles])
    setParticleId(prev => prev + count)
  }, [particleId])



  const triggerCrashState = useCallback(() => {
    // Set crash state immediately
    setGameState('crashed')
    
    // Automatically distribute rewards on crash (only if not already distributed)
    if (!rewardsDistributedRef.current) {
      onGameComplete(time)
      onCoinsCollected(coinsCollected)
      const totalTokens = calculateRewards(time, coinsCollected)
      onTokensEarned(totalTokens)
      setRewardsDistributed(true)
      rewardsDistributedRef.current = true
    } else {
    }
  }, [time, coinsCollected, onGameComplete, onCoinsCollected, onTokensEarned, rewardsDistributed])

  const checkCollision = useCallback((carX: number, carY: number, obstacle: Obstacle) => {
    const carLeft = carX
    const carRight = carX + CAR_WIDTH
    const carTop = carY
    const carBottom = carY + CAR_HEIGHT

    const obstacleLeft = obstacle.x
    const obstacleRight = obstacle.x + OBSTACLE_WIDTH
    const obstacleTop = obstacle.y
    const obstacleBottom = obstacle.y + OBSTACLE_HEIGHT

    return !(carLeft > obstacleRight || 
             carRight < obstacleLeft || 
             carTop > obstacleBottom || 
             carBottom < obstacleTop)
  }, [])

  const checkCoinCollision = useCallback((carX: number, carY: number, coin: Coin) => {
    const carLeft = carX
    const carRight = carX + CAR_WIDTH
    const carTop = carY
    const carBottom = carY + CAR_HEIGHT

    const coinLeft = coin.x
    const coinRight = coin.x + coin.width
    const coinTop = coin.y
    const coinBottom = coin.y + coin.height

    return !(carLeft > coinRight || 
             carRight < coinLeft || 
             carTop > coinBottom || 
             carBottom < coinTop)
  }, [])

  const checkObstacleOverlap = useCallback((newObstacle: Obstacle, existingObstacles: Obstacle[]) => {
    return existingObstacles.some(obs => {
      // Check if obstacles would overlap
      const newLeft = newObstacle.x
      const newRight = newObstacle.x + OBSTACLE_WIDTH
      const newTop = newObstacle.y
      const newBottom = newObstacle.y + OBSTACLE_HEIGHT

      const obsLeft = obs.x
      const obsRight = obs.x + OBSTACLE_WIDTH
      const obsTop = obs.y
      const obsBottom = obs.y + OBSTACLE_HEIGHT

      // Check for overlap with more generous spacing (vertical and horizontal)
      return !(newLeft > obsRight + 30 || 
               newRight < obsLeft - 30 || 
               newTop > obsBottom + 40 || 
               newBottom < obsTop - 40)
    })
  }, [])

  const checkCoinOverlap = useCallback((newCoin: Coin, existingObstacles: Obstacle[], existingCoins: Coin[]) => {
    // Check overlap with obstacles
    const obstacleOverlap = existingObstacles.some(obs => {
      const coinLeft = newCoin.x
      const coinRight = newCoin.x + newCoin.width
      const coinTop = newCoin.y
      const coinBottom = newCoin.y + newCoin.height

      const obsLeft = obs.x
      const obsRight = obs.x + OBSTACLE_WIDTH
      const obsTop = obs.y
      const obsBottom = obs.y + OBSTACLE_HEIGHT

      return !(coinLeft > obsRight + 10 || 
               coinRight < obsLeft - 10 || 
               coinTop > obsBottom + 10 || 
               coinBottom < obsTop - 10)
    })

    if (obstacleOverlap) return true

    // Check overlap with other coins
    const coinOverlap = existingCoins.some(existingCoin => {
      const newCoinLeft = newCoin.x
      const newCoinRight = newCoin.x + newCoin.width
      const newCoinTop = newCoin.y
      const newCoinBottom = newCoin.y + newCoin.height

      const existingCoinLeft = existingCoin.x
      const existingCoinRight = existingCoin.x + existingCoin.width
      const existingCoinTop = existingCoin.y
      const existingCoinBottom = existingCoin.y + existingCoin.height

      return !(newCoinLeft > existingCoinRight + 15 || 
               newCoinRight < existingCoinLeft - 15 || 
               newCoinTop > existingCoinBottom + 15 || 
               newCoinBottom < existingCoinTop - 15)
    })

    return coinOverlap
  }, [])

  const calculateRewards = useCallback((finalTime: number, coinsCollected: number) => {
    // Reward: 1 $VIBES per 5 coins collected
    const finalReward = Math.floor(coinsCollected / 5)
    
    return finalReward
  }, [])

  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'playing') return

    // Fix timing issues - ensure we have a valid delta time
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime
      gameLoopRef.current = requestAnimationFrame(gameLoop)
      return
    }

    const deltaTime = Math.max(0, currentTime - lastTimeRef.current)
    lastTimeRef.current = currentTime

    // Cap delta time to prevent huge jumps
    const clampedDeltaTime = Math.min(deltaTime, 100)

    // Update time (ensure it never goes negative)
    setTime(prev => Math.max(0, prev + clampedDeltaTime))

    // Update score (ensure it never goes negative)
    setScore(prev => Math.max(0, prev + Math.floor(clampedDeltaTime / 16)))

    // Update particles
    setParticles(prev => {
      const updated = prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - 1
      })).filter(particle => particle.life > 0 && particle.y < GAME_HEIGHT) // Also remove particles that go off screen
      
      // Limit total particles to prevent accumulation
      return updated.slice(0, 50) // Maximum 50 particles at once
    })

    // Move obstacles down
    setObstacles(prev => {
      const updated = prev.map(obs => ({
        ...obs,
        y: obs.y + obstacleSpeed
      })).filter(obs => obs.y < GAME_HEIGHT)

      // Remove obstacles that are off screen
      // Also limit total obstacles to prevent overcrowding
      return updated.slice(0, 8) // Maximum 8 obstacles at once
    })

    // Move coins down
    setCoins(prev => {
      const updated = prev.map(coin => ({
        ...coin,
        y: coin.y + obstacleSpeed
      })).filter(coin => coin.y < GAME_HEIGHT)

      // Remove coins that are off screen
      return updated
    })



    // Spawn new obstacles with smart lane placement
    if (Math.random() < 0.015) { // Reduced spawn rate for better spacing
      const obstacleTypes: Obstacle['type'][] = ['rock', 'barrier', 'cone']
      const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]
      
      // Smart obstacle placement: ensure at least 2 lanes are always free
      let availableLanes = [0, 1, 2, 3]
      
      // Check which lanes already have obstacles in the visible area
      const lanesWithObstacles = obstacles
        .filter(obs => obs.y > GAME_HEIGHT - 300 && obs.y < GAME_HEIGHT) // Check visible obstacles
        .map(obs => Math.floor(obs.x / LANE_WIDTH))
      
      // Remove lanes that already have obstacles
      availableLanes = availableLanes.filter(lane => !lanesWithObstacles.includes(lane))
      
      // Only spawn if we have at least 2 free lanes
      if (availableLanes.length >= 2) {
        // Choose a random available lane
        const chosenLane = availableLanes[Math.floor(Math.random() * availableLanes.length)]
        
        const newObstacle: Obstacle = {
          id: obstacleId,
          x: LANE_CENTERS[chosenLane] - OBSTACLE_WIDTH / 2, // Center obstacle in lane
          y: -60,
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
          type: randomType
        }
        
        // Only spawn if it doesn't overlap with existing obstacles
        if (!checkObstacleOverlap(newObstacle, obstacles)) {
          setObstacles(prev => [...prev, newObstacle])
          setObstacleId(prev => prev + 1)
        }
      }
    }

    // Spawn coins in lanes
    if (Math.random() < 0.03) {
      // Choose a random lane for the coin
      const chosenLane = Math.floor(Math.random() * 4)
      
      const newCoin: Coin = {
        id: coinId,
        x: LANE_CENTERS[chosenLane] - 15, // Center coin in lane
        y: -30,
        width: 30,
        height: 30,
        collected: false
      }
      
      // Only spawn if it doesn't overlap with obstacles or other coins
      if (!checkCoinOverlap(newCoin, obstacles, coins)) {
        setCoins(prev => [...prev, newCoin])
        setCoinId(prev => prev + 1)
      }
    }



    // Check collisions
    // Car position is calculated outside the game loop for rendering
    const carY = GAME_HEIGHT - CAR_HEIGHT - 20

    // Ensure car stays within lane bounds
    const currentLane = Math.round((carPosition / 100) * 3)
    const laneX = LANE_CENTERS[currentLane] - CAR_WIDTH / 2
    const clampedCarX = Math.max(0, Math.min(GAME_WIDTH - CAR_WIDTH, laneX))

    obstacles.forEach(obstacle => {
      if (checkCollision(clampedCarX, carY, obstacle)) {
        // Create massive explosion effect
        createParticles(clampedCarX + CAR_WIDTH / 2, carY + CAR_HEIGHT / 2, 25, 'explosion')
        createParticles(clampedCarX + CAR_WIDTH / 2, carY + CAR_HEIGHT / 2, 15, 'smoke')
        
        // Trigger crash audio
        if (window.audioOnCrash) {
          window.audioOnCrash()
        }
        
        // Trigger crash state immediately
        triggerCrashState()
        
        return
      }
    })

    // Check coin collection
    setCoins(prev => {
      return prev.map(coin => {
        if (!coin.collected && checkCoinCollision(clampedCarX, carY, coin)) {
          const newCoinCount = coinsCollected + 1
          setCoinsCollected(newCoinCount)
          setScore(prevScore => prevScore + 50)
          createParticles(coin.x + coin.width / 2, coin.y + coin.height / 2, 4) // Reduced from 8 to 4
          
          // Check if player just earned $VIBES (every 5 coins)
          if (newCoinCount % 5 === 0) {
            // Create special $VIBES celebration particles
            createParticles(clampedCarX + CAR_WIDTH / 2, carY + CAR_HEIGHT / 2, 15, 'explosion')
          }
          
          // Trigger coin collection audio
          if (window.audioOnCoinCollect) {
            window.audioOnCoinCollect()
          }
          
          return { ...coin, collected: true }
        }
        return coin
      })
    })

    
    // Increase difficulty
    if (score > 0 && score % 100 === 0) {
      setObstacleSpeed(prev => Math.min(prev + 0.5, 8))
      setCombo(prev => prev + 1)
    }

    // Game continues indefinitely - no win condition based on score
    // Player can play as long as they want and collect coins

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, carPosition, obstacles, obstacleSpeed, score, time, obstacleId, onGameComplete, onTokensEarned, checkCollision, calculateRewards, createParticles, checkObstacleOverlap, checkCoinOverlap, coins])

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        moveCar('left')
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        moveCar('right')
      } else if (e.key === ' ' && gameState === 'waiting') {
        startGame()
               } else if (e.key === 'e' || e.key === 'E') {
          // End race with 'E' key
          if (gameState === 'playing' && !rewardsDistributedRef.current) {
            setGameState('finished')
            const finalTime = time
            const finalCoins = coinsCollected
            const finalScore = score
            

            
            onGameComplete(finalTime)
            onCoinsCollected(finalCoins)
            
            // Calculate final rewards
            const totalTokens = calculateRewards(finalTime, finalCoins)
            onTokensEarned(totalTokens)
            setRewardsDistributed(true)
            rewardsDistributedRef.current = true
          }
        }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [moveCar, startGame, gameState, time, coinsCollected, score, onGameComplete, onTokensEarned, calculateRewards])

  const carX = (carPosition / 100) * (GAME_WIDTH - CAR_WIDTH)
  const carY = GAME_HEIGHT - CAR_HEIGHT - 20

  // Ensure car stays within lane bounds
  const currentLane = Math.round((carPosition / 100) * 3)
  const laneX = LANE_CENTERS[currentLane] - CAR_WIDTH / 2
  const clampedCarX = Math.max(0, Math.min(GAME_WIDTH - CAR_WIDTH, laneX))

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const renderObstacle = (obstacle: Obstacle) => {
    return (
      <div
        key={obstacle.id}
        className="absolute"
        style={{
          left: obstacle.x,
          top: obstacle.y,
          width: obstacle.width,
          height: obstacle.height
        }}
      >
        <img 
          src={OBSTACLE_IMAGES[obstacle.type]} 
          alt={`${obstacle.type} obstacle`}
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800 rounded-3xl p-8 shadow-2xl border border-blue-500/20 backdrop-blur-sm relative overflow-hidden">
      {/* Audio Manager */}
      <AudioManager
        isGamePlaying={gameState === 'playing'}
        onCoinCollect={() => {
          // This will be handled by the AudioManager internally
        }}
        onCrash={() => {
          // This will be handled by the AudioManager internally
        }}
      />
      
      {/* Racing background pattern */}
      <div className="absolute inset-0 racing-track-pattern opacity-30"></div>
      
      {/* Header with Score and Time */}
      <div className="text-center mb-8 relative z-10">
        <div className="flex items-center justify-center mb-4">
          <div className="text-4xl mr-3">🏁</div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Racing Track
          </h2>
        </div>
        
        <div className="flex justify-center space-x-12">
          <div className="score-display rounded-2xl px-6 py-3">
            <div className="text-gray-300 text-sm font-medium">SCORE</div>
            <div className="text-3xl font-bold text-yellow-400">{score.toLocaleString()}</div>
          </div>
          
          <div className="score-display rounded-2xl px-6 py-3">
            <div className="text-gray-300 text-sm font-medium">TIME</div>
            <div className="text-3xl font-bold text-green-400">{formatTime(time)}</div>
          </div>
          
          <div className="score-display rounded-2xl px-6 py-3">
            <div className="text-gray-300 text-sm font-medium">COINS</div>
            <div className="text-3xl font-bold text-yellow-400">{coinsCollected}</div>
            <div className="text-xs text-gray-400 mt-1">
              {coinsCollected % 5 === 0 ? '🎯 $VIBES Ready!' : `${5 - (coinsCollected % 5)} more for $VIBES`}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div 
                className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((coinsCollected % 5) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div 
        className="relative mx-auto race-track rounded-2xl overflow-hidden shadow-inner" 
        style={{ 
          width: GAME_WIDTH, 
          height: GAME_HEIGHT
        }}
      >

        {/* Lane indicators */}
        {[0, 1, 2, 3].map(lane => (
          <div
            key={`lane-${lane}`}
            className="absolute w-px h-full bg-white/20"
            style={{
              left: LANE_CENTERS[lane],
              top: 0
            }}
          />
        ))}





        {/* Obstacles */}
        {obstacles.map(renderObstacle)}
        
        {/* Render coins */}
        {coins.map(coin => !coin.collected && (
          <div
            key={coin.id}
            className="absolute coin"
            style={{
              left: coin.x,
              top: coin.y,
              width: coin.width,
              height: coin.height
            }}
          >
            <img 
              src={COIN_IMAGE} 
              alt="Coin"
              className="w-full h-full object-contain"
            />
          </div>
        ))}

        {/* Debug info - remove this later */}
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Coins: {coins.length} | Collected: {coinsCollected}
        </div>

        {/* Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`absolute rounded-full ${
              particle.type === 'explosion' 
                ? 'bg-gradient-to-r from-orange-400 via-red-500 to-yellow-400 explosion-particle' 
                : particle.type === 'smoke' 
                ? 'bg-gray-600 smoke-particle' 
                : 'bg-blue-400'
            }`}
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.life / (particle.type === 'explosion' ? 45 : particle.type === 'smoke' ? 60 : 30),
              filter: particle.type === 'explosion' ? 'blur(1px)' : 'none'
            }}
          />
        ))}

        {/* Player car */}
        <div
          className="absolute car"
          style={{
            left: clampedCarX,
            top: carY,
            width: CAR_WIDTH,
            height: CAR_HEIGHT
          }}
        >
          <img 
            src={CAR_IMAGE} 
            alt="Racing Car"
            className="w-full h-full object-contain"
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))'
            }}
          />
        </div>



        {/* Game state overlays */}
        {gameState === 'waiting' && (
          <div className="absolute inset-0 game-overlay rounded-2xl flex items-center justify-center slide-in">
            <div className="text-center text-white">
              <div className="text-6xl mb-6">🚗</div>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Ready to Race?
              </h3>
              <p className="text-gray-300 mb-4 text-lg">Press SPACE to start your journey!</p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>🎮 Use A/D or Arrow Keys to move between 4 lanes</p>
                <p>⚠️ Avoid obstacles (at least 2 lanes always free for easy navigation)</p>
                <p>🪙 Collect golden coins for $VIBES (5 coins = 1 $VIBES)</p>
                <p>🏁 End race anytime to automatically receive rewards</p>
                <div className="mt-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-blue-300 font-medium">💡 Pro Tip:</p>
                  <p className="text-blue-200/80 text-xs">Every 5 coins collected = 1 $VIBES automatically sent to your wallet!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* End Race Button - shown during gameplay */}
        {gameState === 'playing' && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => {
                if (rewardsDistributedRef.current) {
                  return
                }
                
                setGameState('finished')
                const finalTime = time
                const finalCoins = coinsCollected
                const finalScore = score
                

                
                onGameComplete(finalTime)
                onCoinsCollected(finalCoins)
                
                // Calculate final rewards
                const totalTokens = calculateRewards(finalTime, finalCoins)
                onTokensEarned(totalTokens)
                setRewardsDistributed(true)
                rewardsDistributedRef.current = true
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 hover:scale-105 text-sm"
            >
              🏁 End Race
            </button>
          </div>
        )}

        {gameState === 'crashed' && (
          <div className="absolute inset-0 game-overlay rounded-2xl flex items-center justify-center slide-in">
            <div className="text-center text-white">
              <div className="text-6xl mb-6">💥</div>
              <h3 className="text-3xl font-bold mb-6 text-red-400">CRASHED!</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
                <div className="score-display rounded-xl px-6 py-3">
                  <p className="text-gray-300 text-sm">Final Score</p>
                  <p className="text-2xl font-bold text-yellow-400">{score.toLocaleString()}</p>
                </div>
                <div className="score-display rounded-xl px-6 py-3">
                  <p className="text-gray-300 text-sm">Coins Collected</p>
                  <p className="text-2xl font-bold text-yellow-400">{coinsCollected}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30 mb-6">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-green-300 font-semibold">Rewards Sent to Wallet!</p>
                <p className="text-green-200/80 text-sm">
                  {coinsCollected} coins = {Math.floor(coinsCollected / 5)} $VIBES distributed
                </p>
              </div>
              
              <button
                onClick={() => {
                  // Just restart the game - rewards already distributed on crash
                  startGame()
                }}
                className="modern-button text-white font-bold py-3 px-8 rounded-xl text-lg"
              >
                🚗 Try Again
              </button>
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="absolute inset-0 game-overlay rounded-2xl flex items-center justify-center slide-in">
            <div className="text-center text-white">
              <div className="text-6xl mb-6">🏆</div>
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                RACE COMPLETE!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="score-display rounded-xl px-6 py-3">
                  <p className="text-gray-300 text-sm">Score</p>
                  <p className="text-2xl font-bold text-blue-400">{score.toLocaleString()}</p>
                </div>
                <div className="score-display rounded-xl px-6 py-3">
                  <p className="text-gray-300 text-sm">Time</p>
                  <p className="text-2xl font-bold text-green-400">{formatTime(time)}</p>
                </div>
                <div className="score-display rounded-xl px-6 py-3">
                  <p className="text-gray-300 text-sm">Coins</p>
                  <p className="text-2xl font-bold text-yellow-400">{coinsCollected}</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30 mb-6">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-green-300 font-semibold">Rewards Sent to Wallet!</p>
                <p className="text-green-200/80 text-sm">
                  {coinsCollected} coins = {Math.floor(coinsCollected / 5)} $VIBES distributed
                </p>
              </div>
              
              <button
                onClick={startGame}
                className="modern-button text-white font-bold py-3 px-8 rounded-xl text-lg"
              >
                🏁 Race Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-3">🎮 Game Controls</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="flex items-center justify-center space-x-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono">A</span>
              <span>or</span>
              <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono">←</span>
              <span>Move Left</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono">D</span>
              <span>or</span>
              <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono">→</span>
              <span>Move Right</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="bg-green-600 px-2 py-1 rounded text-xs font-mono">SPACE</span>
              <span>Start Game</span>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <span className="bg-green-600 px-2 py-1 rounded text-xs font-mono">E</span>
              <span>End Race</span>
            </div>
          </div>
          <p className="text-gray-400 mt-4 text-sm">
            🪙 Collect golden coins to earn $VIBES! (5 coins = 1 $VIBES) 🏁 End the race to automatically receive rewards in your wallet.
          </p>
        </div>
      </div>
    </div>
  )
}
