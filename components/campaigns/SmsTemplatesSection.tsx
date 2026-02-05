"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: "email" | "sms";
}

interface SmsTemplatesSectionProps {
  templates: Template[];
  onTemplatesUpdate: () => void;
}

export default function SmsTemplatesSection({
  templates,
  onTemplatesUpdate,
}: SmsTemplatesSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const smsTemplates = templates.filter((t) => t.channel === "sms");

  const handleSeedTemplates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/campaigns/templates/sms", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create SMS templates");
        setLoading(false);
        return;
      }

      setSuccess(`Successfully created ${data.created} SMS templates`);
      setLoading(false);
      
      // Refresh templates
      setTimeout(() => {
        onTemplatesUpdate();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">SMS Templates</h2>
            <p className="mt-1 text-sm text-gray-600">
              Pre-built SMS message templates for engagement campaigns
            </p>
          </div>
          {smsTemplates.length === 0 && (
            <button
              onClick={handleSeedTemplates}
              disabled={loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "+ Add Default Templates"}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {smsTemplates.length === 0 ? (
          <div className="rounded-md bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              No SMS templates available. Click the button above to add default templates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {smsTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-md border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {template.body}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Variables: {template.body.match(/\{\{(\w+)\}\}/g)?.join(", ") || "None"}
                    </p>
                  </div>
                  <span className="ml-4 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    SMS
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
