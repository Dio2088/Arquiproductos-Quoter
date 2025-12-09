"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type QuoteStatus = "Draft" | "Sent" | "Approved" | "Rejected"

type QuoteHeader = {
  id: string
  customer_name: string
  project_name: string
  distributor_name: string | null
  quote_date: string | null
  status: QuoteStatus
  notes: string | null
  created_at: string
}

type QuoteItem = {
  id: string
  quote_id: string
  area: string | null
  room: string | null
  window_id?: string | null
  collection: string | null
  fabric_code: string | null
  fabric_color: string | null
  system_type: string | null
  width: number | null
  height: number | null
  width_m?: number | null
  height_m?: number | null
  quantity: number
  notes: string | null
  created_at: string
}

type FabricRow = {
  id: string
  color_name: string
  code: string
  collection: string
  system_code: string | null
}

type ProductRow = {
  id: string
  name: string
  code: string
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id?: string | string[] }>()
  const quoteId = Array.isArray(id) ? id[0] : id
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [quote, setQuote] = useState<QuoteHeader | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null)

  const [isItemsLoading, setIsItemsLoading] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)
  const [itemSubmitError, setItemSubmitError] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({
    area: "",
    room: "",
    fabric_code: "",
    fabric_color: "",
    system_type: "",
    system_product_id: "",
    fabric_id: "",
    collection: "",
    width: "",
    height: "",
    quantity: "1",
    notes: "",
  })
  const [fabricCatalog, setFabricCatalog] = useState<FabricRow[]>([])
  const [productList, setProductList] = useState<ProductRow[]>([])
  const [isFabricLoading, setIsFabricLoading] = useState(false)
  const [fabricError, setFabricError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [allowedFabricIds, setAllowedFabricIds] = useState<string[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [collectionOptions, setCollectionOptions] = useState<string[]>([])
  const [colorOptions, setColorOptions] = useState<FabricRow[]>([])
  const [colorsLoading, setColorsLoading] = useState(false)
  const [colorsError, setColorsError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuote() {
      if (!quoteId) {
        setError("Quote id is missing")
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.from("quotes").select("*").eq("id", quoteId).single()
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      setQuote(data as QuoteHeader)
      setIsLoading(false)
    }

    async function loadItems() {
      if (!quoteId) {
        setItemsError("Quote id is missing")
        setIsItemsLoading(false)
        return
      }
      setItemsError(null)
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })

      if (error) {
        setItemsError(error.message)
      } else {
        setItems((data as QuoteItem[]) || [])
      }
      setIsItemsLoading(false)
    }

    void loadQuote()
    void loadItems()
  }, [quoteId, supabase])

  const shortCode = quote?.id ? quote.id.slice(0, 8).toUpperCase() : ""
  const dateString =
    quote?.quote_date || quote?.created_at ? new Date(quote.quote_date ?? quote.created_at).toLocaleDateString() : ""

  function statusClasses(status: QuoteStatus) {
    return cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
      status === "Draft" && "bg-slate-100 text-slate-800",
      status === "Sent" && "bg-blue-100 text-blue-800",
      status === "Approved" && "bg-green-100 text-green-800",
      status === "Rejected" && "bg-red-100 text-red-800",
    )
  }

  function resetItemForm() {
    setItemForm({
      area: "",
      room: "",
      fabric_code: "",
      fabric_color: "",
      system_type: "",
      system_product_id: "",
      fabric_id: "",
      collection: "",
      width: "",
      height: "",
      quantity: "1",
      notes: "",
    })
    setItemSubmitError(null)
    setEditingItem(null)
  }

  function handleItemChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setItemForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSaveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!quoteId) {
      setItemSubmitError("Quote id is missing")
      return
    }

    const required = [
      itemForm.area,
      itemForm.room,
      itemForm.system_product_id,
      itemForm.collection,
      itemForm.fabric_id,
      itemForm.fabric_color,
      itemForm.fabric_code,
      itemForm.quantity,
      itemForm.width,
      itemForm.height,
    ]
    if (required.some((v) => !v || v.toString().trim() === "")) {
      setItemSubmitError("All fields are required.")
      return
    }

    const widthNum = Number(itemForm.width)
    const heightNum = Number(itemForm.height)
    const quantityNum = Number(itemForm.quantity)

    if ([widthNum, heightNum, quantityNum].some((n) => Number.isNaN(n))) {
      setItemSubmitError("Width, height, and quantity must be valid numbers.")
      return
    }

    setIsSubmittingItem(true)
    setItemSubmitError(null)

    const payload = {
      quote_id: quoteId,
      area: itemForm.area,
      window_id: itemForm.room,
      system_type: itemForm.system_type,
      collection: itemForm.collection,
      fabric_color: itemForm.fabric_color,
      fabric_code: itemForm.fabric_code,
      quantity: quantityNum,
      width: widthNum,
      height: heightNum,
      width_m: widthNum / 1000,
      height_m: heightNum / 1000,
      notes: itemForm.notes,
    }

    if (editingItem) {
      const { error } = await supabase.from("quote_items").update(payload).eq("id", editingItem.id)
      if (error) {
        setItemSubmitError(error.message)
        setIsSubmittingItem(false)
        return
      }
      setItems((prev) => prev.map((it) => (it.id === editingItem.id ? { ...it, ...payload } as QuoteItem : it)))
    } else {
      const { data, error } = await supabase.from("quote_items").insert([payload]).select().single()
      if (error) {
        setItemSubmitError(error.message)
        setIsSubmittingItem(false)
        return
      }
      if (data) setItems((prev) => [data as QuoteItem, ...prev])
    }

    setIsItemModalOpen(false)
    resetItemForm()
    setIsSubmittingItem(false)
  }

  async function ensureFabricCatalog() {
    if (fabricCatalog.length > 0 || isFabricLoading) return
    setIsFabricLoading(true)
    setFabricError(null)
    const { data, error } = await supabase.from("fabrics").select("id, color_name, code, collection, system_code")
    if (error) {
      setFabricError(error.message)
    } else {
      setFabricCatalog((data as FabricRow[]) || [])
    }
    setIsFabricLoading(false)
  }

  async function ensureProducts() {
    if (productList.length > 0) return
    setProductError(null)
    const { data, error } = await supabase.from("products").select("id, name, code").order("name", { ascending: true })
    if (error) {
      setProductError(error.message)
    } else {
      setProductList((data as ProductRow[]) || [])
    }
  }

  async function loadCollectionsForSystem(productId: string) {
    if (!productId) return
    setCollectionsLoading(true)
    setCollectionsError(null)

    const { data: pfRows, error: pfError } = await supabase
      .from("product_fabrics")
      .select("fabric_id")
      .eq("product_id", productId)

    if (pfError) {
      setCollectionsError(pfError.message)
      setCollectionsLoading(false)
      return
    }

    const fabricIds = (pfRows?.map((r: { fabric_id: string }) => r.fabric_id) || []).filter(Boolean)
    setAllowedFabricIds(fabricIds)
    if (fabricIds.length === 0) {
      setCollectionOptions([])
      setCollectionsLoading(false)
      return
    }

    const { data: fabricsForProduct, error: fabricsError } = await supabase
      .from("fabrics")
      .select("id, collection")
      .in("id", fabricIds)

    if (fabricsError) {
      setCollectionsError(fabricsError.message)
      setCollectionOptions([])
      setCollectionsLoading(false)
      return
    }

    const collections = Array.from(
      new Set((fabricsForProduct || []).map((f: { collection: string }) => f.collection).filter(Boolean)),
    ).sort()
    setCollectionOptions(collections)
    setCollectionsLoading(false)
  }

  const availableFabrics = useMemo(() => {
    if (!itemForm.system_type) return []
    const filtered = fabricCatalog.filter((row) => row.system_code === itemForm.system_type)
    if (allowedFabricIds.length === 0) return filtered
    return filtered.filter((row) => allowedFabricIds.includes(row.id))
  }, [allowedFabricIds, fabricCatalog, itemForm.system_type])

  const collections = collectionOptions

  const colorsForSelection = useMemo(() => {
    if (!itemForm.system_type || !itemForm.collection) return []
    return colorOptions
  }, [colorOptions, itemForm.collection, itemForm.system_type])

  async function loadColorsForSelection(productId: string, collectionName: string) {
    if (!productId || !collectionName) {
      setColorOptions([])
      return
    }
    setColorsLoading(true)
    setColorsError(null)
    // Primero obtener los fabric_id relacionados al producto
    const { data: pfRows, error: pfError } = await supabase
      .from("product_fabrics")
      .select("fabric_id")
      .eq("product_id", productId)

    if (pfError) {
      setColorsError(pfError.message)
      setColorOptions([])
      setColorsLoading(false)
      return
    }

    const fabricIds = (pfRows?.map((r: { fabric_id: string }) => r.fabric_id) || []).filter(Boolean)
    if (fabricIds.length === 0) {
      setColorOptions([])
      setColorsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("fabrics")
      .select("id, color_name, code, collection")
      .in("id", fabricIds)
      .eq("collection", collectionName)
      .order("color_name", { ascending: true })

    if (error) {
      setColorsError(error.message)
      setColorOptions([])
    } else {
      setColorOptions((data as FabricRow[]) || [])
    }
    setColorsLoading(false)
  }

  function handleSystemChange(productId: string) {
    const match = productList.find((p) => p.id === productId)
    setItemForm((prev) => ({
      ...prev,
      system_type: match?.code ?? "",
      system_product_id: productId,
      fabric_id: "",
      collection: "",
      fabric_color: "",
      fabric_code: "",
    }))
    setAllowedFabricIds([])
    setCollectionsError(null)
    setCollectionOptions([])
    setColorOptions([])
    setColorsError(null)
    void loadCollectionsForSystem(productId)
  }

  function handleCollectionChange(value: string) {
    setItemForm((prev) => ({
      ...prev,
      fabric_id: "",
      collection: value,
      fabric_color: "",
      fabric_code: "",
    }))
    setColorOptions([])
    setColorsError(null)
    if (itemForm.system_product_id && value) {
      void loadColorsForSelection(itemForm.system_product_id, value)
    }
  }

  function handleColorChange(value: string) {
    const match = colorsForSelection.find((row) => row.id === value)
    setItemForm((prev) => ({
      ...prev,
      fabric_id: value,
      fabric_color: match?.color_name ?? "",
      fabric_code: match?.code ?? "",
    }))
  }

  function openCreateModal() {
    resetItemForm()
    setEditingItem(null)
    setIsItemModalOpen(true)
    void ensureFabricCatalog()
    void ensureProducts()
  }

  function openEditModal(item: QuoteItem) {
    setEditingItem(item)
    setItemForm({
      area: item.area || "",
      room: item.window_id || "",
      fabric_code: item.fabric_code || "",
      fabric_color: item.fabric_color || "",
      system_type: item.system_type || "",
      system_product_id: "", // we don't have product id; keep empty
      fabric_id: "",
      collection: item.collection || "",
      width: item.width?.toString() || "",
      height: item.height?.toString() || "",
      quantity: item.quantity?.toString() || "1",
      notes: item.notes || "",
    })
    setIsItemModalOpen(true)
    void ensureFabricCatalog()
    void ensureProducts()
  }

  async function handleDeleteItem(itemId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this item?")
    if (!confirmed) return
    const { error } = await supabase.from("quote_items").delete().eq("id", itemId)
    if (error) {
      setItemsError(error.message)
      return
    }
    setItems((prev) => prev.filter((it) => it.id !== itemId))
  }

  async function handleDeleteQuote() {
    if (!id) return
    setDeleteError(null)
    const confirmed = window.confirm("Are you sure you want to delete this quote? This cannot be undone.")
    if (!confirmed) return

    const { error } = await supabase.from("quotes").delete().eq("id", id)
    if (error) {
      setDeleteError(error.message)
      return
    }
    router.push("/dashboard/quotes")
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard/quotes")}>
          Save and Close
        </Button>
        <div className="flex items-center gap-3">
          {quote && <span className={statusClasses(quote.status)}>{quote.status}</span>}
          <Button variant="destructive" onClick={handleDeleteQuote}>
            Delete quote
          </Button>
        </div>
      </div>
      {deleteError && <p className="text-sm text-red-600">Error deleting quote: {deleteError}</p>}

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h1 className="text-xl font-semibold">Quote {shortCode}</h1>
          <p className="text-sm text-muted-foreground">Main details</p>
        </div>
        <div className="grid gap-4 px-4 py-6 md:grid-cols-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading quote...</p>
          ) : error ? (
            <p className="text-sm text-red-600">Error: {error}</p>
          ) : !quote ? (
            <p className="text-sm text-muted-foreground">Quote not found.</p>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Client</p>
                <p className="text-sm font-medium text-slate-900">{quote.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Project</p>
                <p className="text-sm font-medium text-slate-900">{quote.project_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Distributor</p>
                <p className="text-sm font-medium text-slate-900">{quote.distributor_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Date</p>
                <p className="text-sm font-medium text-slate-900">{dateString}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Status</p>
                <span className={statusClasses(quote.status)}>{quote.status}</span>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase">Notes</p>
                <p className="text-sm font-medium text-slate-900">{quote.notes || "No notes"}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Quote items will be managed here in the next step.</p>
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Quote Items</h2>
            <p className="text-sm text-muted-foreground">Manage the items of this quote.</p>
          </div>
          <Dialog
            open={isItemModalOpen}
            onOpenChange={(open) => {
              setIsItemModalOpen(open)
              if (open) {
                void ensureFabricCatalog()
                void ensureProducts()
              } else {
                resetItemForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateModal}>Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Quote Item" : "Add Quote Item"}</DialogTitle>
                <DialogDescription>Provide the item details.</DialogDescription>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSaveItem}>
                <div className="grid gap-2">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    name="area"
                    value={itemForm.area}
                    onChange={handleItemChange}
                    placeholder="Area"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="room">Window ID</Label>
                  <Input
                    id="room"
                    name="room"
                    value={itemForm.room}
                    onChange={handleItemChange}
                    placeholder="Window identifier"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="system_type">System type</Label>
                  <select
                    id="system_type"
                    name="system_type"
                    value={itemForm.system_product_id}
                    onChange={(e) => handleSystemChange(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-1"
                    required
                  >
                    <option value="">Select system</option>
                    {productList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="collection">Collection</Label>
                  <select
                    id="collection"
                    name="collection"
                    value={itemForm.collection}
                    onChange={(e) => handleCollectionChange(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-1"
                    disabled={!itemForm.system_product_id || collectionsLoading || collectionOptions.length === 0}
                    required
                  >
                    <option value="">Select collection</option>
                    {collections.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fabric_color">Fabric color</Label>
                  <select
                    id="fabric_color"
                    name="fabric_color"
                    value={itemForm.fabric_id}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-1"
                    disabled={
                      !itemForm.system_product_id || !itemForm.collection || colorsLoading || colorOptions.length === 0
                    }
                    required
                  >
                    <option value="">Select color</option>
                    {colorsForSelection.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.color_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fabric_code">Fabric code</Label>
                  <Input
                    id="fabric_code"
                    name="fabric_code"
                    value={itemForm.fabric_code}
                    readOnly
                    placeholder="Select system, collection and color"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    value={itemForm.quantity}
                    onChange={handleItemChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      name="width"
                      type="number"
                      step="0.01"
                      value={itemForm.width}
                      onChange={handleItemChange}
                      placeholder="Width (mm)"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      step="0.01"
                      value={itemForm.height}
                      onChange={handleItemChange}
                      placeholder="Height (mm)"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={itemForm.notes}
                    onChange={handleItemChange}
                    placeholder="Additional notes"
                    rows={3}
                    required
                  />
                </div>
                {itemSubmitError && <p className="text-sm text-red-600">{itemSubmitError}</p>}
                <DialogFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingItem}>
                    {isSubmittingItem ? "Saving..." : "Create Item"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          {isItemsLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading items...</div>
          ) : itemsError ? (
            <div className="px-4 py-6 text-center text-sm text-red-600">Error: {itemsError}</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No items yet. Add your first item.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">Window ID</th>
                  <th className="px-4 py-3 font-semibold">System</th>
                  <th className="px-4 py-3 font-semibold">Collection</th>
                  <th className="px-4 py-3 font-semibold">Color</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Measures</th>
                  <th className="px-4 py-3 font-semibold">Unit Price</th>
                  <th className="px-4 py-3 font-semibold">Total Price</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">{item.area || "—"}</td>
                    <td className="px-4 py-3">{item.room || item.window_id || "—"}</td>
                    <td className="px-4 py-3">{item.system_type || "—"}</td>
                    <td className="px-4 py-3">{item.collection || "—"}</td>
                    <td className="px-4 py-3">{item.fabric_color || "—"}</td>
                    <td className="px-4 py-3">{item.fabric_code || "—"}</td>
                    <td className="px-4 py-3">{item.quantity ?? "—"}</td>
                    <td className="px-4 py-3">
                      {item.width != null && item.height != null ? `${item.width} x ${item.height}` : "—"}
                    </td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

