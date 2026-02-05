"use client";

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
  userRole 
}: { 
  branding?: Branding | null;
  userRole?: UserRole | null;
}) {
  const pathname = usePathname();
  const primaryColor = branding?.brand_primary_color || "#2563EB";

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
                    className="h-10 w-auto object-contain max-w-[150px]"
                  />
                </Link>
              ) : (
                <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                  Rip
                </Link>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive("/dashboard")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                  isActive("/insights")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                style={{
                  borderBottomColor: isActive("/insights") ? primaryColor : undefined,
                }}
              >
                Insights
              </Link>
              <Link
                href="/roi"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive("/roi")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                style={{
                  borderBottomColor: isActive("/roi") ? primaryColor : undefined,
                }}
              >
                ROI
              </Link>
              <Link
                href="/campaigns"
                data-tour="campaigns-nav"
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  isActive("/campaigns")
                    ? `border-[${primaryColor}] text-gray-900`
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                style={{
                  borderBottomColor: isActive("/campaigns") ? primaryColor : undefined,
                }}
              >
                Campaigns
              </Link>
              {(userRole === 'coach' || userRole === 'owner') && (
                <Link
                  href="/coach/playbook"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive("/coach/playbook")
                      ? `border-[${primaryColor}] text-gray-900`
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  style={{
                    borderBottomColor: isActive("/coach/playbook") ? primaryColor : undefined,
                  }}
                >
                  Playbook
                </Link>
              )}
              {userRole === 'coach' && (
                <Link
                  href="/coach/inbox"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive("/coach/inbox")
                      ? `border-[${primaryColor}] text-gray-900`
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
