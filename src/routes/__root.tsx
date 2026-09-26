import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import { AppQueryClientProvider } from "@/components/app-query-client-provider";
import { NotFound } from "@/components/not-found";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SYSTEM_THEME_SCRIPT } from "@/lib/init-system-theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Starter" },
      {
        name: "description",
        content:
          "TanStack Start starter with better-auth, Cloudflare D1, and R2.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap script */}
        <script dangerouslySetInnerHTML={{ __html: SYSTEM_THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey=""
        >
          <AppQueryClientProvider>
            <TooltipProvider>
              <Outlet />
              <Toaster position="top-right" />
            </TooltipProvider>
          </AppQueryClientProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
