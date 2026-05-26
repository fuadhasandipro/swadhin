"use client";

import { ThemeProvider } from "./ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
