import { useEffect, useRef, useState } from 'react'

export const useCountUp = (target, { duration = 1300, enabled = true } = {}) => {
  const [value, setValue] = useState(enabled ? 0 : target)
  const fromRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const from = fromRef.current
    const delta = target - from
    if (delta === 0) {
      setValue(target)
      return
    }
    let start = null
    const step = (ts) => {
      if (start === null) start = ts
      const t = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + delta * eased
      setValue(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, enabled, duration])

  return value
}

export const useInView = (ref, { threshold = 0.25, once = true } = {}) => {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true)
            if (once) io.unobserve(el)
          } else if (!once) {
            setInView(false)
          }
        })
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold, once])

  return inView
}
