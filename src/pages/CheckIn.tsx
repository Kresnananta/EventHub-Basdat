import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useEventContext } from "@/context/EventContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, Camera, CheckCircle2, Loader2, QrCode, Search, Ticket, XCircle } from "lucide-react"

type BarcodeDetectorResult = {
  rawValue: string
}

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<BarcodeDetectorResult[]>
}

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance

type BrowserWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor
}

type RuntimeSingleQuery<T> = {
  single: () => Promise<{ data: T | null; error: unknown }>
}

type RuntimeFilterQuery<T> = RuntimeSingleQuery<T> & {
  eq: (column: string, value: string) => RuntimeFilterQuery<T>
  or: (filters: string) => RuntimeFilterQuery<T>
}

type RuntimeUpdateQuery<T> = {
  eq: (column: string, value: string) => Promise<{ data: T | null; error: unknown }>
}

type RuntimeTableQuery<T> = {
  select: (columns: string) => RuntimeFilterQuery<T>
  update: (values: Record<string, string | null>) => RuntimeUpdateQuery<T>
}

type RuntimeSupabase = {
  from: <T>(table: string) => RuntimeTableQuery<T>
}

type NestedProfile = {
  full_name: string | null
  phone: string | null
} | null

type NestedOrder = {
  status: string
  total_amount: number
} | null

type NestedTicketTier = {
  name: string | null
  event_id: string
  events: {
    id: string
    title: string
    starts_at: string
    location: string | null
  } | null
} | null

type TicketLookupRow = {
  id: string
  ticket_code: string
  status: string
  checked_in_at: string | null
  profiles: NestedProfile
  orders: NestedOrder
  ticket_tiers: NestedTicketTier
}

type CheckInState = "idle" | "valid" | "checked-in" | "warning" | "error"

type TicketResult = {
  state: CheckInState
  message: string
  ticket: TicketLookupRow | null
}

const runtimeSupabase = supabase as unknown as RuntimeSupabase

function extractTicketCode(rawValue: string) {
  const value = rawValue.trim()

  try {
    const url = new URL(value)
    return url.searchParams.get("ticket_code") || url.searchParams.get("code") || url.pathname.split("/").filter(Boolean).pop() || value
  } catch {
    return value
  }
}

