import RegistrationForm from '@/components/auth/RegistrationForm'
import { Sparkles } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-white font-sans">
      
      {/* Brand Logo Top Left */}
      <div className="fixed top-12 left-12 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-xl font-black tracking-tighter text-white">StudSync</span>
      </div>

      <RegistrationForm />

      {/* Decorative Star Icon Bottom Right */}
      <div className="fixed bottom-24 right-32 opacity-20 transform rotate-12">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center p-4">
           <Sparkles size={32} className="text-indigo-400" />
        </div>
      </div>

      <footer className="text-[0.625rem] font-black text-slate-600 uppercase tracking-[0.2em] mb-12">
        © 2024 StudSync Editorial
      </footer>
    </div>
  )
}
