"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: "email" | "sms";
}

interface RunCampaignModalProps {
  gymId: string;
  triggerDays: number;
  templates: Template[];
  onClose: () => void;
  recommendedTemplateId?: string;
  onRun: (config: {
    triggerDays: number;
    channel: "email" | "sms";
    message_type: "template" | "custom";
    template_id?: string;
    custom_subject?: string;
    custom_body?: string;
    target_segment?: "low" | "medium" | "high" | "all";
    include_cancelled?: boolean;
  }) => void;
  loading: boolean;
  initialTemplateId?: string;
  initialChannel?: "email" | "sms";
  initialTargetSegment?: "low" | "medium" | "high" | "all";
  initialIncludeCancelled?: boolean;
}

export default function RunCampaignModal({
  gymId,
  triggerDays,
  templates,
  onClose,
  onRun,
  loading,
  initialTemplateId,
  initialChannel = "email",
  initialTargetSegment,
  initialIncludeCancelled,
  recommendedTemplateId,
}: RunCampaignModalProps) {
  const [channel, setChannel] = useState<"email" | "sms">(initialChannel);
  const [messageType, setMessageType] = useState<"template" | "custom">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId ?? "");
  const [targetSegment, setTargetSegment] = useState<"low" | "medium" | "high" | "all">(initialTargetSegment ?? "all");
  const [includeCancelled, setIncludeCancelled] = useState(initialIncludeCancelled ?? false);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  // Filter templates by channel
  const channelTemplates = templates.filter((t) => t.channel === channel);

  // Fetch audience count when params change
  useEffect(() => {
    const params = new URLSearchParams({
      trigger_days: String(triggerDays),
      channel,
      target_segment: targetSegment,
      include_cancelled: String(includeCancelled),
    });
    fetch(`/api/campaigns/preview-count?${params}`)
      .then((r) => r.json())
      .then((d) => setAudienceCount(d.count ?? 0))
      .catch(() => setAudienceCount(null));
  }, [triggerDays, channel, targetSegment, includeCancelled]);

  useEffect(() => {
    if (!initialTemplateId) return;
    const t = channelTemplates.find((t) => t.id === initialTemplateId);
    if (t) {
      setSelectedTemplateId(initialTemplateId);
      setTemplateSubject(t.subject);
      setTemplateBody(t.body);
    }
  }, [initialTemplateId, channel]);

  // When template is selected, populate editable fields
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const selectedTemplate = channelTemplates.find((t) => t.id === templateId);
      if (selectedTemplate) {
        setTemplateSubject(selectedTemplate.subject);
        setTemplateBody(selectedTemplate.body);
      }
    } else {
      setTemplateSubject("");
      setTemplateBody("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (messageType === "template" && !selectedTemplateId) {
      return; // Form validation will handle this
    }

    if (messageType === "custom" && (!customSubject || !customBody)) {
      return; // Form validation will handle this
    }

    // If using template, use the edited template fields; otherwise use custom fields
    // Always send as custom when template fields are edited, otherwise send template_id
    const finalSubject = messageType === "template" ? templateSubject : customSubject;
    const finalBody = messageType === "template" ? templateBody : customBody;

    onRun({
      triggerDays,
      channel,
      message_type: messageType,
      template_id: messageType === "template" ? selectedTemplateId : undefined,
      custom_subject: finalSubject || undefined,
      custom_body: finalBody || undefined,
      target_segment: targetSegment,
      include_cancelled: includeCancelled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Send Outreach - {triggerDays}+ Days Inactive
            </h3>
            {audienceCount !== null && (
              <p className="mt-1 text-sm text-gray-600">
                ~{audienceCount} member{audienceCount !== 1 ? "s" : ""} match{audienceCount === 1 ? "es" : ""}
                {audienceCount === 0 && " — no members match this criteria"}
              </p>
            )}
            {recommendedTemplateId && (
              <p className="mt-1 text-xs text-lime-700">
                ✓ Use your best-performing template for higher re-engagement
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => {
                    setChannel(e.target.value as "email" | "sms");
                    setSelectedTemplateId(""); // Reset template selection when changing channel
                    setTemplateSubject("");
                    setTemplateBody("");
                  }}
                  className="mr-2"
                  disabled={loading}
                />
                Email
              </label>
              <label className="flex items-center text-gray-900">
                <input
                  type="radio"
                  name="channel"
                  value="sms"
                  checked={channel === "sms"}
                  onChange={(e) => {
                    setChannel(e.target.value as "email" | "sms");
                    setSelectedTemplateId(""); // Reset template selection when changing channel
                    setTemplateSubject("");
                    setTemplateBody("");
                  }}
                  className="mr-2"
                  disabled={loading}
                />
                SMS
              </label>
            </div>
          </div>

          {/* Target Segment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target segment
            </label>
            <select
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value as "low" | "medium" | "high" | "all")}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              disabled={loading}
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
              id="runIncludeCancelled"
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
              disabled={loading}
            />
            <label htmlFor="runIncludeCancelled" className="text-sm font-medium text-gray-700">
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
              onChange={(e) => {
                setMessageType(e.target.value as "template" | "custom");
                setSelectedTemplateId("");
                setTemplateSubject("");
                setTemplateBody("");
                setCustomSubject("");
                setCustomBody("");
              }}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              disabled={loading}
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
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                required={messageType === "template"}
                disabled={loading}
              >
                <option value="">Select a template...</option>
                {channelTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {recommendedTemplateId === template.id ? " — Best performer" : ""}
                  </option>
                ))}
              </select>
              {selectedTemplateId && (
                <>
                  <div className="mt-4">
                    <label htmlFor="templateSubject" className="block text-sm font-medium text-gray-700">
                      Subject {channel === "sms" && "(First line of SMS)"}
                    </label>
                    <input
                      type="text"
                      id="templateSubject"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                      required={messageType === "template"}
                      placeholder={channel === "sms" ? "SMS preview text..." : "Email subject..."}
                      disabled={loading}
                    />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="templateBody" className="block text-sm font-medium text-gray-700">
                      Message Body
                    </label>
                    <textarea
                      id="templateBody"
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      rows={channel === "sms" ? 4 : 8}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                      required={messageType === "template"}
                      placeholder={channel === "sms" ? "SMS message (max 160 characters recommended)..." : "Email message body...\n\nYou can use variables: {{first_name}}, {{gym_name}}, {{last_visit_date}}"}
                      disabled={loading}
                    />
                    {channel === "sms" && (
                      <p className="mt-1 text-xs text-gray-500">
                        {templateBody.length} characters (SMS recommended: 160 characters or less)
                      </p>
                    )}
                  </div>
                </>
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
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                  required={messageType === "custom"}
                  placeholder={channel === "sms" ? "SMS preview text..." : "Email subject..."}
                  disabled={loading}
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
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                  required={messageType === "custom"}
                  placeholder={channel === "sms" ? "SMS message (max 160 characters recommended)..." : "Email message body...\n\nYou can use variables: {{first_name}}, {{gym_name}}, {{last_visit_date}}"}
                  disabled={loading}
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
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || audienceCount === 0}
              className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50"
            >
              {loading ? "Sending..." : audienceCount === 0 ? "No members match" : `Send ${triggerDays} Days Outreach`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
