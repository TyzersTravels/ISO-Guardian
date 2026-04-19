import { useEffect, useRef } from 'react'

const isInViewport = (el) => {
  const r = el.getBoundingClientRect()
  return r.top < window.innerHeight && r.bottom > 0
}

const reveal = (el) => {
  el.classList.remove('anim-fade-init')
  el.classList.add('anim-fade-in')
}

// Scroll-triggered fade-in (existing logic extracted)
export function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Skip the hide entirely if already visible — avoids blank above-the-fold content on slow mobile
    if (isInViewport(el) || typeof IntersectionObserver === 'undefined') {
      reveal(el)
      return
    }
    el.classList.add('anim-fade-init')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal(el)
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    // Safety net: if observer never fires (flaky mobile), force-reveal after 1.5s
    const fallback = setTimeout(() => reveal(el), 1500)
    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [])
  return ref
}

// Staggered fade-in for child elements with data-stagger attribute
export function useStaggerFadeIn(staggerDelay = 120) {
  const ref = useRef(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return
    const children = container.querySelectorAll('[data-stagger]')
    if (!children.length) return
    const revealAll = () => children.forEach((c, i) => setTimeout(() => reveal(c), i * staggerDelay))
    if (isInViewport(container) || typeof IntersectionObserver === 'undefined') {
      revealAll()
      return
    }
    children.forEach(child => child.classList.add('anim-fade-init'))
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealAll()
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(container)
    const fallback = setTimeout(revealAll, 1500)
    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [staggerDelay])
  return ref
}

// Subtle hero parallax — shifts background on scroll
export function useHeroParallax() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = window.innerHeight
      const progress = Math.min(scrollY / maxScroll, 1)
      el.style.setProperty('--parallax-y', `${progress * 30}px`)
      el.style.setProperty('--parallax-opacity', `${1 - progress * 0.3}`)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return ref
}
