import { useEffect, useState } from 'react'

/**
 * useFormDraft — auto-persist a form's metadata to sessionStorage so users
 * who tab-hop or accidentally refresh don't lose what they typed.
 *
 * Files (File API objects) cannot be persisted by the browser — those need to
 * be re-picked. Strings, numbers, booleans, dates, arrays and plain objects are
 * all preserved.
 *
 * Usage:
 *   const [data, setData, { restored, clearDraft }] = useFormDraft(
 *     'isoguardian_ncr_draft_v1',
 *     { title: '', severity: 'Major', clause: 5 },
 *   )
 *
 *   // ...on successful save:
 *   clearDraft()
 *
 *   // ...inside the JSX, show a notice when a draft was restored:
 *   {restored && <DraftRestoredNotice />}
 *
 * @param {string} key      Unique sessionStorage key. Always include a `_v1`
 *                          suffix so you can bump the schema later without
 *                          loading stale shapes.
 * @param {object} initial  Default form data shape. Used when no draft exists.
 * @param {object} [opts]
 * @param {(draft) => boolean} [opts.validate] Optional — return false to reject
 *   a restored draft (e.g. user no longer has access to that standard).
 */
export function useFormDraft(key, initial, opts = {}) {
  const { validate } = opts

  // Lazy initial state — restore once on mount, never re-read sessionStorage
  // mid-render (avoids hydration weirdness + extra reads).
  const restoredOnMount = (() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = window.sessionStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return null
      if (validate && !validate(parsed)) return null
      return parsed
    } catch {
      return null
    }
  })()

  const [data, setData] = useState(restoredOnMount ?? initial)

  // Persist on every change. Wrapped in try because private-mode browsers
  // throw on sessionStorage writes and we never want that to crash the form.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      window.sessionStorage.setItem(key, JSON.stringify(data))
    } catch {
      // ignore — quota exceeded / private mode / etc.
    }
  }, [key, data])

  const clearDraft = () => {
    try {
      if (typeof window !== 'undefined') window.sessionStorage.removeItem(key)
    } catch {
      // noop
    }
  }

  return [data, setData, { restored: restoredOnMount !== null, clearDraft }]
}

/**
 * DraftRestoredNotice — drop-in component for showing the "your previous draft
 * was restored" message inside a form. Matches the amber styling used on the
 * Documents upload form so the UX is consistent app-wide.
 */
export const DRAFT_NOTICE_CLASS =
  'mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2'
