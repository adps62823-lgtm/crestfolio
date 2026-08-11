"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  Brain,
  CircleDollarSign,
  Globe2,
  Settings2,
  Sparkles,
  Waves,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Command Center", icon: BarChart3 },
  { href: "/universe", label: "Universe", icon: BriefcaseBusiness },
  { href: "/screener", label: "Screener Studio", icon: CircleDollarSign },
  { href: "/live", label: "Live Data", icon: Waves },
  { href: "/research", label: "Research Memory", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <h1 className="brand-title">Crestfolio</h1>
            <p className="brand-subtitle">Research OS for India</p>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                data-active={pathname === item.href ? "true" : "false"}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-panel">
          <h3>Free-first stack</h3>
          <p>
            AMFI, NSE, MCX, RBI, MoSPI, and local Ollama-backed AI. Built for
            a single investor, but architected like an institutional desk.
          </p>
        </div>

        <div className="sidebar-panel">
          <h3>Research lanes</h3>
          <p>Equity, mutual fund, commodity, index, macro, live feeds, and event tracking.</p>
        </div>
      </aside>

      <div className="content">
        <div className="topbar">
          <div className="topbar-card">
            <Sparkles size={16} />
            <span>Daily public-data sync ready</span>
          </div>
          <div className="topbar-card">
            <Brain size={16} />
            <span>Local AI persona enabled</span>
          </div>
          <div className="topbar-card">
            <Globe2 size={16} />
            <span>India-first research universe</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
