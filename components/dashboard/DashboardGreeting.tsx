"use client";

import { useState, useEffect } from "react";

const MORNING_GREETINGS = ["Good morning", "Good morning", "Rise and shine"];
const AFTERNOON_GREETINGS = ["Good afternoon", "Hello", "Hi there"];
const EVENING_GREETINGS = ["Good evening", "Nice to see you", "Welcome back"];

function getGreeting() {
  const hour = new Date().getHours();
  const arr = hour < 12 ? MORNING_GREETINGS : hour < 17 ? AFTERNOON_GREETINGS : EVENING_GREETINGS;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Personalized greeting shown on dashboard.
 * Time-based with randomised variations. Greeting is resolved client-side only to avoid hydration mismatch.
 */
export default function DashboardGreeting({ userName }: { userName: string | null }) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  if (!userName) return null;

  const displayName = userName.trim() || "there";

  return (
    <p className="text-3xl sm:text-4xl text-gray-700 mb-1">
      {greeting ?? "Hello"}, <span className="font-semibold text-gray-900">{displayName}</span>
    </p>
  );
}
