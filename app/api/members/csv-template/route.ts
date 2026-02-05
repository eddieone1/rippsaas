import { NextResponse } from "next/server";

export async function GET() {
  const csvContent = `first_name,last_name,email,phone,joined_date,last_visit_date
John,Doe,john@example.com,+447700900123,2024-01-15,2024-03-20
Jane,Smith,jane@example.com,,2024-02-01,2024-03-18
Bob,Johnson,bob@example.com,+447700900456,2024-01-20,2024-03-15`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="member-template.csv"',
    },
  });
}
