"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: "email" | "sms";
}

interface CreateCampaignFormProps {
  templates: Template[];
  gymId: string;
}

export default function CreateCampaignForm({ templates, gymId }: CreateCampaignFormProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [messageType, setMessageType] = useState<"template" | "custom">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [campaignName, setCampaignName] = useState("");
  const [triggerDays, setTriggerDays] = useState<number>(14);
  const [targetSegment, setTargetSegment] = useState<"low" | "medium" | "high" | "all">("all");
  const [includeCancelled, setIncludeCancelled] = useState(false);

  // Custom message fields
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");

  // Filter templates by channel
  const channelTemplates = templates.filter((t) => t.channel === channel);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gym_id: gymId,
          name: campaignName,
          channel,
          trigger_days: triggerDays,
          message_type: messageType,
          template_id: messageType === "template" ? selectedTemplateId : null,
          custom_subject: messageType === "custom" ? customSubject : null,
          custom_body: messageType === "custom" ? customBody : null,
          target_segment: targetSegment,
          include_cancelled: includeCancelled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create campaign");
        setLoading(false);
        return;
      }

      // Reset form and close
      setShowForm(false);
      setCampaignName("");
      setTriggerDays(14);
      setSelectedTemplateId("");
      setCustomSubject("");
      setCustomBody("");
      setMessageType("template");
      
      // Refresh the page to show new campaign
      router.refresh();
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mb-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        + Create New Campaign
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Create New Campaign</h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campaign Name */}
        <div>
          <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700">
            Campaign Name
          </label>
          <input
            type="text"
            id="campaignName"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
            placeholder="e.g., 14 Days Inactive Email Campaign"
          />
        </div>

        {/* Channel Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel
          </label>
          <div className="flex gap-4">
              <label className="flex items-center text-gray-900">
              <input
                type="radio"
                name="channel"
                value="email"
                checked={channel === "email"}
                onChange={(e) => setChannel(e.target.value as "email" | "sms")}
                className="mr-2"
              />
              Email
            </label>
            <label className="flex items-center text-gray-900">
              <input
                type="radio"
                name="channel"
                value="sms"
                checked={channel === "sms"}
                onChange={(e) => setChannel(e.target.value as "email" | "sms")}
                className="mr-2"
              />
              SMS
            </label>
          </div>
        </div>

        {/* Trigger Days */}
        <div>
          <label htmlFor="triggerDays" className="block text-sm font-medium text-gray-700">
            Trigger Days (Days of inactivity)
          </label>
          <input
            type="number"
            id="triggerDays"
            value={triggerDays}
            onChange={(e) => setTriggerDays(parseInt(e.target.value) || 14)}
            min="1"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>

        {/* Target Segment */}
        <div>
          <label htmlFor="targetSegment" className="block text-sm font-medium text-gray-700">
            Target segment
          </label>
          <select
            id="targetSegment"
            value={targetSegment}
            onChange={(e) => setTargetSegment(e.target.value as "low" | "medium" | "high" | "all")}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="all">All risk levels</option>
            <option value="low">Low risk members</option>
            <option value="medium">Medium risk members</option>
            <option value="high">High risk members</option>
          </select>
        </div>

        {/* Include cancelled members */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeCancelled"
            checked={includeCancelled}
            onChange={(e) => setIncludeCancelled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="includeCancelled" className="text-sm font-medium text-gray-700">
            Include cancelled members
          </label>
        </div>

        {/* Message Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type
          </label>
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value as "template" | "custom")}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="template">Use Template</option>
            <option value="custom">Custom Message</option>
          </select>
        </div>

        {/* Template Selection (if template selected) */}
        {messageType === "template" && (
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700">
              Select Template
            </label>
            <select
              id="template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required={messageType === "template"}
            >
              <option value="">Select a template...</option>
              {channelTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {selectedTemplateId && (
              <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
                {channelTemplates.find((t) => t.id === selectedTemplateId) && (
                  <>
                    <p className="font-medium">
                      Subject: {channelTemplates.find((t) => t.id === selectedTemplateId)?.subject}
                    </p>
                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                      {channelTemplates.find((t) => t.id === selectedTemplateId)?.body}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Custom Message Fields (if custom selected) */}
        {messageType === "custom" && (
          <>
            <div>
              <label htmlFor="customSubject" className="block text-sm font-medium text-gray-700">
                Subject {channel === "sms" && "(First line of SMS)"}
              </label>
              <input
                type="text"
                id="customSubject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required={messageType === "custom"}
                placeholder={channel === "sms" ? "SMS preview text..." : "Email subject..."}
              />
            </div>
            <div>
              <label htmlFor="customBody" className="block text-sm font-medium text-gray-700">
                Message Body
              </label>
              <textarea
                id="customBody"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows={channel === "sms" ? 4 : 8}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required={messageType === "custom"}
                placeholder={channel === "sms" ? "SMS message (max 160 characters recommended)..." : "Email message body...\n\nYou can use variables: {{first_name}}, {{gym_name}}, {{last_visit_date}}"}
              />
              {channel === "sms" && (
                <p className="mt-1 text-xs text-gray-500">
                  {customBody.length} characters (SMS recommended: 160 characters or less)
                </p>
              )}
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
