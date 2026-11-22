import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 上传文件名带时间戳和随机串，内容不会变，缩放结果可以长期缓存
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Vercel Blob 相册上传（未配置时 Next/Image 会拒绝加载）
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
