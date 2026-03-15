"use client";

import { Header } from "./Header";

interface PageLayoutProps {
  children: React.ReactNode;
  rightContent?: React.ReactNode;
  showLogoAsLink?: boolean;
  hideHeader?: boolean;
}

export function PageLayout({
  children,
  rightContent,
  showLogoAsLink = false,
  hideHeader = false,
}: PageLayoutProps) {
  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {!hideHeader && (
        <header className="flex justify-between items-start py-8 px-12 shrink-0">
          <Header asLink={showLogoAsLink} />
          {rightContent}
        </header>
      )}
      {children}
    </div>
  );
}
