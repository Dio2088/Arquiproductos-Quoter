"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type QuoteStatus = "Draft" | "Sent" | "Approved" | "Rejected"

type QuoteHeader = {
  id: string
  customer_name: string
  project_name: string
  distributor_name: string | null
  quote_date: string | null
  notes: string | null
  status: QuoteStatus
  created_at: string
}

export default function QuotesPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [quotes, setQuotes] = useState<QuoteHeader[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [form, setForm] = useState({
    customer_name: "",
    project_name: "",
    distributor_name: "",
    quote_date: "",
    notes: "",
  })

  useEffect(() => {
    void loadQuotes()
  }, [])

  async function loadQuotes() {
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setQuotes((data as QuoteHeader[]) || [])
    }
    setIsLoading(false)
  }

  function resetForm() {
    const today = new Date().toISOString().slice(0, 10)
    setForm({
      customer_name: "",
      project_name: "",
      distributor_name: "",
      quote_date: today,
      notes: "",
    })
    setSubmitError(null)
  }

  function handleOpenModal(open: boolean) {
    setIsModalOpen(open)
    if (open) {
      const today = new Date().toISOString().slice(0, 10)
      setForm((prev) => ({ ...prev, quote_date: today }))
    } else {
      resetForm()
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    const payload = {
      customer_name: form.customer_name,
      project_name: form.project_name,
      distributor_name: form.distributor_name || null,
      quote_date: form.quote_date || new Date().toISOString().slice(0, 10),
      notes: form.notes || null,
      status: "Draft" as QuoteStatus,
    }

    const { data, error } = await supabase.from("quotes").insert([payload]).select().single()

    if (error) {
      setSubmitError(error.message)
      setIsSubmitting(false)
      return
    }

    if (data) {
      setQuotes((prev) => [data as QuoteHeader, ...prev])
      handleOpenModal(false)
      resetForm()
    }

    setIsSubmitting(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Create and manage curtain quotes.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={handleOpenModal}>
          <DialogTrigger asChild>
            <Button>New Quote</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Quote</DialogTitle>
              <DialogDescription>Create a new quote header.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid gap-2">
                <Label htmlFor="customer_name">Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  required
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Customer name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project_name">Project Name</Label>
                <Input
                  id="project_name"
                  name="project_name"
                  required
                  value={form.project_name}
                  onChange={handleChange}
                  placeholder="Project name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="distributor_name">Distributor</Label>
                <Input
                  id="distributor_name"
                  name="distributor_name"
                  value={form.distributor_name}
                  onChange={handleChange}
                  placeholder="Distributor name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quote_date">Date</Label>
                <Input
                  id="quote_date"
                  name="quote_date"
                  type="date"
                  value={form.quote_date}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional notes (optional)"
                />
              </div>
              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create Quote"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium text-slate-700">Quotes list</p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">Loading quotes...</div>
          ) : error ? (
            <div className="px-4 py-10 text-center text-sm text-red-600">Error: {error}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Quote Code</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Distributor</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No quotes yet. Create your first quote.
                    </td>
                  </tr>
                ) : (
                  quotes.map((quote) => (
                    <tr key={quote.id} className="border-t">
                      <td className="px-4 py-3 font-mono text-sm text-slate-700">{quote.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3">{quote.customer_name}</td>
                      <td className="px-4 py-3">{quote.project_name}</td>
                      <td className="px-4 py-3">{quote.distributor_name || "—"}</td>
                      <td className="px-4 py-3">
                        {quote.quote_date || quote.created_at
                          ? new Date(quote.quote_date ?? quote.created_at).toLocaleDateString()
                          : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                            quote.status === "Draft" && "bg-slate-100 text-slate-800",
                            quote.status === "Sent" && "bg-blue-100 text-blue-800",
                            quote.status === "Approved" && "bg-green-100 text-green-800",
                            quote.status === "Rejected" && "bg-red-100 text-red-800",
                          )}
                        >
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

