import "@/styles/globals.css";
import { type Metadata } from "next";
import { geistMono, geistSans } from "@/lib/fonts";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { getAuthToken, setAuthHeader } from "@/services/BackendService";
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

  // if we have an auth token, let's check if it is expired
  if (authToken) {
    // decode the auth token
    const decoded = jwtDecode<CustomJwtPayload>(authToken);

    const exp = decoded.exp;
    if (exp) {
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

      if (currentTime > exp) {
        // Token has expired, remove it
        await setAuthHeader(null);
      } else {
        // Token is still valid, but let's check if it's close to expiring
        const timeUntilExpiry = exp - currentTime;
        const refreshThreshold = 5 * 60; // 5 minutes in seconds

        if (timeUntilExpiry < refreshThreshold) {
          console.log("Token is close to expiring, consider refreshing it");
        }
      }
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
