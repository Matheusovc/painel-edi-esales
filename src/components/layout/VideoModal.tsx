'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export function VideoModal({ open, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Autoplay on open, pause on close
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (open) {
      v.currentTime = 0
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/[0.12] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-all cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title bar */}
        <div className="px-5 py-3 bg-[rgba(8,12,28,0.95)] border-b border-white/[0.08] flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <p className="text-[12px] text-white/50 font-medium ml-2">Como usar o EDI Assistant</p>
        </div>

        {/* Video */}
        <video
          ref={videoRef}
          src="/videos/0629.mp4"
          className="w-full block bg-black"
          controls
          playsInline
          onEnded={onClose}
          style={{ maxHeight: '75vh' }}
        />
      </div>
    </div>
  )
}
