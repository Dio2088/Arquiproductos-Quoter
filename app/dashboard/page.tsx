import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome! You are authenticated and authorized.</p>
      </div>
      <div>
        <Button asChild>
          <Link href="/dashboard/quotes">Go to Quotes</Link>
        </Button>
      </div>
    </main>
  )
}
