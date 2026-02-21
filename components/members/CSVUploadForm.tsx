"use client";

import { useState, useRef, useCallback } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setValidationErrors([]);

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

        const requiredHeaders = ["first_name", "last_name", "email", "date_of_birth", "status"];
        const headers = Object.keys(data[0] || {});
        const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(", ")}. Optional: visits (0–20 dates), joined_date, address.`);
          return;
        }

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

        setPreview(data.slice(0, 5));
      },
      error: (parseError) => {
        setError(`Failed to parse CSV: ${parseError.message}`);
      },
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) processFile(droppedFile);
    },
    [processFile]
  );

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setError(null);
    setValidationErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        const detailErrors = data.details?.errors ?? data.errors;
        if (detailErrors && Array.isArray(detailErrors)) {
          setValidationErrors(detailErrors);
          setError(data.error || "All rows have errors. Please check the validation errors below.");
        } else {
          setError(data.error || "Failed to upload members");
        }
        setLoading(false);
        return;
      }

      const result = data.data ?? data;
      const params = new URLSearchParams();
      if (result.imported) params.set("imported", String(result.imported));
      if (result.updated) params.set("updated", String(result.updated));
      router.push(`/dashboard?${params.toString()}`);
      router.refresh();
    } catch {
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

      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 transition-colors duration-150 ${
          isDragging
            ? "border-lime-500 bg-lime-50"
            : file
              ? "border-lime-400 bg-lime-50/40"
              : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        {file ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-700">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M9 15l2 2 4-4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                    {preview.length > 0 && ` · ${preview.length}+ rows parsed`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Change file
                </button>
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg
                className={`h-7 w-7 transition-colors ${isDragging ? "text-lime-600" : "text-gray-400"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">
              {isDragging ? "Drop your CSV file here" : "Drag & drop your CSV file here"}
            </p>
            <p className="mt-1 text-sm text-gray-500">or</p>
            <div className="relative mt-2 inline-block">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="inline-flex items-center rounded-md border border-lime-500 bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-lime-400">
                Browse files
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400">CSV files only</p>
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
                    Date of Birth
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
                    <td className="px-4 py-2 text-sm text-gray-600">{row.date_of_birth || "-"}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row.joined_date || "-"}</td>
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
            className="w-full rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Importing members..." : "Import Members"}
          </button>
        </div>
      )}
    </div>
  );
}
