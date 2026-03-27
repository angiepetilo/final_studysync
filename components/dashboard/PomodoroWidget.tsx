'use client'

import { usePomodoro } from '@/context/PomodoroContext'
import { Play, Pause, RotateCcw, Coffee, Brain, Sparkles } from 'lucide-react'

export default function PomodoroWidget() {
  const { 
    mode, 
    timeLeft, 
    isActive, 
    round, 
    totalRounds, 
    startTimer, 
    pauseTimer, 
    resetTimer,
    settings 
  } = usePomodoro()

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getPercentage = () => {
    const total = (mode === 'focus' ? settings.focus_duration : 
                   mode === 'shortBreak' ? settings.short_break : settings.long_break) * 60
    return ((total - timeLeft) / total) * 100
  }

  const getModeColor = () => {
    if (mode === 'focus') return 'text-rose-600 bg-rose-50 border-rose-100'
    if (mode === 'shortBreak') return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    return 'text-indigo-600 bg-indigo-50 border-indigo-100'
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-indigo-500/[0.02] flex flex-col items-center text-center group">
      
      {/* Mode Indicator */}
      <div className={`px-5 py-1.5 rounded-full border text-[0.65rem] font-black uppercase tracking-widest mb-8 transition-colors ${getModeColor()}`}>
        {mode === 'focus' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
      </div>

      {/* Timer Display */}
      <div className="relative mb-10">
        {/* Progress Ring */}
        <svg className="w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'stroke-rose-600' : mode === 'shortBreak' ? 'stroke-emerald-500' : 'stroke-indigo-500'}`}
            strokeWidth="8"
            strokeDasharray={552}
            strokeDashoffset={552 - (552 * getPercentage()) / 100}
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
            {formatTime(timeLeft)}
          </span>
          <div className="flex items-center gap-1.5 mt-2 opacity-40">
            <span className="text-[0.65rem] font-black uppercase text-slate-500 dark:text-slate-400">Round {round}/{totalRounds}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 w-full">
        <button 
          onClick={resetTimer}
          className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
        >
          <RotateCcw size={20} />
        </button>
        
        <button 
          onClick={isActive ? pauseTimer : startTimer}
          className={`flex-[2] py-4 rounded-2xl text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 font-black text-sm ${
            isActive 
              ? 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 shadow-slate-200 dark:shadow-none' 
              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-100 dark:shadow-none'
          }`}
        >
          {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          {isActive ? 'Pause' : 'Start Focus'}
        </button>
      </div>

    </div>
  )
}
