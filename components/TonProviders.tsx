"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function TonProviders({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl="https://versus-rebuilt-reproduce.ngrok-free.dev/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  );
}
