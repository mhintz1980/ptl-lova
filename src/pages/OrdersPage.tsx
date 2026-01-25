import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useOrdersData } from '../hooks/useOrdersData'
import { DigitalDNA } from '../components/orders/DigitalDNA'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Progress } from '../components/ui/Progress'
import { ChevronDown, ChevronRight, Search, SortAsc } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { DigitalDnaStrand } from '../types/dna'
import { cn } from '../lib/utils'

export function OrdersPage() {
  const { orders, loading } = useOrdersData()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')
  const [filterCustomer, setFilterCustomer] = useState<string | null>(null)

  // Expanded rows state: Set of PO IDs
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const toggleOrder = (poId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(poId)) {
      newExpanded.delete(poId)
    } else {
      newExpanded.add(poId)
    }
    setExpandedOrders(newExpanded)
  }

  // Derived state: Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // 1. Search (PO or Customer)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.poNumber.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q)
      )
    }

    // 2. Customer Filter
    if (filterCustomer) {
      result = result.filter((o) => o.customer === filterCustomer)
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
        return dateB - dateA // Newest first
      } else {
        // Status: Late first, then by progress
        if (a.isLate && !b.isLate) return -1
        if (!a.isLate && b.isLate) return 1
        return b.overallProgress - a.overallProgress
      }
    })

    return result
  }, [orders, search, filterCustomer, sortBy])

  // Unique customers for filter dropdown
  const customers = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.customer))).sort()
  }, [orders])

  if (loading) {
    return (
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Digital DNA visualization of purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PO or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Simple Sort Toggle for now */}
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSortBy((prev) => (prev === 'date' ? 'status' : 'date'))
            }
            title={`Sort by ${sortBy === 'date' ? 'Status' : 'Date'}`}
          >
            <SortAsc className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Orders ({filteredOrders.length})</CardTitle>
            {/* Customer Filter Chips */}
            {customers.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 max-w-md">
                <Badge
                  variant={filterCustomer === null ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setFilterCustomer(null)}
                >
                  All
                </Badge>
                {customers.map((c) => (
                  <Badge
                    key={c}
                    variant={filterCustomer === c ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setFilterCustomer(c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[120px]">PO #</TableHead>
                <TableHead className="w-[150px]">Customer</TableHead>
                <TableHead className="w-[120px]">Progress</TableHead>
                <TableHead>Digital DNA</TableHead>
                <TableHead className="w-[80px] text-right">Pumps</TableHead>
                <TableHead className="w-[100px] text-right">Value</TableHead>
                <TableHead className="w-[100px] text-right">Start</TableHead>
                <TableHead className="w-[100px] text-right">Promise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No orders found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((po) => (
                  <OrderRow
                    key={po.id}
                    order={po}
                    isExpanded={expandedOrders.has(po.id)}
                    onToggle={() => toggleOrder(po.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function OrderRow({
  order,
  isExpanded,
  onToggle,
}: {
  order: DigitalDnaStrand
  isExpanded: boolean
  onToggle: () => void
}) {
  const percentComplete = Math.round(order.overallProgress * 100)
  const totalPumps = order.pumps ? order.pumps.length : 0
  const activePumps = order.segments.reduce(
    (acc, seg) => acc + seg.activeCount,
    0
  )

  // Format currency
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  return (
    <>
      <TableRow
        className={cn('cursor-pointer', isExpanded && 'bg-muted/50 border-b-0')}
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle()
        }}
      >
        <TableCell>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell className="font-medium whitespace-nowrap">
          {order.poNumber}
          {order.isLate && (
            <Badge variant="destructive" className="ml-2 px-1 text-[10px] h-4">
              LATE
            </Badge>
          )}
        </TableCell>
        <TableCell className="truncate max-w-[150px]" title={order.customer}>
          {order.customer}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Progress value={percentComplete} className="h-2 w-16" />
            <span className="text-xs text-muted-foreground">
              {percentComplete}%
            </span>
          </div>
        </TableCell>
        <TableCell>
          <DigitalDNA
            strand={order}
            className="hover:opacity-80 transition-opacity"
          />
        </TableCell>
        <TableCell className="text-right text-xs">
          <span className="font-medium">{activePumps}</span>{' '}
          <span className="text-muted-foreground">/ {totalPumps}</span>
        </TableCell>
        <TableCell className="text-right font-mono text-xs">
          {currencyFormatter.format(order.totalValue || 0)}
        </TableCell>
        <TableCell className="text-right text-xs whitespace-nowrap">
          {order.startDate
            ? new Date(order.startDate).toLocaleDateString()
            : '-'}
        </TableCell>
        <TableCell className="text-right text-xs whitespace-nowrap">
          {order.endDate ? new Date(order.endDate).toLocaleDateString() : '-'}
        </TableCell>
      </TableRow>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <TableRow className="hover:bg-transparent border-t-0">
            <TableCell colSpan={9} className="p-0 border-b">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-muted/30"
              >
                <div className="p-4 pl-14">
                  <h4 className="text-sm font-semibold mb-2">Order Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.pumps?.length > 0 ? (
                      order.pumps.map((pump) => (
                        <div
                          key={pump.id}
                          className="bg-card p-3 rounded-lg border shadow-sm text-sm flex justify-between items-center group hover:border-primary/50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium group-hover:text-primary">
                              {pump.model}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ID: {pump.id.substring(0, 8)}...
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase tracking-wider"
                          >
                            {pump.stage}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No pumps data available.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  )
}
