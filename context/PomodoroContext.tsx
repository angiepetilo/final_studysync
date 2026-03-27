'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useData } from './DataContext'

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak'

interface PomodoroSettings {
  focus_duration: number
  short_break: number
  long_break: number
  rounds: number
  auto_start: boolean
  sound_enabled: boolean
}

interface PomodoroContextType {
  mode: PomodoroMode
  timeLeft: number
  isActive: boolean
  round: number
  totalRounds: number
  settings: PomodoroSettings
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  setSettings: (s: Partial<PomodoroSettings>) => Promise<void>
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user } = useData()
  const supabase = createClient()
  
  const [settings, setSettingsState] = useState<PomodoroSettings>({
    focus_duration: 25,
    short_break: 5,
    long_break: 15,
    rounds: 4,
    auto_start: false,
    sound_enabled: true
  })

  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [timeLeft, setTimeLeft] = useState(settings.focus_duration * 60)
  const [isActive, setIsActive] = useState(false)
  const [round, setRound] = useState(1)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('pomodoro_settings').select('*').eq('user_id', user?.id).maybeSingle()
      if (error) return
      if (data) {
        setSettingsState(data)
        setTimeLeft(data.focus_duration * 60)
      }
    } catch (e) {
      // Silent catch
    }
  }

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const setSettings = async (s: Partial<PomodoroSettings>) => {
    const newSettings = { ...settings, ...s }
    setSettingsState(newSettings)
    if (user) {
      await supabase.from('pomodoro_settings').upsert({ user_id: user.id, ...newSettings })
    }
    // Update timer if not active
    if (!isActive) {
      setTimeLeft(newSettings.focus_duration * 60)
    }
  }

  const handleTimerComplete = () => {
    setIsActive(false)
    if (settings.sound_enabled) {
      const audio = new Audio('/sounds/bell.mp3') // Placeholder path
      audio.play().catch(() => {})
    }

    if (mode === 'focus') {
      if (round < settings.rounds) {
        setMode('shortBreak')
        setTimeLeft(settings.short_break * 60)
      } else {
        setMode('longBreak')
        setTimeLeft(settings.long_break * 60)
        setRound(1)
      }
    } else {
      setMode('focus')
      setTimeLeft(settings.focus_duration * 60)
      if (mode === 'shortBreak') setRound(prev => prev + 1)
    }

    if (settings.auto_start) {
      setIsActive(true)
    }
  }

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, timeLeft])

  const startTimer = () => setIsActive(true)
  const pauseTimer = () => setIsActive(false)
  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(settings.focus_duration * 60)
    setMode('focus')
    setRound(1)
  }

  return (
    <PomodoroContext.Provider value={{
      mode, timeLeft, isActive, round, totalRounds: settings.rounds, settings,
      startTimer, pauseTimer, resetTimer, setSettings
    }}>
      {children}
    </PomodoroContext.Provider>
  )
}

export const usePomodoro = () => {
  const context = useContext(PomodoroContext)
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider')
  }
  return context
}
