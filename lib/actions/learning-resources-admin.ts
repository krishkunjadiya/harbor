'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLearningResource(data: any) {
  const supabase = await createClient()
  
  const { data: result, error } = await supabase
    .from('learning_resources')
    .insert([{
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      duration: data.duration || null,
      file_size: data.fileSize || null,
      author: data.author || null,
      url: data.url
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating learning resource:', error)
    return { success: false, error: error.message }
  }

  // Revalidate to update the client pages
  revalidatePath('/student/learning-resources', 'page')
  return { success: true, data: result }
}

export async function deleteLearningResource(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('learning_resources')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting learning resource:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/student/learning-resources', 'page')
  return { success: true }
}
