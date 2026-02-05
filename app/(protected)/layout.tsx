import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import ThemeVars from "@/components/layout/ThemeVars";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { gymId } = await requireAuth();

  let brandPrimary: string | null = null;
  let brandSecondary: string | null = null;
  if (gymId) {
    const supabase = await createClient();
    const { data: gym } = await supabase
      .from("gyms")
      .select("brand_primary_color, brand_secondary_color")
      .eq("id", gymId)
      .single();
    brandPrimary = gym?.brand_primary_color ?? null;
    brandSecondary = gym?.brand_secondary_color ?? null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ThemeVars primary={brandPrimary} secondary={brandSecondary} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
