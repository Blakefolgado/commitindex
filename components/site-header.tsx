"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Directory" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/compare", label: "Compare" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Open Office home">
        <span className="wordmark-mark" aria-hidden="true" />
        Open Office
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link className={active ? "active" : ""} href={link.href} key={link.href}>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link className="about-link" href="/#about">About the data</Link>
    </header>
  );
}
