import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudSync — Your Academic Command Center",
  description:
    "A comprehensive, all-in-one collaborative study platform for students to manage courses, tasks, notes, files, schedules, and peer collaboration.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userAuth = null;

  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      userAuth = {
        id: session.user.id,
        email: session.user.email || "",
        full_name: session.user.user_metadata?.full_name || "",
      };
    }
  } catch {
    // Auth check failed — render without sidebar
  }

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <LayoutWrapper userAuth={userAuth}>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
