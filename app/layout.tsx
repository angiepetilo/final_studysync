import type { Metadata } from "next";
import React, { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/context/QueryProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { DataProvider } from "@/context/DataContext";
import { PomodoroProvider } from "@/context/PomodoroContext";
import dynamic from "next/dynamic";
import ProgressBar from "@/components/shared/ProgressBar";
import { ClientOnly } from "@/components/shared/ClientOnly";

const LayoutWrapper = dynamic(() => import("@/components/layout/LayoutWrapper"), {
  ssr: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "StudSync — Your Academic Command Center",
  description:
    "A comprehensive, all-in-one collaborative study platform for students to manage courses, tasks, notes, files, schedules, and peer collaboration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans antialiased", inter.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (theme === 'dark' || (theme === 'system' && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans transition-colors duration-300", inter.className)}>
        <ThemeProvider>
          <QueryProvider>
            <DataProvider>
              <PomodoroProvider>
                <Suspense fallback={null}>
                  <ProgressBar />
                </Suspense>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </PomodoroProvider>
            </DataProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
