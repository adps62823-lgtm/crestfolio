"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  CircleDollarSign,
  Settings2,
  Waves,
  Grid,
  Layers,
  Terminal,
  PieChart,
  Sun,
  Moon,
  Activity,
  ShieldAlert,
  Percent,
  SlidersHorizontal,
  Compass,
  Menu,
  X,
  Search,
  Maximize2,
} from "lucide-react";
import { CommandPalette } from "./command-palette";
import { DesktopPetCopilot } from "./desktop-pet-copilot";
import { FloatingMatrixModal } from "./floating-matrix-modal";
import type { AssetRecord } from "@/lib/types";

const navItems = [
  { href: "/", label: "Command Desk", icon: BarChart3 },
  { href: "/matrix", label: "Multi-Chart Matrix", icon: Grid },
  { href: "/screener", label: "Screener Studio", icon: CircleDollarSign },
  { href: "/overlap", label: "Scheme Overlap", icon: Layers },
  { href: "/backtest", label: "Backtest & Stress", icon: PieChart },
  { href: "/sectors", label: "Sector Rotation", icon: Compass },
  { href: "/forensics", label: "Accounting Forensics", icon: ShieldAlert },
  { href: "/ratios", label: "Macro Ratios", icon: Activity },
  { href: "/tax-harvesting", label: "Tax Harvesting", icon: Percent },
  { href: "/scenarios", label: "Macro Scenarios", icon: SlidersHorizontal },
  { href: "/universe", label: "Asset Universe", icon: BriefcaseBusiness },
  { href: "/live", label: "Live Ingestion", icon: Waves },
  { href: "/research", label: "Research Queue", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [allAssets, setAllAssets] = useState<AssetRecord[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const handleOpen = () => setIsCommandOpen(true);
    window.addEventListener("open-command-palette", handleOpen);

    async function loadUniverse() {
      try {
        const res = await fetch("/api/assets");
        const data = await res.json();
        if (Array.isArray(data)) setAllAssets(data);
      } catch {}
    }
    void loadUniverse();

    return () => window.removeEventListener("open-command-palette", handleOpen);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <div className="app-shell">
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <FloatingMatrixModal
        allAssets={allAssets}
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      {/* Mobile Top Header */}
      <div className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="button button-subtle"
            style={{ padding: 6 }}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="brand-mark" style={{ width: 26, height: 26 }} />
          <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>Crestfolio</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="button button-subtle"
            style={{ padding: 6 }}
            onClick={() => setIsMatrixOpen(true)}
            title="Floating Multi-Chart Matrix"
          >
            <Grid size={18} />
          </button>

          <button
            className="button button-subtle"
            style={{ padding: 6 }}
            onClick={() => setIsCommandOpen(true)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button
            className="button button-subtle"
            style={{ padding: 6 }}
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <h1 className="brand-title">Crestfolio Pro</h1>
            <p className="brand-subtitle">Institutional Research OS</p>
          </div>
        </div>

        <button
          className="button"
          style={{ width: "100%", justifyContent: "space-between" }}
          onClick={() => setIsCommandOpen(true)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Terminal size={14} />
            <span>Command (Ctrl+K)</span>
          </div>
          <kbd style={{ fontSize: "0.75rem", background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: 4 }}>
            /
          </kbd>
        </button>

        <nav className="nav" style={{ overflowY: "auto", maxHeight: "calc(100vh - 220px)" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                data-active={pathname === item.href ? "true" : "false"}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
          <button className="button" style={{ width: "100%", justifyContent: "center" }} onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </button>
        </div>
      </aside>

      <div className="content">
        <div className="topbar desktop-only-topbar">
          <div className="topbar-card" style={{ cursor: "pointer" }} onClick={() => setIsCommandOpen(true)}>
            <Terminal size={14} style={{ color: "var(--primary)" }} />
            <span>Search 16,400+ assets or commands (Ctrl+K)</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="button button-primary"
              style={{ padding: "6px 12px", fontSize: "0.82rem" }}
              onClick={() => setIsMatrixOpen(true)}
            >
              <Grid size={14} />
              <span>⚡ Floating Multi-Chart Matrix</span>
            </button>

            <span className="pill pill-active">2,125 NSE Stocks</span>
            <span className="pill pill-active">14,269 AMFI Schemes</span>
            <span className="pill">MCX Spot Live</span>
          </div>
        </div>
        {children}
        <DesktopPetCopilot />
      </div>
    </div>
  );
}
