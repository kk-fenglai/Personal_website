"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";

const STORAGE_KEY = "season";

function getStoredSeason(): Season {
  if (typeof window === "undefined") return "winter";
  const s = localStorage.getItem(STORAGE_KEY) as Season | null;
  if (s === "spring" || s === "summer" || s === "autumn" || s === "winter") return s;
  return "winter";
}

function setStoredSeason(season: Season) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, season);
}

type SeasonContextValue = {
  season: Season;
  setSeason: (season: Season) => void;
};

const SeasonContext = createContext<SeasonContextValue | null>(null);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeasonState] = useState<Season>("winter");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSeasonState(getStoredSeason());
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-season", season);
  }, [season]);

  const setSeason = useCallback((s: Season) => {
    setSeasonState(s);
    setStoredSeason(s);
  }, []);

  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used within SeasonProvider");
  return ctx;
}

export const seasonLabels: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};
