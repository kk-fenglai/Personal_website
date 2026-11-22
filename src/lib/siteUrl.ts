/** 站点对外的完整地址，用于分享卡片图等需要绝对链接的地方 */
export function resolveSiteUrl(env: Record<string, string | undefined>): string {
  const explicit = env.SITE_URL?.trim();
  const vercelProduction = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelDeployment = env.VERCEL_URL?.trim();
  const url =
    explicit ||
    (vercelProduction && `https://${vercelProduction}`) ||
    (vercelDeployment && `https://${vercelDeployment}`) ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
