import { createClient } from "@/lib/supabase/server";
import { getGymContext } from "@/lib/supabase/get-gym-context";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch gym branding and user role
  const { gymId, userProfile } = await getGymContext();
  let branding = null;
  const userRole = (userProfile?.role as 'owner' | 'coach' | undefined) || null;
  
  if (gymId) {
    const { data: gym } = await supabase
      .from("gyms")
      .select("name, logo_url, brand_primary_color, brand_secondary_color")
      .eq("id", gymId)
      .single();
    
    if (gym) {
      branding = {
        logo_url: gym.logo_url,
        brand_primary_color: gym.brand_primary_color || "#2563EB",
        brand_secondary_color: gym.brand_secondary_color || "#1E40AF",
        gym_name: gym.name,
      };
    }
  }

  return <NavbarClient branding={branding} userRole={userRole} />;
}
