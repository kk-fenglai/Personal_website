"use client";

import Image from "next/image";

type PhotoImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

/** 远程图（Vercel Blob 等）用原生 img，避免 next/image 域名白名单导致前台不显示 */
export function PhotoImage({
  src,
  alt,
  className = "",
  fill,
  sizes,
  priority,
}: PhotoImageProps) {
  const isRemote = /^https?:\/\//i.test(src);

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
