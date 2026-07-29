import { NextRequest, NextResponse } from 'next/server'

interface ProviderDef {
  name: string
  url: (id: string) => string
  tvUrl: (id: string, season: string, episode: string) => string
}

const PROVIDERS: ProviderDef[] = [
  {
    name: 'VidLink',
    url: (id) => `https://vidlink.pro/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    name: 'VidSrc.me',
    url: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    name: 'MultiEmbed',
    url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: 'SmashyStream',
    url: (id) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    tvUrl: (id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`,
  },
]

async function fetchWithTimeout(url: string, timeout = 8000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
    clearTimeout(id)
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

function extractVideoUrls(html: string): string[] {
  const urls: string[] = []
  const patterns = [
    /['"]((?:https?:)?\/\/[^'"]+\.m3u8[^'"]*?)['"]/gi,
    /['"]((?:https?:)?\/\/[^'"]+\.mp4[^'"]*?)['"]/gi,
    /source\s+src=['"]((?:https?:)?\/\/[^'"]+?\.(?:m3u8|mp4)[^'"]*?)['"]/gi,
    /file:\s*['"]((?:https?:)?\/\/[^'"]+?\.(?:m3u8|mp4)[^'"]*?)['"]/gi,
    /src:\s*['"]((?:https?:)?\/\/[^'"]+?\.(?:m3u8|mp4)[^'"]*?)['"]/gi,
    /data-src=['"]((?:https?:)?\/\/[^'"]+?\.(?:m3u8|mp4)[^'"]*?)['"]/gi,
    /url\(['"]?((?:https?:)?\/\/[^'"]+?\.(?:m3u8|mp4)[^'"]*?)['"]?\)/gi,
    /video_url['"]?\s*[:=]\s*['"]((?:https?:)?\/\/[^'"]+?\.(?:m3u8|mp4)[^'"]*?)['"]/gi,
    /playlist_url['"]?\s*[:=]\s*['"]((?:https?:)?\/\/[^'"]+?\.(?:m3u8)[^'"]*?)['"]/gi,
  ]
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1]
      if (url.startsWith('//')) url = `https:${url}`
      if (url && !urls.includes(url)) urls.push(url)
    }
  }
  return urls
}

function extractAudioTracks(m3u8: string): { language: string; group: string; default: boolean }[] {
  const tracks: { language: string; group: string; default: boolean }[] = []
  const regex = /#EXT-X-MEDIA:TYPE=AUDIO[^#]*/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(m3u8)) !== null) {
    const block = match[0]
    const langMatch = block.match(/LANGUAGE="([^"]+)"/i)
    const groupMatch = block.match(/GROUP-ID="([^"]+)"/i)
    const defaultMatch = block.match(/DEFAULT=(YES|NO)/i)
    if (langMatch && groupMatch) {
      tracks.push({
        language: langMatch[1],
        group: groupMatch[1],
        default: defaultMatch?.[1] === 'YES',
      })
    }
  }
  return tracks
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id') || ''
  const type = searchParams.get('type') || 'movie'
  const season = searchParams.get('season')
  const episode = searchParams.get('episode')

  if (!id) {
    return NextResponse.json({ error: 'Missing id', sources: [] }, { status: 400 })
  }

  const allUrls: string[] = []
  const audioTracks: { language: string; group: string; default: boolean }[] = []

  for (const provider of PROVIDERS) {
    let url: string
    if (type === 'tv' || season) {
      const s = season || '1'
      const e = episode || '1'
      url = provider.tvUrl(id, s, e)
    } else {
      url = provider.url(id)
    }

    const html = await fetchWithTimeout(url)
    if (html) {
      const urls = extractVideoUrls(html)
      allUrls.push(...urls)

      for (const u of urls) {
        if (u.includes('.m3u8')) {
          const manifest = await fetchWithTimeout(u)
          if (manifest) {
            const tracks = extractAudioTracks(manifest)
            audioTracks.push(...tracks)
          }
        }
      }
    }
  }

  const uniqueUrls = [...new Set(allUrls)]

  const response: Record<string, unknown> = { sources: [] }

  if (uniqueUrls.length > 0) {
    response.sources = uniqueUrls.map((u, i) => ({
      url: u,
      quality: 'auto',
      name: `Stream ${i + 1}`,
      type: u.includes('.m3u8') ? 'hls' : 'mp4',
    }))
  }

  if (audioTracks.length > 0) {
    response.audioTracks = audioTracks
  }

  return NextResponse.json(response)
}
