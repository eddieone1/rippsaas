import { getGymContext } from "@/lib/supabase/get-gym-context";
import TrialExpiredClient from "@/components/trial/TrialExpiredClient";

export default async function TrialExpiredPage() {
  const { gymId } = await getGymContext();

  if (!gymId) {
    return null; // Will redirect via layout
  }

  return <TrialExpiredClient />;
}
