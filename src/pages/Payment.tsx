import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Smartphone,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'

type PaymentMethod = 'bank_transfer' | 'e_wallet' | 'card'

type PaymentOrder = {
  id: string
  buyer_id: string
  event_id: string
  total_amount: number
  currency: string
  status: string
  payment_method: string | null
  payment_ref: string | null
  paid_at: string | null
  expires_at: string | null
  created_at: string
  events: {
    title: string
    starts_at: string
    venue: {
      name: string | null
      city: string | null
    } | null
  } | null
}

const PAYMENT_WINDOW_MINUTES = 10

type TicketRow = {
  order_id: string
}

type RuntimeTableQuery<T> = {
  select: (columns: string) => RuntimeTableQuery<T>
  eq: (column: string, value: string) => Promise<{ data: T[] | null; error: unknown }>
}

type RuntimeSupabase = {
  from: <T>(table: string) => RuntimeTableQuery<T>
}

const runtimeSupabase = supabase as unknown as RuntimeSupabase

const paymentMethods: Array<{
  id: PaymentMethod
  title: string
  description: string
  icon: typeof Banknote
}> = [
  {
    id: 'bank_transfer',
    title: 'Bank Transfer',
    description: 'Use a demo virtual account number.',
    icon: Banknote,
  },
  {
    id: 'e_wallet',
    title: 'E-Wallet',
    description: 'Simulate payment from a digital wallet.',
    icon: Smartphone,
  },
  {
    id: 'card',
    title: 'Card',
    description: 'Use the sandbox card confirmation.',
    icon: CreditCard,
  },
]

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('id-ID')}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeLeft(milliseconds: number) {
  const safeMs = Math.max(0, milliseconds)
  const minutes = Math.floor(safeMs / 60000)
  const seconds = Math.floor((safeMs % 60000) / 1000)

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function getDemoExpiry(order: PaymentOrder) {
  return new Date(order.created_at).getTime() + PAYMENT_WINDOW_MINUTES * 60 * 1000
}

function buildPaymentRef(method: PaymentMethod, orderId: string) {
  const prefix = method === 'bank_transfer' ? 'SIM-BANK' : method === 'e_wallet' ? 'SIM-WALLET' : 'SIM-CARD'
  return `${prefix}-${orderId.slice(0, 8).toUpperCase()}`
}

function isMissingRpcError(error: unknown) {
  if (!error || typeof error !== 'object' || !('message' in error)) return false

  const message = String((error as { message?: unknown }).message).toLowerCase()
  return message.includes('could not find the function') || message.includes('does not exist')
}

function getPaymentInstruction(method: PaymentMethod, orderId: string) {
  const shortOrderId = orderId.slice(0, 8).toUpperCase()

  if (method === 'bank_transfer') {
    return {
      label: 'Virtual Account',
      value: `8808 10${shortOrderId}`,
      note: 'Transfer the exact total amount to this demo virtual account.',
    }
  }

  if (method === 'e_wallet') {
    return {
      label: 'Demo Wallet Ref',
      value: `EWALLET-${shortOrderId}`,
      note: 'Open your wallet app and use this reference in the simulated payment screen.',
    }
  }

  return {
    label: 'Sandbox Card',
    value: '4242 4242 4242 4242',
    note: 'Use any future expiry date and any 3 digit CVV for the demo.',
  }
}

export function Payment() {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const { session, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [ticketCount, setTicketCount] = useState<number | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bank_transfer')
  const [loading, setLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login')
    }
  }, [authLoading, navigate, session])

  useEffect(() => {
    async function fetchOrder() {
      if (!session?.user?.id || !orderId) return

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          buyer_id,
          event_id,
          total_amount,
          currency,
          status,
          payment_method,
          payment_ref,
          paid_at,
          expires_at,
          created_at,
          events (
            title,
            starts_at,
            venue:venues!events_venue_id_fkey (
              name,
              city
            )
          )
        `)
        .eq('id', orderId)
        .eq('buyer_id', session.user.id)
        .single()

      if (error || !data) {
        console.error('Failed to load payment order:', error)
        setOrder(null)
        setTicketCount(null)
        setErrorMessage('Payment order was not found.')
        setLoading(false)
        return
      }

      const ticketsRes = await runtimeSupabase
        .from<TicketRow>('tickets')
        .select('order_id')
        .eq('order_id', data.id)

      if (ticketsRes.error) {
        console.error('Failed to load ticket count:', ticketsRes.error)
      }

      setOrder(data as unknown as PaymentOrder)
      setTicketCount(ticketsRes.data?.length ?? null)
      setLoading(false)
    }

    void fetchOrder()
  }, [orderId, session?.user?.id])

  const isAwaitingDemoPayment = Boolean(order && order.status === 'paid' && !order.payment_ref && !order.payment_method)
  const effectiveStatus = isAwaitingDemoPayment ? 'pending' : order?.status
  const expiresAt = order
    ? isAwaitingDemoPayment
      ? getDemoExpiry(order)
      : order.expires_at
        ? new Date(order.expires_at).getTime()
        : null
    : null
  const timeLeftMs = expiresAt ? expiresAt - now : 0
  const isExpired = effectiveStatus === 'pending' && expiresAt !== null && timeLeftMs <= 0
  const isPaid = effectiveStatus === 'paid'
  const canConfirm = Boolean(order && effectiveStatus === 'pending' && !isExpired)
  const selectedInstruction = useMemo(
    () => (order ? getPaymentInstruction(selectedMethod, order.id) : null),
    [order, selectedMethod]
  )

  const cancelExpiredOrder = async () => {
    if (!order || order.status !== 'pending') return

    setIsConfirming(true)
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('buyer_id', order.buyer_id)
      .eq('status', 'pending')

    if (error) {
      console.error('Failed to cancel expired order:', error)
      setErrorMessage('Could not cancel this expired order. Please try again.')
    } else {
      setOrder({ ...order, status: 'cancelled' })
    }

    setIsConfirming(false)
  }

  const confirmDemoPayment = async () => {
    if (!order || !canConfirm) return

    setIsConfirming(true)
    setErrorMessage('')

    const confirmedAt = new Date().toISOString()
    const { data: rpcData, error: rpcError } = await supabase.rpc('confirm_demo_payment', {
      p_order_id: order.id,
      p_payment_method: selectedMethod,
    })

    if (!rpcError && rpcData) {
      setOrder({
        ...order,
        status: rpcData.status,
        payment_method: rpcData.payment_method,
        payment_ref: rpcData.payment_ref,
        paid_at: rpcData.paid_at,
        expires_at: rpcData.expires_at,
      })
      setIsConfirming(false)
      return
    }

    if (rpcError && !isMissingRpcError(rpcError)) {
      console.error('Failed to confirm demo payment:', rpcError)
      setErrorMessage(rpcError.message || 'Payment could not be confirmed. Please try again.')
      setIsConfirming(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_method: selectedMethod,
        payment_ref: buildPaymentRef(selectedMethod, order.id),
        paid_at: confirmedAt,
        updated_at: confirmedAt,
      })
      .eq('id', order.id)
      .eq('buyer_id', order.buyer_id)
      .in('status', ['pending', 'paid'])
      .select(`
        id,
        buyer_id,
        event_id,
        total_amount,
        currency,
        status,
        payment_method,
        payment_ref,
        paid_at,
        expires_at,
        created_at,
        events (
          title,
          starts_at,
          venue:venues!events_venue_id_fkey (
            name,
            city
          )
        )
      `)
      .single()

    if (error || !data) {
      console.error('Failed to confirm demo payment:', error)
      setErrorMessage('Payment could not be confirmed. Please try again.')
    } else {
      setOrder(data as unknown as PaymentOrder)
    }

    setIsConfirming(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 mx-auto flex w-full max-w-xl items-center px-4 py-12">
          <Card className="w-full border-border/50">
            <CardHeader>
              <CardTitle>Payment Not Found</CardTitle>
              <CardDescription>{errorMessage || 'This payment link is invalid or no longer available.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft size={16} />
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-3 gap-2 px-0 hover:bg-transparent">
              <ArrowLeft size={16} />
              Back to Events
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Complete Payment</h1>
            <p className="mt-2 text-muted-foreground">Finish this order now, or come back before the {PAYMENT_WINDOW_MINUTES} minute payment window ends.</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isPaid ? 'default' : effectiveStatus === 'pending' ? 'secondary' : 'destructive'}
              className={
                isPaid
                  ? 'bg-emerald-500 text-white hover:bg-emerald-500'
                  : effectiveStatus === 'pending'
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                    : 'bg-red-100 text-red-800 hover:bg-red-100'
              }
            >
              {effectiveStatus ? effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1) : '-'}
            </Badge>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {isPaid && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Payment confirmed. Your tickets are ready in My Tickets.
          </div>
        )}

        {isExpired && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            This payment window has expired. Cancel this order and create a new booking to continue.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select a demo method to reveal the payment instructions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    const selected = selectedMethod === method.id

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethod(method.id)}
                        disabled={!canConfirm}
                        className={`rounded-lg border bg-white p-4 text-left transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 ${
                          selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        }`}
                      >
                        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon size={20} />
                        </span>
                        <span className="block font-semibold text-foreground">{method.title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{method.description}</span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Demo Instructions</CardTitle>
                <CardDescription>No real money moves here. This confirms the order as paid for testing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {selectedInstruction && (
                  <div className="rounded-lg border border-border bg-white p-4">
                    <p className="text-sm font-medium text-muted-foreground">{selectedInstruction.label}</p>
                    <p className="mt-2 break-all font-mono text-2xl font-bold text-foreground">{selectedInstruction.value}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{selectedInstruction.note}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => void confirmDemoPayment()}
                    disabled={!canConfirm || isConfirming}
                    className="h-10 flex-1 gap-2"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Confirm Demo Payment
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="h-10 flex-1">
                    Pay Later
                  </Button>
                </div>

                {isExpired && (
                  <Button
                    variant="destructive"
                    onClick={() => void cancelExpiredOrder()}
                    disabled={isConfirming}
                    className="h-10 w-full"
                  >
                    Cancel Expired Order
                  </Button>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Order #{order.id.slice(0, 8).toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="mt-1 font-semibold text-foreground">{order.events?.title || 'Unknown Event'}</p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Schedule</p>
                  <p className="mt-1 font-medium text-foreground">
                    {order.events?.starts_at ? formatDate(order.events.starts_at) : '-'}
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="mt-1 font-medium text-foreground">
                    {order.events?.venue
                      ? [order.events.venue.name, order.events.venue.city].filter(Boolean).join(', ')
                      : 'TBA'}
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Tickets</p>
                  <p className="mt-1 font-medium text-foreground">{ticketCount ?? '-'} ticket{ticketCount === 1 ? '' : 's'}</p>
                </div>

                <div className="rounded-lg bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(order.total_amount, order.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} />
                  Payment Window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expiresAt ? (
                  <>
                    <div className={`rounded-lg border p-4 text-center ${isExpired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                      <p className={`font-mono text-3xl font-bold ${isExpired ? 'text-red-700' : 'text-amber-800'}`}>
                        {isPaid ? 'Paid' : formatTimeLeft(timeLeftMs)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isPaid ? 'Payment completed' : isExpired ? 'Expired' : 'Time remaining'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">Expires at {formatDate(new Date(expiresAt).toISOString())}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No expiration time was set for this order.</p>
                )}

                {order.payment_ref && (
                  <div className="border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">Payment Ref</p>
                    <p className="mt-1 break-all font-mono font-semibold text-foreground">{order.payment_ref}</p>
                  </div>
                )}

                {isPaid && (
                  <Button onClick={() => navigate('/my-tickets')} className="w-full">
                    View My Tickets
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
