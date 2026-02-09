"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const breadcrumbMap: Record<string, string> = {
  "/": "Dashboard",
  "/repeaters": "Repeaters",
  "/networks": "Networks",
  "/reports": "Reports",
  "/map": "Map",
  "/admin/users": "Users & Roles",
  "/admin/sync": "Sync Runs",
};

export function AppHeader() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const title =
    breadcrumbMap[pathname] ??
    (segments.length > 0
      ? segments[segments.length - 1].charAt(0).toUpperCase() +
        segments[segments.length - 1].slice(1)
      : "Dashboard");

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="flex-1 text-lg font-semibold">{title}</h1>
      <form action={signOut}>
        <Button variant="ghost" size="icon" type="submit">
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </form>
    </header>
  );
}
