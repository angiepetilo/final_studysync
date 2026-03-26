'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, CheckCircle2, Calendar, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { registerUser } from '@/lib/actions/auth'

// Type for form data
type RegistrationFormData = {
  fullName: string
  email: string
  phone: string
  birthDate: string
  password: string
  confirmPassword: string
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({})
  const router = useRouter()

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic client-side validation
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" })
      return
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.birthDate || !formData.password) {
      setErrors({ email: "Please fill in all fields" })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const result = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        password: formData.password,
      })

      if (result.success) {
        router.push('/verify-email')
      } else {
        setErrors({ email: result.error || 'Registration failed' })
      }
    } catch (error) {
      setErrors({ email: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[540px] bg-[#0F172A] rounded-[2.5rem] p-12 shadow-sm border border-slate-800 mt-12 mb-20">
      <div className="mb-10 text-left">
        <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Get Started</p>
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">Create Account</h1>
        <p className="text-slate-400 font-medium">Join the community of students syncing their success.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-3 ml-1">Full Name</label>
            <div className="relative group">
              <User size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Enter your fullname"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full pl-14 pr-6 py-4 rounded-xl bg-[#030712] border ${errors.fullName ? 'border-red-500/50' : 'border-slate-800'} focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600 shadow-inner focus:shadow-none`}
                autoComplete="name"
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-2 ml-2">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-3 ml-1">Email Address</label>
            <div className="relative group">
              <Mail size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-14 pr-6 py-4 rounded-xl bg-[#030712] border ${errors.email ? 'border-red-500/50' : 'border-slate-800'} focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600 shadow-inner focus:shadow-none`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-2 ml-2">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-3 ml-1">Phone Number</label>
            <div className="relative group">
              <Phone size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                className={`w-full pl-14 pr-6 py-4 rounded-xl bg-[#030712] border ${errors.phone ? 'border-red-500/50' : 'border-slate-800'} focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600 shadow-inner focus:shadow-none`}
                autoComplete="tel"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-2 ml-2">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-3 ml-1">Birth Date</label>
            <div className="relative group">
              <Calendar size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className={`w-full pl-14 pr-6 py-4 rounded-xl bg-[#030712] border ${errors.birthDate ? 'border-red-500/50' : 'border-slate-800'} focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600 shadow-inner focus:shadow-none`}
                autoComplete="bday"
              />
            </div>
            {errors.birthDate && <p className="text-red-500 text-xs mt-2 ml-2">{errors.birthDate}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-3 ml-1">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-14 pr-6 py-4 rounded-xl bg-[#030712] border ${errors.password ? 'border-red-500/50' : 'border-slate-800'} focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600 shadow-inner focus:shadow-none`}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-2 ml-2">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-3 ml-1">Confirm Password</label>
              <div className="relative group">
                <CheckCircle2 size={18} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-14 pr-6 py-4 rounded-xl bg-[#030712] border ${errors.confirmPassword ? 'border-red-500/50' : 'border-slate-800'} focus:bg-[#030712] focus:border-indigo-500/50 focus:outline-none transition-all text-white font-medium placeholder:text-slate-600 shadow-inner focus:shadow-none`}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-2 ml-2">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 ml-1 mt-6">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-1 w-4 h-4 rounded border-slate-700 bg-[#030712] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs font-semibold text-slate-400 leading-relaxed cursor-pointer select-none">
            I agree to the <Link href="#" className="text-indigo-400 hover:underline">Terms of Service</Link> and <Link href="#" className="text-indigo-400 hover:underline">Privacy Policy</Link>. I understand my data will be synced securely.
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 mt-8 active:scale-[0.98] text-lg"
        >
          {loading ? <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" /> : null}
          Create My Account
        </Button>
      </form>

      <div className="mt-12 text-center pt-8 border-t border-slate-800">
        <p className="text-sm font-medium text-slate-400">
          Already have an account? <Link href="/login" className="text-indigo-400 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
