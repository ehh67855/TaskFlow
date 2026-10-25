import { type Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        &larr; Back to {siteConfig.name}
      </Link>

      <div className="md-content mt-6">
        <h1>Terms of Service</h1>
        <p>Last updated: October 2026</p>

        <p>
          These terms cover your use of {siteConfig.name}. By creating an account, you
          agree to them.
        </p>

        <h2>Your account</h2>
        <p>
          You&apos;re responsible for keeping your login credentials secure and for
          activity that happens under your account. Let us know if you suspect
          unauthorized access.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Use {siteConfig.name} lawfully and don&apos;t try to disrupt the service, access
          other users&apos; accounts or data without permission, or abuse it to distribute
          harmful or illegal content.
        </p>

        <h2>Your content</h2>
        <p>
          You own the routines, networks, and other content you create. By using{" "}
          {siteConfig.name}, you give us permission to store and display that content back
          to you (and to other users where you&apos;ve chosen to share it, like with
          friends or on the marketplace) as part of running the app.
        </p>

        <h2>Service availability</h2>
        <p>
          {siteConfig.name} is a personal project provided on an &quot;as is&quot; basis,
          without warranties of any kind. We don&apos;t guarantee the service will always
          be available, error-free, or uninterrupted.
        </p>

        <h2>Termination</h2>
        <p>
          You can stop using {siteConfig.name} and request account deletion at any time.
          We may suspend or terminate accounts that violate these terms.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {siteConfig.name} and its operator
          aren&apos;t liable for indirect, incidental, or consequential damages arising
          from your use of the service.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          If these terms change, we&apos;ll update the date at the top of this page.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Email{" "}
          <a href="mailto:evanhammam@gmail.com">evanhammam@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
