"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
  userAuth: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

export default function LayoutWrapper({ children, userAuth }: LayoutWrapperProps) {
  const pathname = usePathname();
  // Do not show sidebar on landing, auth, or admin pages
  const noSidebarPaths = ["/", "/login", "/register", "/admin", "/feedback"];
  const showSidebar =
    !!userAuth && !noSidebarPaths.some((p) => pathname === p || pathname.startsWith("/admin"));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {showSidebar && <Sidebar user={userAuth} />}
      <main
        style={{
          flex: 1,
          marginLeft: showSidebar ? "280px" : "0",
          minHeight: "100vh",
          backgroundColor: "#F8FAFC",
        }}
      >
        {children}
      </main>
    </div>
  );
}
