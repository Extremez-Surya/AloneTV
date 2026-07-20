'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { MediaPlayer, MediaProvider, Poster, Gesture, useMediaRemote } from '@vidstack/react'
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default'
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'

export interface AudioTrackInfo {
  index: number
  label: string
  language: string
}

interface VidstackPlayerProps {
  src: string
  poster?: string | null
  title: string
  selectedAudioLanguage?: string
  onAudioTracksReady?: (tracks: AudioTrackInfo[]) => void
}

export default function VidstackPlayer({
  src,
  poster,
  title,
  selectedAudioLanguage,
  onAudioTracksReady,
}: VidstackPlayerProps) {
  const playerRef = useRef<any>(null)
  const remote = useMediaRemote(playerRef)
  const [audioTracks, setAudioTracks] = useState<AudioTrackInfo[]>([])

  const syncTracks = useCallback(() => {
    const p = playerRef.current
    if (!p?.audioTracks) return
    const tracks: AudioTrackInfo[] = []
    for (let i = 0; i < p.audioTracks.length; i++) {
      const t = p.audioTracks[i]
      tracks.push({ index: i, label: t.label || '', language: t.language || '' })
    }
    setAudioTracks(tracks)
    if (tracks.length > 0) onAudioTracksReady?.(tracks)
  }, [onAudioTracksReady])

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const handler = () => syncTracks()
    p.addEventListener('audio-tracks-change', handler)
    const id = setTimeout(syncTracks, 2000)
    return () => {
      p.removeEventListener('audio-tracks-change', handler)
      clearTimeout(id)
    }
  }, [syncTracks, src])

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const id = setTimeout(syncTracks, 1000)
    return () => clearTimeout(id)
  }, [src, syncTracks])

  useEffect(() => {
    if (!audioTracks.length || !selectedAudioLanguage || !remote) return
    const idx = audioTracks.findIndex(
      t => t.language.toLowerCase().includes(selectedAudioLanguage.toLowerCase())
        || t.label.toLowerCase().includes(selectedAudioLanguage.toLowerCase())
    )
    if (idx >= 0) {
      remote.changeAudioTrack(idx)
    }
  }, [selectedAudioLanguage, audioTracks, remote])

  return (
    <MediaPlayer
      ref={playerRef}
      className="w-full h-full bg-black"
      src={src}
      poster={poster || undefined}
      title={title}
      playsinline
      load="visible"
    >
      <MediaProvider>
        {poster && <Poster src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
        <Gesture action="toggle:controls" event="click" />
        <Gesture action="seek:-30" event="dblclick" />
        <Gesture action="seek:60" event="dblclick" />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaProvider>
    </MediaPlayer>
  )
}
