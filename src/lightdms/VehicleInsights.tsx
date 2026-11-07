'use client'
import { useEffect, useRef, useState } from 'react'
import { ClipboardList, SearchCheck, ShieldCheck } from 'lucide-react'
import { adminApi, pounds } from './types'
import type { FinderCheck, FinderInsights } from './finderTypes'
export function finderDate(value: string | null) {
  if (!value) return 'Not supplied'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not supplied'
    : new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/London',
      }).format(date)
}
export default function VehicleInsights({
  insights,
  registration,
  mileage,
}: {
  insights?: FinderInsights
  registration: string
  mileage: number
}) {
  const [check, setCheck] = useState<FinderCheck | null>(null)
  const [checkError, setCheckError] = useState(''),
    [checking, setChecking] = useState(false)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])
  async function loadCheck() {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    setChecking(true)
    setCheck(null)
    setCheckError('')
    try {
      const result = await adminApi<FinderCheck>(
        `dms/vehicle-check?${new URLSearchParams({ registration })}`,
        'GET',
        undefined,
        { signal: controller.signal },
      )
      if (!controller.signal.aborted) setCheck(result)
    } catch (e) {
      if (!controller.signal.aborted) setCheckError((e as Error).message)
    } finally {
      if (!controller.signal.aborted) setChecking(false)
    }
  }
  const lastReading = insights?.motTests?.find(
    (test) =>
      test.odometerValue != null &&
      /^(mi|miles|km|kilometres|kilometers)$/i.test(test.odometerUnit || ''),
  )
  const reading = Number(lastReading?.odometerValue?.replaceAll(',', ''))
  const lastMiles = /^(km|kilometres|kilometers)$/i.test(lastReading?.odometerUnit || '')
    ? reading / 1.609344
    : reading
  return (
    <div className="ld-insights">
      <div className="ld-research-source">
        <span>AutoTrader vehicle information</span>
        <span>
          {mileage.toLocaleString('en-GB')} miles · {registration}
        </span>
        {insights?.fetchedAt && <span>Retrieved {finderDate(insights.fetchedAt)}</span>}
      </div>
      {Number.isFinite(lastMiles) && lastMiles > mileage && (
        <p role="status" className="ld-prep-notice">
          The mileage entered is below the latest MOT reading (
          {Math.round(lastMiles).toLocaleString('en-GB')} miles). Check the registration and mileage
          before proceeding.
        </p>
      )}
      {insights?.warnings.map((warning, i) => (
        <p className="ld-prep-notice" role="status" key={i}>
          {warning}
        </p>
      ))}
      <section className="ld-panel" aria-label="Valuations">
        <div className="ld-panel-heading">
          <h3>Valuations</h3>
          <span className="ld-muted">Market average · GBP</span>
        </div>
        <div className="ld-panel-body">
          <div className="ld-valuation-grid">
            {(
              insights?.valuations ??
              ['Retail', 'Private sale', 'Part exchange', 'Trade'].map((label) => ({
                type: label,
                label,
                amountGBP: null,
                vatBasis: null,
              }))
            ).map((value) => (
              <div key={value.type} className="ld-valuation">
                <span>{value.label}</span>
                <strong>{value.amountGBP == null ? 'Unavailable' : pounds(value.amountGBP)}</strong>
                <small>{value.vatBasis || 'Value not supplied by AutoTrader'}</small>
              </div>
            ))}
          </div>
          <p className="ld-muted">
            Indicative values for the mileage entered. These are not your purchase cost or
            advertised price.
          </p>
        </div>
      </section>
      <section className="ld-panel" aria-label="MOT history">
        <div className="ld-panel-heading">
          <h3>
            <ClipboardList size={17} /> MOT history
          </h3>
          <span className="ld-muted">
            {insights?.motTests != null
              ? `${insights.motTests.length} tests returned`
              : 'Unavailable'}
          </span>
        </div>
        <div className="ld-panel-body">
          {insights?.motTests == null ? (
            <p className="ld-muted">AutoTrader did not supply MOT history for this lookup.</p>
          ) : !insights.motTests.length ? (
            <p className="ld-muted">AutoTrader returned no MOT tests for this vehicle.</p>
          ) : (
            insights.motTests.map((test, i) => (
              <details className="ld-mot-test" key={`${test.completedDate}-${i}`} open={i === 0}>
                <summary>
                  <span>{finderDate(test.completedDate)}</span>
                  <span
                    className={`ld-check-state ${test.testResult?.toUpperCase() === 'PASSED' ? (test.defects?.length ? 'warning' : 'clear') : test.testResult?.toUpperCase() === 'FAILED' ? 'flagged' : 'unknown'}`}
                  >
                    {test.testResult || 'Result not supplied'}
                  </span>
                  <span>
                    {test.odometerValue != null
                      ? `${test.odometerValue} ${test.odometerUnit || '(unit not supplied)'}`
                      : 'Mileage not supplied'}
                  </span>
                </summary>
                <div>
                  <p className="ld-muted">Expiry: {finderDate(test.expiryDate)}</p>
                  {test.defects == null ? (
                    <p className="ld-muted">Defect details were not supplied.</p>
                  ) : test.defects.length ? (
                    <ul className="ld-mot-defects">
                      {test.defects.map((defect, j) => (
                        <li key={j}>
                          <strong>
                            {defect.dangerous ? 'Dangerous' : defect.type || 'Defect'}
                          </strong>
                          <span>{defect.text || 'Details not supplied'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ld-muted">No defects or advisories returned for this test.</p>
                  )}
                </div>
              </details>
            ))
          )}
        </div>
      </section>
      <section className="ld-panel" aria-label="Vehicle check">
        <div className="ld-panel-heading">
          <h3>
            <ShieldCheck size={17} /> Vehicle check
          </h3>
          <button
            className="ld-button"
            type="button"
            onClick={() => void loadCheck()}
            disabled={checking}
          >
            {checking ? (
              'Loading check…'
            ) : check ? (
              'Reload check'
            ) : checkError ? (
              'Retry vehicle check'
            ) : (
              <>
                <SearchCheck size={16} />
                Load vehicle check
              </>
            )}
          </button>
        </div>
        <div className="ld-panel-body">
          <p className="ld-muted">
            AutoTrader package access applies. This check is optional and does not prevent adding
            the vehicle.
          </p>
          {checkError && (
            <p role="alert" className="ld-error">
              {checkError}
            </p>
          )}
          {checking && <p role="status">Retrieving vehicle check…</p>}
          {check?.warning && (
            <p role="status" className="ld-prep-notice">
              {check.warning}
            </p>
          )}
          {check ? (
            <>
              <div className="ld-check-grid">
                {check.checks.map((item) => (
                  <div className="ld-check-row" key={item.key}>
                    <span>{item.label}</span>
                    <span className={`ld-check-state ${item.status}`}>
                      {item.status === 'flagged'
                        ? item.detail || 'Flagged'
                        : item.status === 'clear'
                          ? 'Not flagged'
                          : 'Not supplied'}
                    </span>
                  </div>
                ))}
              </div>
              {check.fetchedAt && (
                <p className="ld-muted">
                  Check retrieved {finderDate(check.fetchedAt)}. Results reflect the provider
                  records at that time.
                </p>
              )}
            </>
          ) : (
            !checking &&
            !checkError && (
              <p className="ld-muted">
                {
                  ' Load the check to view finance, stolen, write-off and other markers. No checks have been run here yet. '
                }
              </p>
            )
          )}
        </div>
      </section>
    </div>
  )
}
