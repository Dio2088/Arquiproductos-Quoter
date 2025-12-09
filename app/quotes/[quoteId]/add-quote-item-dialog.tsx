import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Props = {
  quoteId: string
  onCreated?: () => void
  onClose?: () => void
}

export function AddQuoteItemDialog({ quoteId, onCreated, onClose }: Props) {
  const supabase = createClient()

  const [widthMm, setWidthMm] = useState("")
  const [heightMm, setHeightMm] = useState("")
  const [area, setArea] = useState("")
  const [windowId, setWindowId] = useState("")
  const [systemType, setSystemType] = useState<string | null>(null)
  const [collection, setCollection] = useState<string | null>(null)
  const [fabricColor, setFabricColor] = useState<string | null>(null)
  const [fabricCode, setFabricCode] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sanitizeMm = (value: string) => value.replace(/\D/g, "").slice(0, 4)

  const handleSubmit = async () => {
    setError(null)

    if (
      !area ||
      !windowId ||
      !systemType ||
      !collection ||
      !fabricColor ||
      !fabricCode ||
      !widthMm ||
      !heightMm ||
      !notes
    ) {
      setError("All fields are required.")
      return
    }

    const widthVal = Number(widthMm)
    const heightVal = Number(heightMm)

    if (Number.isNaN(widthVal) || Number.isNaN(heightVal)) {
      setError("Width and Height must be valid numbers.")
      return
    }

    if (!Number.isFinite(widthVal) || !Number.isFinite(heightVal) || widthVal < 100 || heightVal < 100) {
      setError("Width and height must be at least 100 mm.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      quote_id: quoteId,
      area,
      window_id: windowId,
      system_type: systemType,
      collection,
      fabric_color: fabricColor,
      fabric_code: fabricCode,
      width: widthVal,
      height: heightVal,
      width_m: widthVal / 1000, // value in meters
      height_m: heightVal / 1000, // value in meters
      quantity: 1,
      notes,
    }

    const { error } = await supabase.from("quote_items").insert(payload).select()

    setIsSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    onCreated?.()
    onClose?.()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Quote Item</DialogTitle>
          <DialogDescription>Provide the item details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="area">Area</Label>
            <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="window">Window ID</Label>
            <Input
              id="window"
              value={windowId}
              onChange={(e) => setWindowId(e.target.value)}
              placeholder="Window identifier"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width-mm" className="mb-1 block">
                Width
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="width-mm"
                  value={widthMm}
                  onChange={(e) => setWidthMm(sanitizeMm(e.target.value))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>
            <div>
              <Label htmlFor="height-mm" className="mb-1 block">
                Height
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="height-mm"
                  value={heightMm}
                  onChange={(e) => setHeightMm(sanitizeMm(e.target.value))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>
          </div>

          {/* Otros campos (systemType, collection, fabricColor/code, notes...) se asumirían aquí */}

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

