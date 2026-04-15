'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Department Actions - University Admin Server Actions
export async function createDepartment(data: {
  name: string
  code: string
  description: string
  head_of_department?: string
  university_id?: string
}) {
  try {
    const supabase = await createClient()
    
    // Get current user ID from session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const universityId = data.university_id || user.id
    
    const { data: result, error } = await supabase
      .from('departments')
      .insert([{
        name: data.name,
        code: data.code,
        description: data.description,
        head_of_department: data.head_of_department || null,
        university_id: universityId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating department:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/[org]/admin/departments')
    return { success: true, data: result }
  } catch (error) {
    console.error('Unexpected error creating department:', error)
    return { success: false, error: 'Failed to create department' }
  }
}

export async function updateDepartment(id: string, data: {
  name?: string
  code?: string
  description?: string
  head_of_department?: string
}) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('departments')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating department:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/[org]/admin/departments')
    return { success: true, data: result }
  } catch (error) {
    console.error('Unexpected error updating department:', error)
    return { success: false, error: 'Failed to update department' }
  }
}

export async function deleteDepartment(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting department:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/[org]/admin/departments')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting department:', error)
    return { success: false, error: 'Failed to delete department' }
  }
}

// Faculty Member Actions
export async function addFacultyMember(data: {
  name: string
  email: string
  phone: string
  department: string
  position: string
  specialization: string
  university_id?: string
}) {
  try {
    const supabase = await createClient()
    
    // Get current user ID from session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const universityId = data.university_id || user.id
    
    // First, create a user in profiles (simplified - you may need to create auth user first)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        email: data.email,
        full_name: data.name,
        phone: data.phone,
        role: 'faculty',
        user_type: 'university',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return { success: false, error: profileError.message }
    }

    // Then create faculty record
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .insert([{
        profile_id: profile.id,
        department: data.department,
        position: data.position,
        specialization: data.specialization,
        university_id: universityId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (facultyError) {
      console.error('Error creating faculty:', facultyError)
      return { success: false, error: facultyError.message }
    }

    revalidatePath('/[org]/admin/members')
    return { success: true, data: faculty }
  } catch (error) {
    console.error('Unexpected error adding faculty:', error)
    return { success: false, error: 'Failed to add faculty member' }
  }
}

export async function updateFacultyMember(id: string, data: {
  name?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  specialization?: string
}) {
  try {
    const supabase = await createClient()

    const { data: facultyRow, error: facultyLookupError } = await supabase
      .from('faculty')
      .select('id, profile_id')
      .eq('id', id)
      .single()

    if (facultyLookupError || !facultyRow) {
      console.error('Error finding faculty member:', facultyLookupError)
      return { success: false, error: facultyLookupError?.message || 'Faculty member not found' }
    }

    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof data.name === 'string') profileUpdates.full_name = data.name
    if (typeof data.email === 'string') profileUpdates.email = data.email
    if (typeof data.phone === 'string') profileUpdates.phone = data.phone

    const shouldUpdateProfile =
      typeof data.name === 'string' ||
      typeof data.email === 'string' ||
      typeof data.phone === 'string'

    if (shouldUpdateProfile) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', facultyRow.profile_id)

      if (profileUpdateError) {
        console.error('Error updating faculty profile:', profileUpdateError)
        return { success: false, error: profileUpdateError.message }
      }
    }
    
    const { data: result, error } = await supabase
      .from('faculty')
      .update({
        department: data.department,
        position: data.position,
        specialization: data.specialization,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating faculty:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/[org]/admin/members')
    return { success: true, data: result }
  } catch (error) {
    console.error('Unexpected error updating faculty:', error)
    return { success: false, error: 'Failed to update faculty member' }
  }
}

export async function deleteFacultyMember(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('faculty')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting faculty:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/[org]/admin/members')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting faculty:', error)
    return { success: false, error: 'Failed to delete faculty member' }
  }
}

