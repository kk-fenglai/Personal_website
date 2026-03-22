import { UAParser } from "ua-parser-js";

export type ParsedUa = {
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  deviceModel: string | null;
};

/** 从 User-Agent 解析浏览器、系统、设备类型与机型（便于区分访客） */
export function parseVisitUserAgent(userAgent: string | null | undefined): ParsedUa {
  const raw = userAgent?.trim();
  if (!raw) {
    return { browser: null, os: null, deviceType: null, deviceModel: null };
  }

  const parser = new UAParser(raw);
  const b = parser.getBrowser();
  const o = parser.getOS();
  const d = parser.getDevice();

  const browser =
    [b.name, b.version?.split(".").slice(0, 2).join(".")].filter(Boolean).join(" ") ||
    null;

  const os =
    [o.name, o.version?.split(".").slice(0, 2).join(".")].filter(Boolean).join(" ") ||
    null;

  const deviceType = d.type ?? "desktop";

  const modelParts = [d.vendor, d.model].filter(Boolean);
  const deviceModel = modelParts.length > 0 ? modelParts.join(" ") : null;

  return { browser, os, deviceType, deviceModel };
}

export function isNonRoutableIp(ip: string): boolean {
  const t = ip.trim();
  if (!t || t === "::1" || t === "127.0.0.1") return true;
  if (t.startsWith("10.")) return true;
  if (t.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(t)) return true;
  if (t === "::ffff:127.0.0.1") return true;
  return false;
}

export type GeoResult = {
  country: string | null;
  region: string | null;
  city: string | null;
};

/**
 * 使用 ip-api.com（免费，非商用场景；服务端 HTTP 请求）
 * 公网 IP 返回国家/省州/城市，便于辨认访客大致位置。
 */
export async function lookupIpGeo(ip: string): Promise<GeoResult> {
  if (!ip || isNonRoutableIp(ip)) {
    return { country: null, region: null, city: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city`;
    const res = await fetch(url, { signal: controller.signal });
    const data = (await res.json()) as {
      status?: string;
      country?: string;
      countryCode?: string;
      regionName?: string;
      city?: string;
    };
    if (data.status !== "success") {
      return { country: null, region: null, city: null };
    }
    const country =
      data.country && data.countryCode
        ? `${data.country} (${data.countryCode})`
        : data.country ?? data.countryCode ?? null;
    return {
      country,
      region: data.regionName ?? null,
      city: data.city ?? null,
    };
  } catch {
    return { country: null, region: null, city: null };
  } finally {
    clearTimeout(timer);
  }
}

/** 合并 Vercel 边缘提供的国家码与 Geo 查询结果 */
export function mergeGeo(
  geo: GeoResult,
  vercelCountryCode: string | null,
  vercelRegionCode: string | null
): GeoResult {
  let country = geo.country;
  if (!country && vercelCountryCode?.trim()) {
    country = vercelCountryCode.trim().toUpperCase();
  }
  let region = geo.region;
  if (!region && vercelRegionCode?.trim()) {
    region = vercelRegionCode.trim();
  }
  return {
    country,
    region,
    city: geo.city,
  };
}
