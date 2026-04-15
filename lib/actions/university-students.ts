import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function addUniversityStudent(data: {
  email: string
  major?: string
  graduationYear?: string
  fullName?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify university profile to inject organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'university') {
      return { success: false, error: 'Only university administrators can add students.' }
    }

    const payloadMetadata = {
      user_type: 'student',
      created_by_university: true,
      full_name: data.fullName || data.email.split('@')[0],
      university: data.email, // using organization
      major: data.major,
      graduation_year: data.graduationYear
    }

    const adminClient = createAdminClient()

    // Generate random 12 char password since they will reset it
    const randomPassword = Math.random().toString(36).slice(-12) + "A1!"

    // Use admin.createUser to create the auth.users record which triggers on_auth_user_created
    const { data: newAuthUser, error: inviteError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: payloadMetadata
    })

    if (inviteError) {
      console.error('Error inviting student:', inviteError)
      return { success: false, error: inviteError.message }
    }

    return { success: true, data: newAuthUser.user }

  } catch (err: any) {
    console.error('Unexpected error adding student:', err)
    return { success: false, error: err.message || 'Internal server error' }
  }
}

export async function removeUniversityStudent(studentId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Must be university admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'university') {
      return { success: false, error: 'Only university administrators can remove students.' }
    }

    // Start deleting using adminClient
    const adminClient = createAdminClient()

    // In a production DB without explicit CASCADE on FOREIGN KEY references auth.users(id),
    // we must manually delete dependent records from our public schema first.
    // Order matters: students (child of profiles), then profiles (child of users), then user.
    await adminClient.from('course_enrollments').delete().eq('student_id', studentId)
    await adminClient.from('job_applications').delete().eq('applicant_id', studentId)
    await adminClient.from('students').delete().eq('id', studentId)
    await adminClient.from('profiles').delete().eq('id', studentId)

    // Finally, remove the auth user
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(studentId)

    if (deleteUserError) {
      console.error('Error deleting student auth user:', deleteUserError)
      return { success: false, error: deleteUserError.message }
    }

    return { success: true }

  } catch (err: any) {
    console.error('Unexpected error removing student:', err)
    return { success: false, error: err.message || 'Internal server error' }
  }
}