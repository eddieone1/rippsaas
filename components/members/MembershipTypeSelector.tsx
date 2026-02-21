"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  billing_frequency: string | null;
}

interface MembershipTypeSelectorProps {
  memberId: string;
  currentMembershipTypeId: string | null;
  membershipTypes: MembershipType[];
}

export default function MembershipTypeSelector({
  memberId,
  currentMembershipTypeId,
  membershipTypes,
}: MembershipTypeSelectorProps) {
  const router = useRouter();
  const [selectedTypeId, setSelectedTypeId] = useState<string>(currentMembershipTypeId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentType = membershipTypes.find((t) => t.id === currentMembershipTypeId);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTypeId = e.target.value;
    setSelectedTypeId(newTypeId);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/members/${memberId}/update-membership-type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          membership_type_id: newTypeId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update membership type");
        setSelectedTypeId(currentMembershipTypeId || "");
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setSelectedTypeId(currentMembershipTypeId || "");
      setLoading(false);
    }
  };

  if (membershipTypes.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        No membership types available. 
        <Link href="/settings" className="text-lime-600 hover:text-lime-800 ml-1">
          Create one in Settings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <select
        value={selectedTypeId}
        onChange={handleChange}
        disabled={loading}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">No membership type</option>
        {membershipTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
            {type.price !== null && ` - £${type.price.toFixed(2)}`}
            {type.billing_frequency && ` (${type.billing_frequency})`}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      {currentType && currentType.description && (
        <p className="mt-1 text-xs text-gray-500">{currentType.description}</p>
      )}
    </div>
  );
}
