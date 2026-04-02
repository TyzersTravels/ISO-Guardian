// Static metadata for ISO standards — used by StandardsNews pages

export const STANDARDS_INFO = {
  'ISO 9001': {
    slug: 'iso-9001',
    fullName: 'ISO 9001:2015 Quality Management Systems',
    shortName: 'ISO 9001',
    shortDesc: 'Requirements for a quality management system — customer satisfaction, process efficiency, and continual improvement.',
    color: 'cyan',
    colorClasses: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300',
      gradient: 'from-cyan-500 to-cyan-400',
    },
    revisionNote: 'ISO 9001:2026 revision expected September 2026 — 3-year transition period',
    keyTopics: ['Quality policy', 'Process approach', 'Risk-based thinking', 'Continual improvement', 'Customer focus', 'Leadership'],
    clauseRange: 'Clauses 4\u201310',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  'ISO 14001': {
    slug: 'iso-14001',
    fullName: 'ISO 14001:2015 Environmental Management Systems',
    shortName: 'ISO 14001',
    shortDesc: 'Requirements for an environmental management system — pollution prevention, legal compliance, and environmental performance.',
    color: 'green',
    colorClasses: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      badge: 'bg-green-500/20 text-green-300',
      gradient: 'from-green-500 to-green-400',
    },
    revisionNote: 'ISO 14001:2026 revision expected April 2026 — 3-year transition period',
    keyTopics: ['Environmental aspects', 'Legal compliance', 'Life cycle perspective', 'Pollution prevention', 'Climate change', 'Biodiversity'],
    clauseRange: 'Clauses 4\u201310',
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  'ISO 45001': {
    slug: 'iso-45001',
    fullName: 'ISO 45001:2018 Occupational Health & Safety',
    shortName: 'ISO 45001',
    shortDesc: 'Requirements for an OH&S management system — worker safety, hazard identification, and incident prevention.',
    color: 'amber',
    colorClasses: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300',
      gradient: 'from-amber-500 to-amber-400',
    },
    revisionNote: 'ISO 45001 revision expected 2027 — current edition remains in effect',
    keyTopics: ['Hazard identification', 'Worker participation', 'Emergency preparedness', 'Incident investigation', 'Legal requirements', 'Risk assessment'],
    clauseRange: 'Clauses 4\u201310',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
}

export const ALL_STANDARDS = Object.keys(STANDARDS_INFO)

export function getStandardBySlug(slug) {
  return Object.values(STANDARDS_INFO).find(s => s.slug === slug) || null
}

export function getStandardColor(standardName) {
  return STANDARDS_INFO[standardName]?.colorClasses || {
    bg: 'bg-white/10',
    border: 'border-white/20',
    text: 'text-white/60',
    badge: 'bg-white/10 text-white/50',
    gradient: 'from-white/20 to-white/10',
  }
}
