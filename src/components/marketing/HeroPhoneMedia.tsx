"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type HeroPhoneMediaProps = {
  imageAlt: string;
  imageSrc: string;
  videoSrc: string;
};

type NavigatorConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

export default function HeroPhoneMedia({
  imageAlt,
  imageSrc,
  videoSrc,
}: Readonly<HeroPhoneMediaProps>) {
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !videoSrc) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const isDesktopViewport = window.matchMedia(DESKTOP_QUERY).matches;
    const connection = (navigator as NavigatorConnection).connection;

    if (prefersReducedMotion || !isDesktopViewport || connection?.saveData) {
      return;
    }

    let cancelIdle: (() => void) | undefined;

    const deferredEnable = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(
          () => {
            setShouldRenderVideo(true);
          },
          { timeout: 1200 },
        );

        cancelIdle = () => window.cancelIdleCallback(idleId);
        return;
      }

      setShouldRenderVideo(true);
    }, 1800);

    return () => {
      window.clearTimeout(deferredEnable);
      cancelIdle?.();
    };
  }, [videoSrc]);

  return (
    <>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover opacity-80 transition-opacity duration-500"
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 280px"
        quality={58}
        priority
        fetchPriority="high"
      />
      {shouldRenderVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : null}
    </>
  );
}
