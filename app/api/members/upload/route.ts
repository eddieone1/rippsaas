import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Papa from "papaparse";
import { normalizeCsvHeader } from "@/lib/csv-headers";
import { calculateChurnRisk } from "@/lib/churn-risk";
import { geocodeAddress, calculateDistance } from "@/lib/proximity";
import { recalculateCommitmentScoresForGym } from "@/lib/jobs/commitment-scores";
import { detectAtRiskMembersForGym } from "@/lib/jobs/at-risk-detection";


function normalizeName(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's gym_id
    const { data: userProfile } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.gym_id) {
      return NextResponse.json(
        { error: "Gym not found" },
        { status: 404 }
      );
    }

    // Fetch gym coordinates for distance calculation
    const { data: gym, error: gymError } = await supabase
      .from("gyms")
      .select("latitude, longitude, postcode")
      .eq("id", userProfile.gym_id)
      .single();

    if (gymError) {
      console.error("Error fetching gym coordinates:", gymError);
      // Continue without gym coordinates if there's an error, distance will be null
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Parse CSV - normalize headers to handle common variations
    const text = await file.text();
    const parseResult = Papa.parse<{
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      joined_date?: string;
      last_visit_date?: string;
      date_of_birth?: string;
      visits?: string;
      status?: string;
      billing_address_line1?: string;
      billing_address_line2?: string;
      billing_city?: string;
      billing_postcode?: string;
      billing_country?: string;
      billing_address?: string;
      address?: string;
    }>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeCsvHeader(header),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: `CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(", ")}` },
        { status: 400 }
      );
    }

    const rows = parseResult.data;
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    // Fetch existing members for this gym to recognise and update (dedupe by name, DOB, email)
    const { data: existingMembers } = await supabase
      .from("members")
      .select("id, first_name, last_name, email, date_of_birth")
      .eq("gym_id", userProfile.gym_id);

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const findExistingMember = (
      row: { first_name: string; last_name: string; email?: string; date_of_birth?: string },
      rowNum: number
    ): { member: any } | null | "ambiguous" => {
      const firstNorm = normalizeName(row.first_name);
      const lastNorm = normalizeName(row.last_name);
      const rowDob = row.date_of_birth?.trim() || null;
      const rowEmail = (row.email?.trim() || "").toLowerCase() || null;
      let candidates = (existingMembers || []).filter(
        (m: any) =>
          normalizeName(m.first_name) === firstNorm && normalizeName(m.last_name) === lastNorm
      );
      if (candidates.length === 0) return null;
      if (rowDob) candidates = candidates.filter((m: any) => m.date_of_birth === rowDob);
      if (rowEmail) candidates = candidates.filter((m: any) => (m.email || "").toLowerCase() === rowEmail);
      if (candidates.length > 1) {
        errors.push(`Row ${rowNum}: Multiple members match; add date_of_birth or email to differentiate`);
        return "ambiguous";
      }
      return candidates.length === 1 ? { member: candidates[0] } : null;
    };

    const membersToInsert: any[] = [];
    const membersToUpdate: { id: string; data: any; visits: string[] }[] = [];
    const errors: string[] = [];
    const adminClient = createAdminClient();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because header is row 1

      if (!row.first_name || !row.last_name || !row.email?.trim()) {
        errors.push(`Row ${rowNum}: Missing required fields (first_name, last_name, email)`);
        continue;
      }

      if (!row.date_of_birth?.trim()) {
        errors.push(`Row ${rowNum}: Missing date_of_birth (required)`);
        continue;
      }

      if (!dateRegex.test(row.date_of_birth)) {
        errors.push(`Row ${rowNum}: Invalid date_of_birth format (expected YYYY-MM-DD)`);
        continue;
      }

      const statusRaw = (row.status ?? "").trim().toLowerCase();
      const status = statusRaw === "inactive" ? "inactive" : "active";
      if (statusRaw && statusRaw !== "active" && statusRaw !== "inactive") {
        errors.push(`Row ${rowNum}: status must be active or inactive`);
        continue;
      }

      // Visits: minimum 0, maximum last 20 per member (enforced when building visitDatesFromCsv)

      if (row.joined_date && !dateRegex.test(row.joined_date)) {
        errors.push(`Row ${rowNum}: Invalid joined_date format (expected YYYY-MM-DD)`);
        continue;
      }

      if (row.last_visit_date && !dateRegex.test(row.last_visit_date)) {
        errors.push(`Row ${rowNum}: Invalid last_visit_date format (expected YYYY-MM-DD)`);
        continue;
      }

      const existingResult = findExistingMember(row, rowNum);
      if (existingResult === "ambiguous") continue;
      const existing = existingResult?.member ?? null;
      const visitDatesFromCsv: string[] = [];
      if (row.last_visit_date) visitDatesFromCsv.push(row.last_visit_date);
      if ((row as any).visits) {
        const parts = String((row as any).visits).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean);
        parts.forEach((d: string) => dateRegex.test(d) && !visitDatesFromCsv.includes(d) && visitDatesFromCsv.push(d));
      }
      const rowAny = row as Record<string, unknown>;
      for (const key of Object.keys(rowAny)) {
        const m = key.match(/^visit_(\d+)$/);
        if (!m) continue;
        const val = rowAny[key];
        const dateStr = typeof val === "string" ? val.trim() : val != null ? String(val).trim() : "";
        if (dateStr && dateRegex.test(dateStr) && !visitDatesFromCsv.includes(dateStr)) visitDatesFromCsv.push(dateStr);
      }
      const sortedVisits = [...visitDatesFromCsv].sort((a, b) => b.localeCompare(a));
      const allVisits = sortedVisits;
      const joinedDate = row.joined_date?.trim()
        ? row.joined_date
        : allVisits.length > 0
          ? [...allVisits].sort()[0]
          : new Date().toISOString().split("T")[0];


      // Parse billing_address into billing_address_line1 if provided as single field
      const billingAddress = (row.billing_address_line1 || row.billing_address)?.trim() || null;
      const billingPostcode = row.billing_postcode?.trim() || null;
      const billingCity = row.billing_city?.trim() || null;

      // Calculate distance from billing address to gym
      let distanceFromGymKm: number | null = null;
      let billingLatitude: number | null = null;
      let billingLongitude: number | null = null;

      if (gym?.latitude && gym?.longitude && (billingPostcode || billingAddress || billingCity)) {
        // Try to geocode billing address (prioritize postcode, then full address)
        const addressToGeocode = billingPostcode || (billingAddress && billingCity ? `${billingAddress}, ${billingCity}` : billingAddress || billingCity);
        
        if (addressToGeocode) {
          try {
            const geocoded = await geocodeAddress(addressToGeocode);
            if (geocoded) {
              billingLatitude = geocoded.latitude;
              billingLongitude = geocoded.longitude;
              distanceFromGymKm = calculateDistance(
                gym.latitude,
                gym.longitude,
                geocoded.latitude,
                geocoded.longitude
              );
            }
          } catch (error) {
            console.error(`Error geocoding billing address for row ${rowNum}:`, error);
            // Continue without distance if geocoding fails
          }
        }
      }

      // Recalculate churn risk with all available factors
      const riskResultWithDistance = calculateChurnRisk({
        last_visit_date: row.last_visit_date || (allVisits.length > 0 ? allVisits[0] : null),
        joined_date: joinedDate,
        has_received_campaign: false,
        distance_from_gym_km: distanceFromGymKm,
        age: (rowAny.age as number | null) ?? null,
        employment_status: (rowAny.employment_status ?? rowAny["employment/student_status"]) as string | null ?? null,
        student_status: (rowAny.student_status ?? ((rowAny["employment/student_status"] as string)?.toLowerCase().includes("student") ? "yes" : null)) as string | null ?? null,
        visits_last_30_days: 0, // Will be calculated after member is created
        total_visits: null,
      });

      const memberData: any = {
        gym_id: userProfile.gym_id,
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        joined_date: joinedDate,
        last_visit_date: row.last_visit_date || (allVisits.length > 0 ? allVisits[0] : null),
        status,
        churn_risk_score: riskResultWithDistance.score,
        churn_risk_level: riskResultWithDistance.level,
        last_risk_calculated_at: new Date().toISOString(),
        distance_from_gym_km: distanceFromGymKm ?? undefined,
        date_of_birth: row.date_of_birth?.trim() || null,
      };

      if (billingAddress || row.billing_address_line1 || billingCity || billingPostcode) {
        memberData.billing_address_line1 = billingAddress || row.billing_address_line1?.trim() || null;
        memberData.billing_address_line2 = row.billing_address_line2?.trim() || null;
        memberData.billing_city = billingCity || null;
        memberData.billing_postcode = billingPostcode || null;
        memberData.billing_country = row.billing_country?.trim() || "UK";
      }

      if (existing) {
        const { id } = existing as { id: string };
        const updatePayload: any = {
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          email: memberData.email,
          phone: memberData.phone,
          last_visit_date: memberData.last_visit_date,
          status: memberData.status,
          churn_risk_score: memberData.churn_risk_score,
          churn_risk_level: memberData.churn_risk_level,
          last_risk_calculated_at: memberData.last_risk_calculated_at,
          date_of_birth: memberData.date_of_birth,
        };
        if (memberData.distance_from_gym_km != null) updatePayload.distance_from_gym_km = memberData.distance_from_gym_km;
        if (memberData.billing_address_line1 != null) {
          updatePayload.billing_address_line1 = memberData.billing_address_line1;
          updatePayload.billing_address_line2 = memberData.billing_address_line2;
          updatePayload.billing_city = memberData.billing_city;
          updatePayload.billing_postcode = memberData.billing_postcode;
          updatePayload.billing_country = memberData.billing_country;
        }
        membersToUpdate.push({ id, data: updatePayload, visits: allVisits });
      } else {
        membersToInsert.push({ data: memberData, visits: allVisits });
      }
    }

    if (errors.length > 0 && membersToInsert.length === 0 && membersToUpdate.length === 0) {
      return NextResponse.json(
        { error: "All rows have errors", errors },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;

    // Update existing members and add visit activities
    for (const { id, data: updateData, visits } of membersToUpdate) {
      const { error: updateError } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", id)
        .eq("gym_id", userProfile.gym_id);

      if (updateError) {
        errors.push(`Failed to update member ${id}: ${updateError.message}`);
        continue;
      }
      updated++;

      if (visits.length > 0) {
        const { data: existingActivities } = await adminClient
          .from("member_activities")
          .select("activity_date")
          .eq("member_id", id)
          .eq("activity_type", "visit");
        const existingDates = new Set((existingActivities || []).map((a: any) => a.activity_date));
        const toInsert = visits.filter((d) => !existingDates.has(d));
        for (const activity_date of toInsert) {
          await adminClient.from("member_activities").insert({
            member_id: id,
            activity_date,
            activity_type: "visit",
          });
        }
      }
    }

    // Insert new members (in batches) and add visit activities
    const batchSize = 100;
    for (let i = 0; i < membersToInsert.length; i += batchSize) {
      const chunk = membersToInsert.slice(i, i + batchSize);
      const batch = chunk.map((x) => x.data);
      const { data: insertedRows, error: insertError } = await supabase
        .from("members")
        .insert(batch)
        .select("id");

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to insert members: ${insertError.message}` },
          { status: 500 }
        );
      }

      imported += batch.length;

      for (let j = 0; j < chunk.length && insertedRows && insertedRows[j]; j++) {
        const memberId = insertedRows[j].id;
        const visitDates = chunk[j].visits;
        for (const activity_date of visitDates) {
          await adminClient.from("member_activities").insert({
            member_id: memberId,
            activity_date,
            activity_type: "visit",
          });
        }
      }
    }

    // Recalibrate commitment scores, member stages, and at-risk metrics for the gym (rolling data)
    void recalculateCommitmentScoresForGym(userProfile.gym_id).catch((e) =>
      console.error("Post-upload commitment recalculation:", e)
    );
    void detectAtRiskMembersForGym(userProfile.gym_id).catch((e) =>
      console.error("Post-upload at-risk recalculation:", e)
    );

    return NextResponse.json({
      success: true,
      imported,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Member upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
