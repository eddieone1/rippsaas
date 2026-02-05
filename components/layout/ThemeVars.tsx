"use client";

import { useEffect } from "react";

interface ThemeVarsProps {
  primary?: string | null;
  secondary?: string | null;
}

export default function ThemeVars({ primary, secondary }: ThemeVarsProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", primary ?? "#2563EB");
    root.style.setProperty("--brand-secondary", secondary ?? "#1E40AF");
    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-secondary");
    };
  }, [primary, secondary]);

  return null;
}
