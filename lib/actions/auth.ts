import { createClient } from '@/lib/supabase'
import { z } from 'zod'

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  birthDate: z.string().min(1, 'Birth date is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function registerUser(formData: {
  fullName: string
  email: string
  phone: string
  birthDate: string
  password: string
}) {
  const supabase = createClient()
  
  // Validate input
  const validation = registrationSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  try {
    // Create user account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          birth_date: formData.birthDate,
        },
      },
    })

    if (signUpError) {
      return { success: false, error: signUpError.message }
    }

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        birth_date: formData.birthDate,
        role: 'student',
      })

      if (profileError) {
        return { success: false, error: profileError.message }
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signInUser(email: string, password: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signOutUser() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}
