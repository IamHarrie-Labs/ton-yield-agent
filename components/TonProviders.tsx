"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function TonProviders({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl="https://surge-protocol.vercel.app/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  );
}
