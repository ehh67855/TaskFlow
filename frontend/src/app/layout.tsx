import "@/styles/globals.css";
import { type Metadata } from "next";
import { geistMono, geistSans } from "@/lib/fonts";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { getAuthToken } from "@/services/BackendService";
import { CustomJwtPayload } from "@/entities/CustomJwtPayload";
import { jwtDecode } from "jwt-decode";

export const metadata: Metadata = {
  title: {
    template: `%s | ${siteConfig.name}`,
    default: siteConfig.name,
  },
  description: "Like Git -- but for audio engineers.",
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const authToken = await getAuthToken();

  // This is a soft, app-wide diagnostic only - actually enforcing "you're logged out" (clearing
  // the cookie, redirecting to /login) is the (authenticated) layout's job for the routes that
  // need it; it can react per-route, and it's the only place allowed to fetch-verify the token
  // against the backend. This layout wraps every route including public ones, so a decode
  // failure here (a corrupted or non-JWT cookie value - jwt-decode doesn't need a *valid*
  // token, just a well-formed one) must never crash the page - it just means there's nothing
  // useful to log, not that anything needs fixing here.
  if (authToken) {
    try {
      const decoded = jwtDecode<CustomJwtPayload>(authToken);
      const exp = decoded.exp;
      if (exp) {
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const timeUntilExpiry = exp - currentTime;
        const refreshThreshold = 5 * 60; // 5 minutes in seconds

        if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold) {
          console.log("Token is close to expiring, consider refreshing it");
        }
      }
    } catch {
      // Malformed token - the (authenticated) layout/pages handle redirecting for routes that
      // actually require a valid session.
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
