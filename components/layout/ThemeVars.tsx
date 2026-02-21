"use client";

import { useEffect } from "react";

interface ThemeVarsProps {
  primary?: string | null;
  secondary?: string | null;
}

export default function ThemeVars({ primary, secondary }: ThemeVarsProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", primary ?? "#84cc16");
    root.style.setProperty("--brand-secondary", secondary ?? "#65a30d");
    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-secondary");
    };
  }, [primary, secondary]);

  return null;
}
