"use client";

import Image from "next/image";
import { canResizeRemoteImage } from "@/lib/photoUrl";

type PhotoImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

/** Blob 上的图交给 next/image 按显示尺寸缩放；白名单之外的远程图只能用原生 img */
export function PhotoImage({
  src,
  alt,
  className = "",
  fill,
  sizes,
  priority,
}: PhotoImageProps) {
  const isRemote = /^https?:\/\//i.test(src) && !(fill && canResizeRemoteImage(src));

  if (isRemote) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
