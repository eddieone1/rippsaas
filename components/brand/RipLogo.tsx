"use client";

interface RipLogoProps {
  variant?: "navbar" | "full";
  className?: string;
}

export default function RipLogo({ variant = "navbar", className = "" }: RipLogoProps) {
  const height = variant === "navbar" ? 36 : 120;

  return (
    <img
      src="/rip logo no back new.png"
      alt="Rip - Retention Intelligence Platform"
      className={`object-contain object-left ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
