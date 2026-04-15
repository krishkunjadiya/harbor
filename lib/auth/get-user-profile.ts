import { createClient } from '@/lib/supabase/client'

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('user_type, full_name, email')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return data
}

export async function getCurrentUserType(): Promise<string | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type, role')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    return null
  }
  
  // If user_type is 'university' and role is 'faculty', return 'faculty'
  if (profile.user_type === 'university' && profile.role === 'faculty') {
    return 'faculty'
  }
  
  return profile.user_type || null
}
