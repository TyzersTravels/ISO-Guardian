import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { STANDARDS_INFO, getStandardColor } from '../lib/standardsData'
import PublicLayout from '../components/PublicLayout'
import { trackPageView } from '../lib/analytics'

export default function ArticleDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) fetchArticle()
  }, [slug])

  const fetchArticle = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('iso_news_articles')
      .select('id, title, summary, ai_insight, standards, categories, source_name, source_url, published_at, slug, relevance_score')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error || !data) {
      setLoading(false)
      return
    }

    setArticle(data)
    trackPageView(`/standards/article/${slug}`)

    // Fetch related articles (same standard, different article)
    if (data.standards?.length > 0) {
      const { data: rel } = await supabase
        .from('iso_news_articles')
        .select('id, title, summary, standards, published_at, slug, source_name')
        .eq('status', 'published')
        .contains('standards', [data.standards[0]])
        .neq('id', data.id)
        .order('published_at', { ascending: false })
        .limit(4)
      setRelated(rel || [])
    }
    setLoading(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const primaryStandard = article?.standards?.[0]
  const info = primaryStandard ? STANDARDS_INFO[primaryStandard] : null
  const stdSlug = info?.slug || 'iso-9001'

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    )
  }

  if (!article) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-white/50 mb-6">This article may have been removed or doesn't exist.</p>
          <button onClick={() => navigate('/standards')} className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold text-sm">
            Browse All News
          </button>
        </div>
      </PublicLayout>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary?.slice(0, 200),
    datePublished: article.published_at,
    publisher: {
      '@type': 'Organization',
      name: 'ISOGuardian',
      url: 'https://isoguardian.co.za',
    },
    url: `https://isoguardian.co.za/standards/article/${article.slug}`,
    about: article.standards?.map(s => ({ '@type': 'Thing', name: s })),
  }

  return (
    <PublicLayout>
      <Helmet>
        <title>{article.title} | ISOGuardian</title>
        <meta name="description" content={article.summary?.slice(0, 155)} />
        <link rel="canonical" href={`https://isoguardian.co.za/standards/article/${article.slug}`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary?.slice(0, 155)} />
        <meta property="og:url" content={`https://isoguardian.co.za/standards/article/${article.slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-white/40 mb-8">
          <button onClick={() => navigate('/standards')} className="hover:text-white/70 transition-colors">Standards</button>
          <span>/</span>
          {info && (
            <>
              <button onClick={() => navigate(`/standards/${stdSlug}`)} className={`hover:text-white/70 transition-colors ${info.colorClasses.text}`}>
                {info.shortName}
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-white/60 truncate max-w-[200px]">{article.title}</span>
        </nav>

        {/* Standard badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {article.standards?.map(std => {
            const c = getStandardColor(std)
            return (
              <span key={std} className={`px-3 py-1 rounded-full text-xs font-semibold ${c.badge} border ${STANDARDS_INFO[std]?.colorClasses?.border || 'border-white/20'}`}>
                {std}
              </span>
            )
          })}
          {article.categories?.map(cat => (
            <span key={cat} className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/40 capitalize border border-white/10">
              {cat.replace('-', ' ')}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-white/40 mb-8 pb-8 border-b border-white/10">
          <span>{formatDate(article.published_at)}</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>ISOGuardian Editorial</span>
          {article.relevance_score >= 80 && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-cyan-400 font-medium">High Relevance</span>
            </>
          )}
        </div>

        {/* AI Insight (if available) */}
        {article.ai_insight && (
          <div className={`rounded-xl p-5 mb-8 ${info ? `${info.colorClasses.bg} border ${info.colorClasses.border}` : 'bg-cyan-500/10 border border-cyan-500/20'}`}>
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${info?.colorClasses?.text || 'text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className={`text-xs font-bold mb-1 ${info?.colorClasses?.text || 'text-cyan-400'}`}>ISOGuardian Insight for South African Businesses</p>
                <p className="text-sm text-white/80 leading-relaxed">{article.ai_insight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-invert max-w-none">
          <div className="text-white/70 text-[15px] leading-[1.8] space-y-4 whitespace-pre-line">
            {article.summary}
          </div>
        </article>

        {/* Source attribution (small, not a CTA) */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-[10px] text-white/20">
            Source reference: {article.source_name}
          </p>
        </div>

        {/* CTA Banner */}
        <div className="mt-10 glass glass-border rounded-2xl p-6 md:p-8 text-center">
          <h3 className="text-lg font-bold text-white mb-2">
            Need help managing your {primaryStandard || 'ISO'} compliance?
          </h3>
          <p className="text-white/50 text-sm mb-5 max-w-md mx-auto">
            ISOGuardian helps South African businesses manage documents, NCRs, audits, and compliance scoring — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl font-semibold text-sm transition-all"
            >
              Start Free Trial {'\u2192'}
            </button>
            <button
              onClick={() => navigate('/consultation')}
              className="px-6 py-2.5 bg-white/10 border border-white/20 text-white/70 rounded-xl font-medium text-sm hover:bg-white/20 transition-all"
            >
              Book Consultation
            </button>
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-white mb-5">Related Articles</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map(rel => {
                const relColors = getStandardColor(rel.standards?.[0])
                return (
                  <button
                    key={rel.id}
                    onClick={() => navigate(`/standards/article/${rel.slug}`)}
                    className="glass glass-border rounded-xl p-4 text-left hover:bg-white/[0.06] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {rel.standards?.map(s => (
                        <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded ${relColors.badge} font-semibold`}>{s}</span>
                      ))}
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-1">
                      {rel.title}
                    </h4>
                    <p className="text-[11px] text-white/40 line-clamp-2">{rel.summary?.slice(0, 120)}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate(info ? `/standards/${stdSlug}` : '/standards')}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            {'\u2190'} Back to {info?.shortName || 'all'} news
          </button>
        </div>
      </div>
    </PublicLayout>
  )
}
