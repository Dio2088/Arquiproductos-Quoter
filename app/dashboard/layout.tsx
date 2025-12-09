"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function verify() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.email) {
        router.replace("/")
        return
      }

      const { data: authRow, error } = await supabase
        .from("authorized_users")
        .select("email")
        .eq("email", session.user.email)
        .limit(1)
        .single()

      if (error || !authRow) {
        await supabase.auth.signOut()
        router.replace("/?error=unauthorized")
        return
      }

      setChecking(false)
    }

    void verify()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/")
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Checking session...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <div className="font-semibold text-slate-900">Dashboard</div>
        <button
          onClick={handleSignOut}
          className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
        >
          Sign Out
        </button>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}

