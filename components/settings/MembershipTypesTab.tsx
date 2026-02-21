"use client";

import { useState } from "react";

interface MembershipType {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number | null;
  billing_frequency: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MembershipTypesTabProps {
  membershipTypes: MembershipType[];
  gymId?: string | null;
  onUpdate: () => void;
  onSuccess?: (msg: string) => void;
}

export default function MembershipTypesTab({ membershipTypes, gymId, onUpdate, onSuccess }: MembershipTypesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_frequency: "monthly" as "monthly" | "quarterly" | "yearly" | "one-time" | "custom",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!gymId) {
      setError("Gym ID is required");
      setLoading(false);
      return;
    }

    try {
      const url = editingId 
        ? `/api/settings/membership-types/${editingId}`
        : "/api/settings/membership-types";
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save membership type");
        setLoading(false);
        return;
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        billing_frequency: "monthly",
        is_active: true,
      });
      setShowAddForm(false);
      setEditingId(null);
      onSuccess?.(editingId ? "Membership type updated" : "Membership type created");
      onUpdate();
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleEdit = (type: MembershipType) => {
    setFormData({
      name: type.name,
      description: type.description || "",
      price: type.price?.toString() || "",
      billing_frequency: (type.billing_frequency as any) || "monthly",
      is_active: type.is_active,
    });
    setEditingId(type.id);
    setShowAddForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this membership type? Members assigned to it will have their membership type cleared.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings/membership-types/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete membership type");
        setLoading(false);
        return;
      }

      onSuccess?.("Membership type deleted");
      onUpdate();
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      billing_frequency: "monthly",
      is_active: true,
    });
    setError(null);
  };

  const formatPrice = (type: MembershipType) => {
    if (type.price == null) return "Price on request";
    const freq = type.billing_frequency === "monthly" ? "/mo" : type.billing_frequency === "yearly" ? "/yr" : "";
    return `£${Number(type.price).toFixed(2)}${freq}`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Membership Types</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            + Add Membership Type
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-medium text-gray-900">
            {editingId ? "Edit Membership Type" : "Add New Membership Type"}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                placeholder="e.g., Basic, Premium, Student"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (£)
                </label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="billing_frequency" className="block text-sm font-medium text-gray-700">
                  Billing Frequency
                </label>
                <select
                  id="billing_frequency"
                  value={formData.billing_frequency}
                  onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active (available for new members)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Preview: how members see these */}
      {membershipTypes.length > 0 && (
        <div className="mb-6 rounded-lg border border-lime-200 bg-lime-50/30 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview (as members see them)</p>
          <div className="flex flex-wrap gap-2">
            {membershipTypes.filter((t) => t.is_active).map((type) => (
              <div
                key={type.id}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
              >
                <span className="font-medium text-gray-900">{type.name}</span>
                <span className="ml-2 text-sm text-gray-600">{formatPrice(type)}</span>
              </div>
            ))}
            {membershipTypes.filter((t) => t.is_active).length === 0 && (
              <p className="text-xs text-gray-500">No active types to preview</p>
            )}
          </div>
        </div>
      )}

      {/* Membership Types List */}
      {membershipTypes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">No membership types yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {membershipTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{type.name}</h3>
                  {!type.is_active && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>
                {type.description && (
                  <p className="mt-1 text-sm text-gray-600">{type.description}</p>
                )}
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                  {type.price !== null && (
                    <span>£{type.price.toFixed(2)}</span>
                  )}
                  {type.billing_frequency && (
                    <span>{type.billing_frequency}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(type)}
                  disabled={loading}
                  className="rounded-md bg-lime-50 px-3 py-1.5 text-sm font-medium text-lime-700 hover:bg-lime-100 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  disabled={loading}
                  className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
