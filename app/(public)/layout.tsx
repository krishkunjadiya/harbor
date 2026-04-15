import type { ReactNode } from "react"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="public-shell min-h-screen w-full max-w-full overflow-y-auto overflow-x-hidden bg-background">
      <div className="w-full">
        {children}
      </div>
    </main>
  )
}