function isPaidOrder(status?: string) {
  const normalizedStatus = status?.toLowerCase()
  return normalizedStatus === "paid" || normalizedStatus === "completed"
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "-"

  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getResultClass(state: CheckInState) {
  if (state === "valid") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (state === "checked-in") return "border-blue-200 bg-blue-50 text-blue-800"
  if (state === "warning") return "border-amber-200 bg-amber-50 text-amber-800"
  if (state === "error") return "border-red-200 bg-red-50 text-red-800"
  return "border-border bg-muted/40 text-muted-foreground"
}

function getStatusBadge(ticket: TicketLookupRow) {
  if (ticket.checked_in_at || ticket.status === "used") {
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Used</Badge>
  }

  if (ticket.status === "active") {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Ready</Badge>
  }

  return <Badge variant="secondary">{ticket.status}</Badge>
}

export function CheckIn() {
  const { selectedEventId, selectedEventName } = useEventContext()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerFrameRef = useRef<number | null>(null)
  const lastScannedRef = useRef("")

  const [ticketCode, setTicketCode] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerMessage, setScannerMessage] = useState("")
  const [result, setResult] = useState<TicketResult>({
    state: "idle",
    message: "Scan QR pembeli atau masukkan kode tiket secara manual.",
    ticket: null,
  })

  async function lookupTicket(rawCode = ticketCode) {
    const code = extractTicketCode(rawCode)

    if (!code) {
      setResult({
        state: "warning",
        message: "Masukkan kode tiket atau scan QR terlebih dahulu.",
        ticket: null,
      })
      return
    }

    setTicketCode(code)
    setLookupLoading(true)

    const { data, error } = await runtimeSupabase
      .from<TicketLookupRow>("tickets")
      .select(`
        id,
        ticket_code,
        status,
        checked_in_at,
        profiles ( full_name, phone ),
        orders ( status, total_amount ),
        ticket_tiers (
          name,
          event_id,
          events ( id, title, starts_at, location )
        )
      `)
      .or(`ticket_code.eq.${code},id.eq.${code}`)
      .single()

    setLookupLoading(false)

    if (error || !data) {
      setResult({
        state: "error",
        message: "Tiket tidak ditemukan. Pastikan QR/kode tiket benar.",
        ticket: null,
      })
      return
    }

    const ticketEventId = data.ticket_tiers?.event_id || data.ticket_tiers?.events?.id

    if (selectedEventId && ticketEventId !== selectedEventId) {
      setResult({
        state: "warning",
        message: `Tiket ini bukan untuk event "${selectedEventName}".`,
        ticket: data,
      })
      return
    }

    if (!isPaidOrder(data.orders?.status)) {
      setResult({
        state: "warning",
        message: "Order tiket ini belum paid/completed.",
        ticket: data,
      })
      return
    }

    if (data.checked_in_at || data.status === "used") {
      setResult({
        state: "checked-in",
        message: `Tiket sudah pernah check-in pada ${formatDateTime(data.checked_in_at)}.`,
        ticket: data,
      })
      return
    }

    if (data.status !== "active") {
      setResult({
        state: "warning",
        message: `Status tiket "${data.status}" tidak bisa check-in.`,
        ticket: data,
      })
      return
    }

    setResult({
      state: "valid",
      message: "Tiket valid. Konfirmasi untuk check-in pembeli.",
      ticket: data,
    })
  }

  async function confirmCheckIn() {
    if (!result.ticket || result.state !== "valid") return

    setCheckInLoading(true)
    const checkedInAt = new Date().toISOString()
    const { error } = await runtimeSupabase
      .from<TicketLookupRow>("tickets")
      .update({
        status: "used",
        checked_in_at: checkedInAt,
      })
      .eq("id", result.ticket.id)

    setCheckInLoading(false)

    if (error) {
      setResult({
        ...result,
        state: "error",
        message: "Check-in gagal. Coba ulangi atau cek koneksi.",
      })
      return
    }

    setResult({
      state: "checked-in",
      message: "Check-in berhasil.",
      ticket: {
        ...result.ticket,
        status: "used",
        checked_in_at: checkedInAt,
      },
    })
  }

  async function startScanner() {
    const browserWindow = window as BrowserWithBarcodeDetector

    if (!browserWindow.BarcodeDetector) {
      setScannerMessage("Scanner kamera belum didukung browser ini. Gunakan input manual.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setScannerActive(true)
      setScannerMessage("Arahkan kamera ke QR tiket pembeli.")

      const detector = new browserWindow.BarcodeDetector({ formats: ["qr_code"] })

      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return

        try {
          const codes = await detector.detect(videoRef.current)
          const scannedValue = codes[0]?.rawValue

          if (scannedValue && scannedValue !== lastScannedRef.current) {
            lastScannedRef.current = scannedValue
            stopScanner()
            await lookupTicket(scannedValue)
            return
          }
        } catch (error) {
          console.error("QR scan failed:", error)
        }

        scannerFrameRef.current = window.requestAnimationFrame(scan)
      }

      scannerFrameRef.current = window.requestAnimationFrame(scan)
    } catch (error) {
      console.error("Unable to start scanner:", error)
      setScannerMessage("Tidak bisa mengakses kamera. Cek izin kamera atau gunakan input manual.")
      stopScanner()
    }
  }

  function stopScanner() {
    if (scannerFrameRef.current) {
      window.cancelAnimationFrame(scannerFrameRef.current)
      scannerFrameRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScannerActive(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  function resetForNextScan() {
    setTicketCode("")
    lastScannedRef.current = ""
    setResult({
      state: "idle",
      message: "Scan QR pembeli atau masukkan kode tiket secara manual.",
      ticket: null,
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Check-in Gate</h2>
        <p className="text-muted-foreground">
          Scan QR pembeli dan validasi tiket untuk event {selectedEventId ? selectedEventName : "yang dipilih"}.
        </p>
      </div>

      {!selectedEventId && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Pilih event di sidebar agar scanner menolak tiket dari event lain.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" />
              QR Scanner
            </CardTitle>
            <CardDescription>Gunakan kamera gate atau input manual saat kamera tidak tersedia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-border bg-black">
              <video
                ref={videoRef}
                className="aspect-video w-full object-cover"
                muted
                playsInline
              />
            </div>

            {scannerMessage && (
              <p className="text-sm text-muted-foreground">{scannerMessage}</p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="gap-2"
                onClick={() => void startScanner()}
                disabled={scannerActive}
              >
                <Camera size={16} />
                Start Scanner
              </Button>
              <Button
                variant="outline"
                onClick={stopScanner}
                disabled={!scannerActive}
              >
                Stop
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={ticketCode}
                  onChange={(event) => setTicketCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void lookupTicket()
                    }
                  }}
                  placeholder="Ticket code / ticket id"
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => void lookupTicket()}
                disabled={lookupLoading}
              >
                {lookupLoading ? <Loader2 className="animate-spin" size={16} /> : "Check"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Validation Result</CardTitle>
            <CardDescription>Review detail tiket sebelum konfirmasi check-in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-lg border p-4 text-sm font-medium ${getResultClass(result.state)}`}>
              {result.state === "valid" && <CheckCircle2 className="mb-2 h-5 w-5" />}
              {result.state === "checked-in" && <CheckCircle2 className="mb-2 h-5 w-5" />}
              {result.state === "warning" && <AlertCircle className="mb-2 h-5 w-5" />}
              {result.state === "error" && <XCircle className="mb-2 h-5 w-5" />}
              {result.message}
            </div>

            {result.ticket && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Attendee</p>
                    <p className="font-semibold text-foreground">{result.ticket.profiles?.full_name || "Unknown Attendee"}</p>
                    <p className="text-sm text-muted-foreground">{result.ticket.profiles?.phone || "-"}</p>
                  </div>
                  {getStatusBadge(result.ticket)}
                </div>

                <div className="grid gap-3 rounded-lg border border-border p-4 text-sm">
                  <DetailRow label="Ticket Code" value={result.ticket.ticket_code} mono />
                  <DetailRow label="Event" value={result.ticket.ticket_tiers?.events?.title || "-"} />
                  <DetailRow label="Ticket Type" value={result.ticket.ticket_tiers?.name || "-"} />
                  <DetailRow label="Event Date" value={formatDateTime(result.ticket.ticket_tiers?.events?.starts_at || null)} />
                  <DetailRow label="Order Status" value={result.ticket.orders?.status || "-"} />
                  <DetailRow label="Checked In" value={formatDateTime(result.ticket.checked_in_at)} />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => void confirmCheckIn()}
                    disabled={result.state !== "valid" || checkInLoading}
                  >
                    {checkInLoading ? <Loader2 className="animate-spin" size={16} /> : <Ticket size={16} />}
                    Confirm Check-in
                  </Button>
                  <Button variant="outline" onClick={resetForNextScan}>
                    Next Ticket
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono font-medium text-foreground break-all" : "font-medium text-foreground"}>
        {value}
      </span>
    </div>
  )
}
