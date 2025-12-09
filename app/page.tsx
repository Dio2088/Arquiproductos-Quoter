"use client"

import { useSearchParams } from "next/navigation"
import QuotesPage from "@/components/quotes-page"

export const dynamic = "force-dynamic"

export default function Page() {
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")
  const status = statusParam && statusParam.length > 0 ? statusParam : "all"

  return <QuotesPage status={status} />
}
