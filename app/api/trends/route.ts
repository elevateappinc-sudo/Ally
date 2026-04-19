import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/anthropic'

async function fetchGoogleTrends(keyword: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const googleTrends = require('google-trends-api')
    const raw = await googleTrends.interestOverTime({
      keyword,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      geo: '',
    })
    const parsed = JSON.parse(raw)
    const timeline = parsed?.default?.timelineData ?? []
    return timeline.map((d: { formattedAxisTime: string; value: number[] }) => ({
      date: d.formattedAxisTime,
      value: d.value?.[0] ?? 0,
    }))
  } catch {
    return []
  }
}

async function fetchRelatedQueries(keyword: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const googleTrends = require('google-trends-api')
    const raw = await googleTrends.relatedQueries({ keyword, geo: '' })
    const parsed = JSON.parse(raw)
    const items = parsed?.default?.rankedList ?? []
    const top = items[0]?.rankedKeyword?.slice(0, 8) ?? []
    const rising = items[1]?.rankedKeyword?.slice(0, 8) ?? []
    return {
      top: top.map((k: { query: string; value: number }) => ({ query: k.query, value: k.value })),
      rising: rising.map((k: { query: string; formattedValue: string }) => ({
        query: k.query,
        value: k.formattedValue,
      })),
    }
  } catch {
    return { top: [], rising: [] }
  }
}

async function fetchRedditPosts(keyword: string) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=hot&limit=6&t=week`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AllyApp/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.data?.children ?? []).map((c: {
      data: { title: string; subreddit: string; score: number; permalink: string }
    }) => ({
      title: c.data.title,
      subreddit: c.data.subreddit,
      score: c.data.score,
      url: `https://reddit.com${c.data.permalink}`,
    }))
  } catch {
    return []
  }
}

async function fetchAIInsights(keyword: string, relatedQueries: { query: string }[], redditTitles: string[]) {
  const anthropic = getAnthropicClient()
  const prompt = `Eres un experto en marketing digital y tendencias en redes sociales.
El usuario está investigando el nicho/tema: "${keyword}"

Consultas relacionadas en Google Trends: ${relatedQueries.map(q => q.query).join(', ')}
Publicaciones trending en Reddit: ${redditTitles.slice(0, 4).join(' | ')}

Genera en JSON (sin markdown) con esta estructura exacta:
{
  "insight": "Un párrafo de 2-3 oraciones explicando qué está pasando en este nicho ahora mismo y por qué es una oportunidad",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10"],
  "contentIdeas": [
    "Idea de contenido 1 específica y accionable",
    "Idea de contenido 2 específica y accionable",
    "Idea de contenido 3 específica y accionable",
    "Idea de contenido 4 específica y accionable",
    "Idea de contenido 5 específica y accionable"
  ]
}
Los hashtags deben ser sin #, relevantes para Instagram/TikTok/LinkedIn.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (msg.content[0] as { text: string }).text
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    return { insight: text, hashtags: [], contentIdeas: [] }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json()
    if (!keyword) return NextResponse.json({ error: 'keyword requerido' }, { status: 400 })

    const [interest, queries, reddit] = await Promise.all([
      fetchGoogleTrends(keyword),
      fetchRelatedQueries(keyword),
      fetchRedditPosts(keyword),
    ])

    const ai = await fetchAIInsights(
      keyword,
      queries.top,
      reddit.map((r: { title: string }) => r.title),
    )

    return NextResponse.json({
      keyword,
      interest,
      relatedQueries: queries.top,
      risingQueries: queries.rising,
      redditPosts: reddit,
      hashtags: ai.hashtags ?? [],
      contentIdeas: ai.contentIdeas ?? [],
      insight: ai.insight ?? '',
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error al obtener tendencias' }, { status: 500 })
  }
}
