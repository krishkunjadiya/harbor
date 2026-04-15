import type React from "react"
import type { Metadata } from "next"
import "@fontsource-variable/ibm-plex-sans"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Harbor - Student Credential Management Platform",
  description: "Bridge the gap between education and employment with Harbor's comprehensive platform for students, universities, and recruiters.",
  generator: 'v0.app'
}

export default function RootLayout({
  children }: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
