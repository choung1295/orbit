"use client"

import React, { useEffect, useRef } from "react"
import Hls from "hls.js"

interface VideoPlayerProps {
  src: string
  className?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native support (Safari, iOS)
      video.src = src
    } else if (Hls.isSupported()) {
      // HLS.js support
      const hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
      
      return () => {
        hls.destroy()
      }
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      autoPlay
      muted
      playsInline
    />
  )
}

export default VideoPlayer
