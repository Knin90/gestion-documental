"use client";

import React from "react";

interface TwoFALayoutProps {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}

export function TwoFALayout({ title, description, icon, children }: TwoFALayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground text-2xl" aria-hidden="true">
              {icon}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
