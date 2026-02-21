"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector or element ID to highlight
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface ProductTourProps {
  userId: string;
  showTour: boolean;
  onComplete: () => void;
}

export default function ProductTour({ userId, showTour, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(showTour);
  const router = useRouter();

  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Rip! 👋",
      content: "You'll get value in 3 steps: upload your members, send your first outreach, then see which messages actually work. Let's go!",
      position: "center",
    },
    {
      id: "upload",
      title: "Step 1: Upload members",
      content: "Upload your member list via CSV to start tracking who's at risk. Use the 'Get started' checklist to guide you, or head to Members → Upload.",
      target: "[data-tour='stats-cards']",
      position: "bottom",
    },
    {
      id: "attention",
      title: "Step 2: Reach out to at-risk members",
      content: "The 'Who needs attention today' list shows your most urgent members. Use the Email button to send a quick message—or click View for the full profile.",
      target: "[data-tour='members-table']",
      position: "top",
    },
    {
      id: "plays",
      title: "Plays = Your outreach",
      content: "Go to Plays to run campaigns or set up automated messages. Quick-run options for 21+, 30+, or 60+ days inactive.",
      target: "[data-tour='campaigns-nav']",
      position: "bottom",
    },
    {
      id: "insights",
      title: "Step 3: See what works",
      content: "Insights shows which messages bring members back. Rip is the only platform that proves which outreach actually works.",
      target: "[data-tour='navigation']",
      position: "bottom",
    },
    {
      id: "complete",
      title: "You're all set! 🎉",
      content: "Start with uploading your member list, then send your first outreach. Check Insights in a few weeks to see what's working. Happy retaining!",
      position: "center",
    },
  ];

  useEffect(() => {
    setIsVisible(showTour);
    if (showTour) {
      setCurrentStep(0);
      // Prevent body scroll when tour is active
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showTour]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Just call handleComplete which will mark it as done
    handleComplete();
  };

  const handleComplete = async () => {
    setIsVisible(false);
    document.body.style.overflow = "";
    
    // Mark tour as completed in database immediately
    try {
      const response = await fetch("/api/user/mark-tour-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error("Failed to mark tour as complete");
      }
    } catch (error) {
      console.error("Failed to mark tour as complete:", error);
    }

    // Call onComplete which will refresh the page
    onComplete();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50" />

      {/* Tour Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-lime-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.content}</p>
            </div>

            {/* Step Indicator */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-lime-500"
                      : index < currentStep
                      ? "bg-lime-300"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip Tour
              </button>
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400"
                >
                  {currentStep === tourSteps.length - 1 ? "Get Started!" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
