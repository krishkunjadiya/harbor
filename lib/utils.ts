import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date consistently for SSR/CSR to avoid hydration errors
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    
    // Using a fixed locale 'en-US' ensures the server and client 
    // always produce the same string regardless of the environment's locale settings.
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }).format(d)
  } catch {
    return 'N/A'
  }
}