// Admin Staff Actions
export async function addAdminStaff(data: {
  name: string
  email: string
  phone: string
  department: string
  position: string
  responsibilities: string
  university_id?: string
}) {
  try {
    const supabase = await createClient()
    
    // Get current user ID from session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const universityId = data.university_id || user.id
    
    // First, create a user in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        email: data.email,
        full_name: data.name,
        phone: data.phone,
        role: 'admin_staff',
        user_type: 'university',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return { success: false, error: profileError.message }
    }

    // Create admin_staff record
    const { data: adminStaff, error: adminError } = await supabase
      .from('admin_staff')
      .insert([{
        profile_id: profile.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        position: data.position,
        responsibilities: data.responsibilities,
        university_id: universityId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (adminError) {
      console.error('Error creating admin staff record:', adminError)
      return { success: false, error: adminError.message }
    }

    revalidatePath('/[org]/admin/members')
    return { success: true, data: adminStaff }
  } catch (error) {
    console.error('Unexpected error adding admin staff:', error)
    return { success: false, error: 'Failed to add admin staff' }
  }
}

export async function updateAdminStaff(id: string, data: {
  name?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  responsibilities?: string
}) {
  try {
    const supabase = await createClient()

    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof data.name === 'string') profileUpdates.full_name = data.name
    if (typeof data.email === 'string') profileUpdates.email = data.email
    if (typeof data.phone === 'string') profileUpdates.phone = data.phone

    const shouldUpdateProfile =
      typeof data.name === 'string' ||
      typeof data.email === 'string' ||
      typeof data.phone === 'string'

    if (shouldUpdateProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)

      if (profileError) {
        console.error('Error updating admin staff profile:', profileError)
        return { success: false, error: profileError.message }
      }
    }

    const adminStaffUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof data.department === 'string') adminStaffUpdates.department = data.department
    if (typeof data.position === 'string') adminStaffUpdates.position = data.position
    if (typeof data.responsibilities === 'string') adminStaffUpdates.responsibilities = data.responsibilities

    const shouldUpdateAdminStaff =
      typeof data.department === 'string' ||
      typeof data.position === 'string' ||
      typeof data.responsibilities === 'string'

    let result: any = null
    if (shouldUpdateAdminStaff) {
      const { data: byProfileData, error: byProfileError } = await supabase
        .from('admin_staff')
        .update(adminStaffUpdates)
        .eq('profile_id', id)
        .select()

      if (byProfileError) {
        console.error('Error updating admin staff by profile_id:', byProfileError)
        return { success: false, error: byProfileError.message }
      }

      if (Array.isArray(byProfileData) && byProfileData.length > 0) {
        result = byProfileData[0]
      } else {
        const { data: byIdData, error: byIdError } = await supabase
          .from('admin_staff')
          .update(adminStaffUpdates)
          .eq('id', id)
          .select()

        if (byIdError) {
          console.error('Error updating admin staff by id:', byIdError)
          return { success: false, error: byIdError.message }
        }

        result = Array.isArray(byIdData) && byIdData.length > 0 ? byIdData[0] : null
      }
    }

    revalidatePath('/[org]/admin/members')
    return { success: true, data: result }
  } catch (error) {
    console.error('Unexpected error updating admin staff:', error)
    return { success: false, error: 'Failed to update admin staff' }
  }
}

export async function deleteAdminStaff(id: string) {
  try {
    const supabase = await createClient()

    const { error: deleteAdminByProfileError } = await supabase
      .from('admin_staff')
      .delete()
      .eq('profile_id', id)

    if (deleteAdminByProfileError) {
      console.error('Error deleting admin staff by profile_id:', deleteAdminByProfileError)
      return { success: false, error: deleteAdminByProfileError.message }
    }

    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (deleteProfileError) {
      console.error('Error deleting admin profile:', deleteProfileError)
      return { success: false, error: deleteProfileError.message }
    }

    revalidatePath('/[org]/admin/members')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting admin staff:', error)
    return { success: false, error: 'Failed to delete admin staff' }
  }
}
