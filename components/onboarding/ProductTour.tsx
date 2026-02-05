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
      id: "dashboard-overview",
      title: "Welcome to Rip! 👋",
      content: "This is your Retention Dashboard. Here you can monitor members at risk of leaving and track your engagement campaigns. Let's take a quick tour of the key features.",
      position: "center",
    },
    {
      id: "stats-cards",
      title: "Dashboard Statistics",
      content: "These cards show your key metrics: total active members, members at risk, campaigns sent this month, and re-engagement rates. Keep an eye on these to track your gym's retention performance.",
      target: "[data-tour='stats-cards']",
      position: "bottom",
    },
    {
      id: "members-table",
      title: "Members at Risk",
      content: "This table shows members who are at risk of churning, sorted by risk level. Click 'View Details' to see more information about each member and take action.",
      target: "[data-tour='members-table']",
      position: "top",
    },
    {
      id: "navigation",
      title: "Navigation Menu",
      content: "Use the navigation bar to access different sections: Dashboard (current page), Members (view all members), Campaigns (run engagement campaigns), and Settings (manage your gym profile and branding).",
      target: "[data-tour='navigation']",
      position: "bottom",
    },
    {
      id: "members-page",
      title: "Members Page",
      content: "Click 'Members' in the navigation to view all your members. You can filter by status (active/inactive/cancelled) and risk level, search by name or email, and upload new members via CSV.",
      target: "[data-tour='members-nav']",
      position: "bottom",
    },
    {
      id: "campaigns-page",
      title: "Campaigns Page",
      content: "Use the 'Campaigns' page to create and send automated engagement emails or SMS to members who haven't visited in a while. You can create custom campaigns or use quick-run buttons for 21+, 30+, or 60+ days inactive members.",
      target: "[data-tour='campaigns-nav']",
      position: "bottom",
    },
    {
      id: "settings-page",
      title: "Settings Page",
      content: "In 'Settings', you can manage your gym profile, upload your logo and set brand colours, create membership types, and manage email templates. Customise your branding to make emails look professional!",
      target: "[data-tour='settings-nav']",
      position: "bottom",
    },
    {
      id: "member-actions",
      title: "Member Actions",
      content: "When viewing a member's detail page, you can send engagement emails (friendly 'we miss you' messages or 'bring a friend' offers), mark them as re-engaged, or update their last visit date.",
      position: "center",
    },
    {
      id: "churn-risk",
      title: "Churn Risk Calculation",
      content: "Members are automatically scored based on attendance, payment patterns, booking frequency, engagement, distance from gym, age, and employment status. High risk members need immediate attention!",
      position: "center",
    },
    {
      id: "complete",
      title: "You're All Set! 🎉",
      content: "You now know the basics of Rip! Start by uploading your member list via CSV, then explore the Members and Campaigns pages. If you need help, check the Settings page for more options. Happy retaining!",
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
              className="h-full bg-blue-600 transition-all duration-300"
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
                      ? "bg-blue-600"
                      : index < currentStep
                      ? "bg-blue-300"
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
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
