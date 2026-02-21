"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import RoleBadge from "@/components/auth/RoleBadge";
import type { UserRole } from "@/lib/auth/roles";

interface Branding {
  logo_url?: string | null;
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
  gym_name?: string | null;
}

export default function NavbarClient({ 
  branding,
  userRole,
  gymId,
}: { 
  branding?: Branding | null;
  userRole?: UserRole | null;
  gymId?: string | null;
}) {
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    if (!gymId) return;
    fetch("/api/approvals/count")
      .then((r) => r.json())
      .then((d) => setPendingApprovals(d.count ?? 0))
      .catch(() => {});
  }, [gymId]);
  const pathname = usePathname();
  const primaryColor = branding?.brand_primary_color || "#84cc16";

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm" data-tour="navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center gap-3">
              {branding?.logo_url ? (
                <Link href="/dashboard" className="flex items-center">
                  <img
                    src={branding.logo_url}
                    alt={branding.gym_name || "Gym logo"}
                    className="h-14 w-auto object-contain max-w-[200px]"
                  />
                </Link>
              ) : (
                <Link href="/dashboard" className="flex items-center">
                  <img
                    src="/rip dashboard logo - Edited.png"
                    alt="Rip logo"
                    className="h-14 w-auto object-contain max-w-[200px]"
                  />
                </Link>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive("/dashboard")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-600 hover:border-lime-300 hover:text-gray-900"
                }`}
                style={{
                  borderBottomColor: isActive("/dashboard") ? primaryColor : undefined,
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/members"
                data-tour="members-nav"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive("/members")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-600 hover:border-lime-300 hover:text-gray-900"
                }`}
                style={{
                  borderBottomColor: isActive("/members") ? primaryColor : undefined,
                }}
              >
                Members
              </Link>
              <Link
                href="/insights"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive("/insights") || isActive("/roi")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-600 hover:border-lime-300 hover:text-gray-900"
                }`}
                style={{
                  borderBottomColor: isActive("/insights") || isActive("/roi") ? primaryColor : undefined,
                }}
              >
                Insights
              </Link>
              <Link
                href="/plays"
                data-tour="campaigns-nav"
                className={`inline-flex items-center gap-1.5 border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive("/plays") || isActive("/campaigns") || isActive("/approvals") || isActive("/logs")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-600 hover:border-lime-300 hover:text-gray-900"
                }`}
                style={{
                  borderBottomColor: isActive("/plays") || isActive("/campaigns") || isActive("/approvals") || isActive("/logs") ? primaryColor : undefined,
                }}
              >
                Plays
                {pendingApprovals > 0 && (
                  <span
                    title={`${pendingApprovals} pending approval${pendingApprovals !== 1 ? "s" : ""}`}
                    className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white"
                  >
                    {pendingApprovals > 99 ? "99+" : pendingApprovals}
                  </span>
                )}
              </Link>
              {(userRole === 'coach' || userRole === 'owner') && (
                <Link
                  href="/coach-accountability"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive("/coach-accountability")
                      ? `border-[${primaryColor}] text-gray-900`
                      : "border-transparent text-gray-600 hover:border-lime-300 hover:text-gray-900"
                  }`}
                  style={{
                    borderBottomColor: isActive("/coach-accountability") ? primaryColor : undefined,
                  }}
                >
                  Coach Accountability
                </Link>
              )}
              {userRole === 'coach' && (
                <Link
                  href="/coach/inbox"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive("/coach/inbox")
                      ? `border-[${primaryColor}] text-gray-900`
                      : "border-transparent text-gray-600 hover:border-lime-300 hover:text-gray-900"
                  }`}
                  style={{
                    borderBottomColor: isActive("/coach/inbox") ? primaryColor : undefined,
                  }}
                >
                  My Actions
                </Link>
              )}
              {userRole === 'owner' && (
                <Link
                  href="/settings"
                  data-tour="settings-nav"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive("/settings")
                      ? `border-[${primaryColor}] text-gray-900`
                      : "border-transparent text-gray-600 hover:border-lime-300 hover:text-gray-900"
                  }`}
                  style={{
                    borderBottomColor: isActive("/settings") ? primaryColor : undefined,
                  }}
                >
                  Settings
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userRole && <RoleBadge role={userRole} />}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
