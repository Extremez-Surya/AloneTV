// Type definitions for video.js modules
declare module 'video.js' {
  export default function videojs(
    element: HTMLVideoElement | string,
    options?: any,
    ready?: () => void
  ): import('video.js/dist/types/player').default;
}