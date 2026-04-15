import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap } from "@phosphor-icons/react/dist/ssr"
import { Suspense } from "react"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/landing" className="flex items-center gap-2 cursor-pointer">
            <GraduationCap className="h-6 w-6" />
            <span className="text-xl font-bold">Harbor</span>
          </Link>
          <nav className="hidden md:flex items-center justify-self-center gap-6">
            <Link href="/landing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center justify-self-end gap-2">
            <Button variant="ghost" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your Harbor account</p>
          </div>

          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
