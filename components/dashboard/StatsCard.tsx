"use client";

import { useState, useRef, useEffect } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  variant?: "default" | "warning" | "danger";
  primaryColor?: string;
  tooltip?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  variant = "default",
  primaryColor = "#2563EB",
  tooltip,
}: StatsCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">("top");
  const cardRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && tooltipRef.current && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Check if tooltip would be cut off at the top
      if (cardRect.top - tooltipRect.height < 10) {
        setTooltipPosition("bottom");
      } else {
        setTooltipPosition("top");
      }
    }
  }, [showTooltip]);

  const bgColor = variant === "danger" 
    ? "bg-red-50" 
    : variant === "warning" 
    ? "bg-yellow-50" 
    : "bg-white";
  const textColor = variant === "danger"
    ? "text-red-600"
    : variant === "warning" 
    ? "text-yellow-600" 
    : "text-gray-900";

  return (
    <div 
      ref={cardRef}
      className={`relative overflow-visible rounded-lg ${bgColor} px-4 py-5 shadow sm:p-6`}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 text-2xl">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
            <dd 
              className={`mt-1 text-3xl font-semibold ${textColor}`}
              style={variant === "default" ? { color: primaryColor } : undefined}
            >
              {value}
            </dd>
          </dl>
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div 
          ref={tooltipRef}
          className={`absolute left-1/2 -translate-x-1/2 z-[9999] pointer-events-none ${
            tooltipPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="relative bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl max-w-xs w-64">
            <p className="whitespace-normal text-left leading-relaxed">{tooltip}</p>
            {/* Tooltip arrow */}
            <div className={`absolute left-1/2 -translate-x-1/2 ${
              tooltipPosition === "top" 
                ? "top-full -mt-px" 
                : "bottom-full -mb-px rotate-180"
            }`}>
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
