export type FinderInsights = {
  source: 'AutoTrader'
  fetchedAt: string | null
  warnings: string[]
  valuations: { type: string; label: string; amountGBP: number | null; vatBasis: string | null }[]
  motTests:
    | null
    | {
        completedDate: string | null
        testResult: string | null
        expiryDate: string | null
        odometerValue: string | null
        odometerUnit: string | null
        defects: { text: string | null; type: string | null; dangerous: boolean }[] | null
      }[]
}
export type FinderCheck = {
  source: string
  fetchedAt: string | null
  available: boolean
  warning?: string
  checks: {
    key: string
    label: string
    status: 'flagged' | 'clear' | 'unknown'
    detail: string | null
  }[]
}
export type FinderResult = {
  vehicle: Record<string, string | number>
  alreadyInStock: { stockId: string; status: string } | null
  insights?: FinderInsights
}
