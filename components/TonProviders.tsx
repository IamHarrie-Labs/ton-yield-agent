"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function TonProviders({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl="https://yield-agent-iamharrie01-1060s-projects.vercel.app/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  );
}
