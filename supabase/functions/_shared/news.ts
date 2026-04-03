// Shared utilities for the ISO news scraping and processing system

/**
 * Lightweight RSS 2.0 parser — extracts items from RSS XML.
 * Works in Deno without external XML dependencies.
 */
export interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string | null
}

export function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = []
  // Match each <item>...</item> block
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    const description = extractTag(block, 'description')
    const pubDate = extractTag(block, 'pubDate')

    if (title && link) {
      items.push({
        title: decodeEntities(title),
        link: link.trim(),
        description: decodeEntities(stripHTML(description || '')),
        pubDate,
      })
    }
  }

  return items
}

/** Extract text content from an XML tag */
function extractTag(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i')
  const cdataMatch = cdataRegex.exec(xml)
  if (cdataMatch) return cdataMatch[1].trim()

  // Handle regular content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = regex.exec(xml)
  return m ? m[1].trim() : ''
}

/** Decode HTML entities including all numeric references */
function decodeEntities(text: string): string {
  return text
    // Named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '\u2026')
    // Numeric entities (decimal: &#38; &#039; etc.)
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)))
    // Hex entities (&#x26; &#x2019; etc.)
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/** Strip all HTML tags from a string */
export function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

/** Generate a URL-safe slug from a title */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Truncate text to maxLength, breaking at word boundary */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...'
}

/**
 * Fetch full article body text from a source URL.
 * Extracts the main content area and strips HTML.
 * Returns empty string on failure (non-blocking).
 */
export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ISOGuardian News Bot/1.0 (+https://isoguardian.co.za)" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ""
    const html = await res.text()

    // Try to extract article/main content area
    let content = ""

    // Priority 1: <article> tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    if (articleMatch) {
      content = articleMatch[1]
    }

    // Priority 2: common content containers
    if (!content) {
      const contentMatch = html.match(/<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|single-content|blog-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (contentMatch) content = contentMatch[1]
    }

    // Priority 3: main tag
    if (!content) {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      if (mainMatch) content = mainMatch[1]
    }

    if (!content) return ""

    // Remove scripts, styles, nav, footer, sidebar, forms, comments
    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<form[\s\S]*?<\/form>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    // Convert <p>, <br>, headings to newlines for readability
    content = content
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<h[1-6][^>]*>/gi, '')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')

    // Strip remaining tags and decode entities
    content = decodeEntities(stripHTML(content))

    // Clean up whitespace
    content = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Return up to ~4000 chars (enough for a full article)
    return content.slice(0, 4000)
  } catch {
    return ""
  }
}
