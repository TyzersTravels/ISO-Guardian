import { useEffect, useRef } from 'react'

// Scroll-triggered fade-in (existing logic extracted)
export function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
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
    children.forEach(child => {
      child.style.opacity = '0'
      child.style.transform = 'translateY(20px)'
      child.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
    })
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach((child, i) => {
            setTimeout(() => {
              child.style.opacity = '1'
              child.style.transform = 'translateY(0)'
            }, i * staggerDelay)
          })
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(container)
    return () => observer.disconnect()
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
