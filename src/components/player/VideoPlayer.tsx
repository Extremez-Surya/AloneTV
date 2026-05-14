'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  title,
  autoplay = false,
  onProgress,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement as HTMLVideoElement, {
      controls: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 1, 1.5, 2, 2.5, 3, 4],
      autoplay,
      preload: 'auto',
      poster,
      html5: {
        vhs: {
          overrideNative: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources: [
        {
          src,
          type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
        },
      ],
    });

    playerRef.current = player;

    player.on('ready', () => {
      setIsReady(true);
    });

    player.on('timeupdate', () => {
      if (onProgress) {
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;
        onProgress(currentTime, duration);
      }
    });

    player.on('ended', () => {
      if (onEnded) {
        onEnded();
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, autoplay]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <div ref={videoRef} className="video-js vjs-big-play-centered" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
          <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {title && (
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg">
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
      )}
    </div>
  );
}