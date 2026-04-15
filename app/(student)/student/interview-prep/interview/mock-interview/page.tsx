import { redirect } from 'next/navigation'

export default function MockInterviewNestedRedirectPage() {
  redirect('/student/interview-prep/mock-interview')
}
