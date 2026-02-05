"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductTour from "./ProductTour";

interface ProductTourWrapperProps {
  userId: string;
}

export default function ProductTourWrapper({ userId }: ProductTourWrapperProps) {
  const [showTour, setShowTour] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if tour was already completed (from localStorage as backup)
    const tourCompleted = localStorage.getItem(`tour_completed_${userId}`);
    if (tourCompleted === "true") {
      return; // Don't show tour if already completed
    }

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      setShowTour(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [userId]);

  const handleComplete = async () => {
    setShowTour(false);
    
    // Mark as completed in localStorage immediately to prevent re-showing
    localStorage.setItem(`tour_completed_${userId}`, "true");
    
    // Mark as completed in database
    try {
      await fetch("/api/user/mark-tour-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error("Failed to mark tour as complete:", error);
    }
    
    // Refresh the page to update the tour status
    setTimeout(() => {
      router.refresh();
    }, 200);
  };

  if (!showTour) return null;

  return <ProductTour userId={userId} showTour={showTour} onComplete={handleComplete} />;
}
