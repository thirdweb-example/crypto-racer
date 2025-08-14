'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AudioManagerProps {
  isGamePlaying: boolean
  onCoinCollect: () => void
  onCrash: () => void
}

export function AudioManager({ 
  isGamePlaying, 
  onCoinCollect, 
  onCrash
}: AudioManagerProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [lastCrashTime, setLastCrashTime] = useState(0)
  
  // Audio refs - only keep what we need
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const coinSoundRef = useRef<HTMLAudioElement | null>(null)
  const crashSoundRef = useRef<HTMLAudioElement | null>(null)

  // Audio control functions - define these first
  const playBackgroundMusic = useCallback(async () => {
    if (backgroundMusicRef.current && !isMuted) {
      try {
        // Reset to beginning and ensure volume is set
        backgroundMusicRef.current.currentTime = 0
        backgroundMusicRef.current.volume = 0.3
        await backgroundMusicRef.current.play()
      } catch (error) {
        // Background music autoplay failed
      }
    }
  }, [isMuted])

  const stopBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause()
      backgroundMusicRef.current.currentTime = 0
    }
  }, [])

  const playCoinSound = useCallback(() => {
    if (coinSoundRef.current && !isMuted) {
      coinSoundRef.current.currentTime = 0
              coinSoundRef.current.play().catch(() => {})
    }
  }, [isMuted])

  const playCrashSound = useCallback(() => {
    // Prevent crash sound spam - only play once every 2 seconds
    const now = Date.now()
    if (now - lastCrashTime < 2000) return
    
    if (crashSoundRef.current && !isMuted) {
      setLastCrashTime(now)
      crashSoundRef.current.currentTime = 0
      crashSoundRef.current.play().catch(() => {})
    }
  }, [isMuted, lastCrashTime])

  // Initialize audio elements
  useEffect(() => {
    // Background music - racing theme
    backgroundMusicRef.current = new Audio('/sounds/background.mp3')
    backgroundMusicRef.current.loop = true
    backgroundMusicRef.current.volume = 0.3 // Lower volume for background music
    
    // Coin collection sound
    coinSoundRef.current = new Audio('/sounds/coin-collect.mp3')
    coinSoundRef.current.volume = 0.7
    
    // Crash sound
    crashSoundRef.current = new Audio('/sounds/crash.mp3')
    crashSoundRef.current.volume = 0.4 // Lower volume to make it less overwhelming

    // Try to start background music immediately
    const startBackgroundMusic = async () => {
      try {
        if (backgroundMusicRef.current) {
          // Set volume before playing to ensure it's not muted
          backgroundMusicRef.current.volume = 0.3
          await backgroundMusicRef.current.play()
        }
      } catch (error) {
        // Background music autoplay failed
        // If autoplay fails, we'll try to start it on first user interaction
      }
    }

    startBackgroundMusic()

    // Cleanup function
    return () => {
      if (backgroundMusicRef.current) backgroundMusicRef.current.pause()
    }
  }, [])

  // Handle mute state changes
  useEffect(() => {
    if (isMuted) {
      stopBackgroundMusic()
    } else {
      playBackgroundMusic()
    }
  }, [isMuted, playBackgroundMusic, stopBackgroundMusic])

  // Try to start background music on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (backgroundMusicRef.current && !isMuted && backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play().catch(() => {})
      }
      // Remove the listener after first interaction
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }

    // Add listeners for first user interaction
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('keydown', handleFirstInteraction)
    document.addEventListener('touchstart', handleFirstInteraction)

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [isMuted])

  // Expose audio functions to parent component
  useEffect(() => {
    // Only run in browser environment and ensure window exists
    if (typeof window === 'undefined' || !window) return

    try {
      // Create audio functions that can be called from the game
      const audioOnCoinCollect = () => {
        playCoinSound()
        // Call the original callback if it exists
        if (onCoinCollect) onCoinCollect()
      }

      const audioOnCrash = () => {
        playCrashSound()
        // Call the original callback if it exists
        if (onCrash) onCrash()
      }

      // Assign audio functions to window object safely
      window.audioOnCoinCollect = audioOnCoinCollect
      window.audioOnCrash = audioOnCrash
    } catch (error) {
      console.warn('Failed to set audio functions on window:', error)
    }
  }, [onCoinCollect, onCrash, playCoinSound, playCrashSound])

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Simple Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
          isMuted 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}

// Export audio functions for use in other components
export const audioFunctions = {
  playCoinSound: () => {
    if (typeof window !== 'undefined' && window.audioOnCoinCollect) {
      window.audioOnCoinCollect()
    }
  },
  playCrashSound: () => {
    if (typeof window !== 'undefined' && window.audioOnCrash) {
      window.audioOnCrash()
    }
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    audioOnCoinCollect: () => void
    audioOnCrash: () => void
  }
}
