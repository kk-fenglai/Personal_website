import { UAParser } from "ua-parser-js";

export type ParsedUa = {
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  deviceModel: string | null;
};

/** 解析 User-Agent：浏览器、系统、设备类型与型号（便于后台辨认访客环境） */
export function parseVisitUserAgent(uaStr: string | null | undefined): ParsedUa {
  if (!uaStr?.trim()) {
    return { browser: null, os: null, deviceType: null, deviceModel: null };
  }
  try {
    const parser = new UAParser(uaStr);
    const r = parser.getResult();

    const browserName = r.browser?.name?.trim();
    const major = r.browser?.version?.split(".")[0];
    const browser =
      browserName != null
        ? major
          ? `${browserName} ${major}`
          : browserName
        : null;

    const osName = r.os?.name?.trim();
    const osVer = r.os?.version?.trim();
    const os =
      osName != null ? `${osName}${osVer ? ` ${osVer}` : ""}`.trim() : null;

    let deviceType = r.device?.type?.trim() || null;
    if (!deviceType) {
      if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(uaStr)) deviceType = "mobile";
      else if (/Tablet|iPad|Pad\)/i.test(uaStr)) deviceType = "tablet";
      else deviceType = "desktop";
    }

    const vendor = r.device?.vendor?.trim();
    const model = r.device?.model?.trim();
    let deviceModel: string | null = null;
    if (model && vendor && model !== vendor) deviceModel = `${vendor} ${model}`;
    else if (model) deviceModel = model;
    else if (vendor) deviceModel = vendor;

    return {
      browser: browser ? browser.slice(0, 128) : null,
      os: os ? os.slice(0, 128) : null,
      deviceType: deviceType ? deviceType.slice(0, 64) : null,
      deviceModel: deviceModel ? deviceModel.slice(0, 128) : null,
    };
  } catch {
    return { browser: null, os: null, deviceType: null, deviceModel: null };
  }
}

function isPrivateOrLocalIp(ip: string): boolean {
  const s = ip.trim();
  if (!s || s === "::1" || s === "127.0.0.1") return true;
  if (s.startsWith("10.")) return true;
  if (s.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(s)) return true;
  if (s.startsWith("fe80:") || s === "::ffff:127.0.0.1") return true;
  return false;
}

export type GeoFields = {
  country: string | null;
  region: string | null;
  city: string | null;
};

/** 通过 ip-api.com 查询 IP 地理（公网 IP；内网/本地返回空） */
export async function lookupIpGeo(ip: string | null | undefined): Promise<GeoFields> {
  if (!ip?.trim() || isPrivateOrLocalIp(ip)) {
    return { country: null, region: null, city: null };
  }
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip.trim())}?fields=status,message,country,regionName,city`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const data = (await res.json()) as {
      status?: string;
      country?: string;
      regionName?: string;
      city?: string;
    };
    if (data.status !== "success") {
      return { country: null, region: null, city: null };
    }
    return {
      country: data.country?.trim() || null,
      region: data.regionName?.trim() || null,
      city: data.city?.trim() || null,
    };
  } catch {
    return { country: null, region: null, city: null };
  }
}

/** Vercel 边缘头与 IP 库结果合并（国家/大区优先用 Vercel，城市多用 IP 库） */
export function mergeGeo(
  fromIp: GeoFields,
  vercelCountry: string | null | undefined,
  vercelRegion: string | null | undefined
): GeoFields {
  const c = (vercelCountry?.trim() || fromIp.country || null)?.slice(0, 128) || null;
  const r = (vercelRegion?.trim() || fromIp.region || null)?.slice(0, 128) || null;
  const city = fromIp.city?.slice(0, 128) || null;
  return { country: c, region: r, city: city || null };
}
