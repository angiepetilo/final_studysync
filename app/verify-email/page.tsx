import Link from 'next/link'
import { Mail, ArrowRight } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      
      <div className="w-full max-w-[440px] bg-[#111827] border border-white/5 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden text-center">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
          <Mail size={32} className="text-blue-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Check your email</h1>
        
        <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
          We've sent a verification link to your email address. Please check your inbox and click the link to activate your StudSync account.
        </p>

        <div className="bg-[#182133] border border-white/5 rounded-xl p-4 mb-8">
          <p className="text-xs text-slate-500 font-medium">
            Don't see it? Check your spam folder or wait a few minutes before requesting another link.
          </p>
        </div>

        <Link 
          href="/login" 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          Return to Login <ArrowRight size={18} />
        </Link>

      </div>
      
    </div>
  )
}
