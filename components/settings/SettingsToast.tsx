"use client";

import { useEffect } from "react";

interface SettingsToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Toast for success feedback – fixed bottom-right, auto-dismisses after 3 seconds.
 */
export default function SettingsToast({ message, visible, onDismiss }: SettingsToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-lime-200 bg-white px-4 py-3 shadow-lg"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-100">
        <svg className="h-4 w-4 text-lime-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <p className="text-sm font-medium text-gray-900">{message}</p>
    </div>
  );
}
