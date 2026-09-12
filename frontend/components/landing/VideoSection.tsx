'use client';

import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/cn';

export function VideoSection(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 sm:mb-14 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.15]">
            See SAKSHAM in action
          </h2>
        </div>

        {/* Video Container */}
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl group cursor-pointer" onClick={handlePlayClick}>
          
          <video
            ref={videoRef}
            src="/videos/saksham.mp4"
            className="w-full h-auto aspect-video object-cover"
            loop
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Overlay that fades out when playing */}
          <div 
            className={cn(
              "absolute inset-0 bg-black/40 transition-opacity duration-500 flex flex-col items-center justify-center",
              isPlaying ? "opacity-0" : "opacity-100"
            )}
          >
            {/* The SAKSHAM text styled like COSMOSX */}
            <h2 
              className="text-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.2em] font-serif uppercase mb-8 drop-shadow-2xl text-center pl-[0.2em]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              SAKSHAM
            </h2>

            {/* Play Button */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white translate-x-1" fill="white" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
