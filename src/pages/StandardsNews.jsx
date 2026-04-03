import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { STANDARDS_INFO, ALL_STANDARDS, getStandardColor } from '../lib/standardsData'
import PublicLayout from '../components/PublicLayout'
import { trackPageView } from '../lib/analytics'

const ARTICLES_PER_PAGE = 12

export default function StandardsNews({ standard }) {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribeName, setSubscribeName] = useState('')
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)
  const [selectedStandards, setSelectedStandards] = useState(
    standard ? [standard] : ALL_STANDARDS
  )
  const honeypotRef = useRef(null)

  const info = standard ? STANDARDS_INFO[standard] : null
  const pageTitle = info
    ? `${info.fullName} News & Updates`
    : 'ISO Standards News & Updates'
  const pageDesc = info
    ? `Latest ${info.shortName} news, revision updates, and compliance guidance for South African businesses.`
    : 'Latest ISO 9001, ISO 14001, and ISO 45001 news, revision updates, and compliance guidance for South African businesses.'
  const canonicalPath = info ? `/standards/${info.slug}` : '/standards'

  useEffect(() => {
    trackPageView(canonicalPath)
  }, [canonicalPath])

  useEffect(() => {
    fetchArticles(true)
  }, [standard, selectedStandards])

  const fetchArticles = async (reset = false) => {
    setLoading(true)
    const offset = reset ? 0 : page * ARTICLES_PER_PAGE

    let query = supabase
      .from('iso_news_articles')
      .select('id, title, summary, ai_insight, standards, categories, source_name, source_url, published_at, slug, relevance_score')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + ARTICLES_PER_PAGE - 1)

    if (standard) {
      query = query.contains('standards', [standard])
    }

    const { data, error } = await query

    if (!error && data) {
      if (reset) {
        setArticles(data)
        setPage(1)
      } else {
        setArticles(prev => [...prev, ...data])
        setPage(prev => prev + 1)
      }
      setHasMore(data.length === ARTICLES_PER_PAGE)
    }
    setLoading(false)
  }

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (honeypotRef.current?.value) return // Bot trap
    if (!subscribeEmail.trim()) return

    setSubscribing(true)
    const { error } = await supabase
      .from('news_subscribers')
      .insert({
        email: subscribeEmail.trim().toLowerCase(),
        name: subscribeName.trim() || null,
        standards: standard ? [standard] : ALL_STANDARDS,
      })

    setSubscribing(false)
    if (!error) {
      setSubscribeSuccess(true)
      setSubscribeEmail('')
      setSubscribeName('')
    } else if (error.message?.includes('duplicate')) {
      setSubscribeSuccess(true) // Already subscribed is fine
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDesc,
    url: `https://isoguardian.co.za${canonicalPath}`,
    publisher: {
      '@type': 'Organization',
      name: 'ISOGuardian',
      url: 'https://isoguardian.co.za',
    },
  }

  return (
    <PublicLayout>
      <Helmet>
        <title>{pageTitle} | ISOGuardian</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://isoguardian.co.za${canonicalPath}`} />
        <meta property="og:title" content={`${pageTitle} | ISOGuardian`} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://isoguardian.co.za${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          {info && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 ${info.colorClasses.badge} border ${info.colorClasses.border}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={info.icon} />
              </svg>
              {info.shortName} {'\u2014'} {info.clauseRange}
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {info ? (
              <>
                {info.shortName}{' '}
                <span className={`bg-gradient-to-r ${info.colorClasses.gradient} bg-clip-text text-transparent`}>
                  News & Updates
                </span>
              </>
            ) : (
              <>
                ISO Standards{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  News & Updates
                </span>
              </>
            )}
          </h1>

          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            {info ? info.shortDesc : 'Stay informed with the latest developments across ISO 9001, 14001, and 45001 \u2014 curated and summarised for South African businesses.'}
          </p>
        </div>

        {/* ── Revision Banner ── */}
        {info?.revisionNote && (
          <div className={`glass glass-border rounded-xl p-4 mb-8 border ${info.colorClasses.border} ${info.colorClasses.bg}`}>
            <div className="flex items-center gap-3">
              <svg className={`w-5 h-5 ${info.colorClasses.text} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-sm ${info.colorClasses.text} font-medium`}>{info.revisionNote}</p>
            </div>
          </div>
        )}

        {/* ── Standard Filter (hub page only) ── */}
        {!standard && (
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            <button
              onClick={() => navigate('/standards')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !standard ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              All Standards
            </button>
            {ALL_STANDARDS.map(std => {
              const c = STANDARDS_INFO[std].colorClasses
              return (
                <button
                  key={std}
                  onClick={() => navigate(`/standards/${STANDARDS_INFO[std].slug}`)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${c.bg} border ${c.border} ${c.text} hover:brightness-125`}
                >
                  {STANDARDS_INFO[std].shortName}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Key Topics (standard page only) ── */}
        {info && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {info.keyTopics.map(topic => (
              <span key={topic} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* ── Articles Grid ── */}
        {loading && articles.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-lg font-semibold text-white/50 mb-2">No articles yet</h3>
            <p className="text-white/30 text-sm">News articles are being fetched and processed. Check back soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && articles.length > 0 && (
          <div className="text-center mb-16">
            <button
              onClick={() => fetchArticles(false)}
              disabled={loading}
              className="px-6 py-2.5 bg-white/10 border border-white/20 text-white/70 rounded-xl hover:bg-white/20 transition-all text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Articles'}
            </button>
          </div>
        )}

        {/* ── Subscribe Section ── */}
        <div className="glass glass-border rounded-2xl p-8 md:p-10 text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-2">Stay Updated</h2>
          <p className="text-white/50 mb-6 max-w-md mx-auto text-sm">
            Get weekly ISO news and compliance insights delivered to your inbox. POPIA compliant {'\u2014'} unsubscribe anytime.
          </p>

          {subscribeSuccess ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-300 text-sm font-medium">You're subscribed! Check your inbox on Fridays.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              {/* Honeypot */}
              <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute opacity-0 h-0 w-0 pointer-events-none" />

              <input
                type="text"
                value={subscribeName}
                onChange={e => setSubscribeName(e.target.value)}
                placeholder="Your name"
                className="glass-input px-4 py-2.5 rounded-xl text-white text-sm flex-1 min-w-0"
              />
              <input
                type="email"
                value={subscribeEmail}
                onChange={e => setSubscribeEmail(e.target.value)}
                placeholder="Your email"
                required
                className="glass-input px-4 py-2.5 rounded-xl text-white text-sm flex-1 min-w-0"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>

        {/* ── ISOGuardian CTA ── */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
            Ready to manage your{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              ISO compliance?
            </span>
          </h2>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">
            Document control, NCR tracking, audit management, and compliance scoring in one platform.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/50 text-lg"
          >
            Start Your Free Trial {'\u2192'}
          </button>
        </div>
      </div>
    </PublicLayout>
  )
}

/* ── Article Card ── */
function ArticleCard({ article }) {
  const navigate = useNavigate()
  const primaryStandard = article.standards?.[0]
  const colors = getStandardColor(primaryStandard)

  return (
    <button
      onClick={() => navigate(`/standards/article/${article.slug}`)}
      className="glass glass-border rounded-xl p-5 hover:bg-white/[0.06] transition-all group block text-left w-full"
    >
      {/* Source & Date */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">ISOGuardian</span>
        <span className="text-[10px] text-white/25">{formatCardDate(article.published_at)}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-white/50 leading-relaxed mb-3 line-clamp-4">
        {article.summary}
      </p>

      {/* AI Insight */}
      {article.ai_insight && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2 mb-3">
          <p className="text-[10px] text-cyan-300">
            <span className="font-bold">ISOGuardian Insight:</span> {article.ai_insight}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {article.standards?.map(std => {
          const c = getStandardColor(std)
          return (
            <span key={std} className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${c.badge}`}>
              {std}
            </span>
          )
        })}
        {article.categories?.slice(0, 2).map(cat => (
          <span key={cat} className="px-2 py-0.5 rounded-md text-[9px] bg-white/5 text-white/30 capitalize">
            {cat.replace('-', ' ')}
          </span>
        ))}
      </div>

      {/* Read more indicator */}
      <div className="mt-3 flex items-center gap-1 text-cyan-400 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Read article <span>{'\u2192'}</span>
      </div>
    </button>
  )
}

function formatCardDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
