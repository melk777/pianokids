"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface SupportedVideoProps {
  src: string;
  type: "video/webm" | "video/mp4";
  poster: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  observeVisibility?: boolean;
}

export default function SupportedVideo({
  src,
  type,
  poster,
  alt,
  className,
  fallbackClassName,
  observeVisibility = false,
}: SupportedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [checkedSupport, setCheckedSupport] = useState(false);

  useEffect(() => {
    const probe = document.createElement("video");
    setCanPlay(probe.canPlayType(type) !== "");
    setCheckedSupport(true);
  }, [type]);

  useEffect(() => {
    if (!observeVisibility || !canPlay) return;

    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [canPlay, observeVisibility]);

  if (!checkedSupport || !canPlay) {
    return (
      <div className={fallbackClassName ?? className ?? "relative h-full w-full"}>
        <Image src={poster} alt={alt} fill className="object-cover" priority />
      </div>
    );
  }

  return (
    <video ref={videoRef} autoPlay muted loop playsInline poster={poster} className={className}>
      <source src={src} type={type} />
    </video>
  );
}
