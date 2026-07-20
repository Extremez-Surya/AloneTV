'use client'

import { useState, useRef } from 'react'
import type { VideoSource } from '@/lib/api/videoSources'

interface VideoPlayerProps {
  sources: VideoSource[]
}

export default function VideoPlayer({
  sources,
}: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showServerMenu, setShowServerMenu] = useState(false)
  const iframeKey = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentSource = sources[currentIndex] || sources[0]

  const getSourceDisplayName = (source: VideoSource, idx: number) => {
    if (!source) return 'Server'
    let serverNum = 1
    for (let i = 0; i < idx; i++) {
      if (sources[i]) serverNum++
    }
    return `Server ${serverNum}`
  }

  const switchServer = (idx: number) => {
    setCurrentIndex(idx)
    setShowServerMenu(false)
    iframeKey.current++
  }

  const embedUrl = currentSource?.url || ''

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      {embedUrl ? (
        <iframe
          key={iframeKey.current}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-400 text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Server selector floating button */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative">
          <button
            onClick={() => setShowServerMenu(!showServerMenu)}
            className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-white hover:bg-black/90 transition-colors"
            title="Switch server"
          >
            {getSourceDisplayName(currentSource, currentIndex)}
          </button>
          {showServerMenu && (
            <div className="absolute top-full right-0 mt-1 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.06] rounded-xl p-1.5 min-w-[150px] shadow-2xl">
              {sources.map((s, i) => (
                <button
                  key={i}
                  onClick={() => switchServer(i)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    i === currentIndex ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  <span className="font-mono">{getSourceDisplayName(s, i)}</span>
                  {s.recommended && <span className="ml-2 text-[9px] text-purple-400 font-mono">REC</span>}
                  {s.fast && <span className="ml-1 text-[9px] text-green-400 font-mono">FAST</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
