"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { normalizeCsvHeader } from "@/lib/csv-headers";

interface CSVRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  joined_date?: string;
  last_visit_date?: string;
  date_of_birth?: string;
  visits?: string;
  status?: string;
}

export default function CSVUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setValidationErrors([]);

    // Parse CSV for preview - normalize headers
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeCsvHeader(header),
      complete: (results) => {
        const data = results.data as CSVRow[];
        if (data.length === 0) {
          setError("CSV file is empty");
          return;
        }

        // Required: first_name, last_name, email, date_of_birth, status. Visits optional (0–20).
        const requiredHeaders = ["first_name", "last_name", "email", "date_of_birth", "status"];
        const headers = Object.keys(data[0] || {});
        const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(", ")}. Optional: visits (0–20 dates), joined_date, address.`);
          return;
        }

        // Validate first 10 rows
        const errors: string[] = [];
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        data.slice(0, 10).forEach((row, index) => {
          if (!row.first_name || !row.last_name || !row.email?.trim()) {
            errors.push(`Row ${index + 2}: Missing first_name, last_name or email`);
          }
          if (!row.date_of_birth?.trim()) errors.push(`Row ${index + 2}: Missing date_of_birth`);
          if (row.date_of_birth && !dateRe.test(row.date_of_birth)) {
            errors.push(`Row ${index + 2}: Invalid date_of_birth (YYYY-MM-DD)`);
          }
          // Visits: 0–20 allowed; no requirement for at least one visit
          if (row.joined_date && !dateRe.test(row.joined_date)) {
            errors.push(`Row ${index + 2}: Invalid joined_date (YYYY-MM-DD)`);
          }
          if (row.last_visit_date && !dateRe.test(row.last_visit_date)) {
            errors.push(`Row ${index + 2}: Invalid last_visit_date (YYYY-MM-DD)`);
          }
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
        }

        setPreview(data.slice(0, 5)); // Show first 5 rows as preview
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    if (validationErrors.length > 0) {
      setError("Please fix validation errors before uploading");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/members/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle "All rows have errors" with detailed error messages
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
          setError(data.error || "All rows have errors. Please check the validation errors below.");
        } else {
          setError(data.error || "Failed to upload members");
        }
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (data.imported) params.set("imported", String(data.imported));
      if (data.updated) params.set("updated", String(data.updated));
      router.push(`/dashboard?${params.toString()}`);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800 mb-2">Validation Errors:</p>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
            >
              <span>Upload CSV file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">
              Required: first_name, last_name, email, date_of_birth, visits (semicolon-separated dates), status (active/inactive). Optional: joined_date, address. Multiple visits per member improve habit strength analysis. Existing members matched by name + date_of_birth or email are updated; data is merged for rolling analysis.
            </p>
          </div>
        </div>

        {file && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Selected: {file.name}
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Preview (first 5 rows)</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    First Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Joined Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Visit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.first_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.last_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.email || "-"}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.joined_date}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.last_visit_date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {file && validationErrors.length === 0 && (
        <div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Importing members..." : "Import Members"}
          </button>
        </div>
      )}
    </div>
  );
}
