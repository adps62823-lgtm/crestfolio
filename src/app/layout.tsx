import type { Metadata } from "next";
import "@/app/globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Crestfolio",
  description:
    "Personal Indian market research operating system for mutual funds, equities, commodities, and macro intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
