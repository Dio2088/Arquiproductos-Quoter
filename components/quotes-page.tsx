"use client"

type Props = {
  status: string
}

export default function QuotesPage({ status }: Props) {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Quotes</h1>
      <p className="text-muted-foreground">Status filter: {status}</p>
      <p className="text-sm text-muted-foreground">This is a placeholder Quotes page component.</p>
    </div>
  )
}

