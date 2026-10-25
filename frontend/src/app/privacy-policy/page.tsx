import { type Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        &larr; Back to {siteConfig.name}
      </Link>

      <div className="md-content mt-6">
        <h1>Privacy Policy</h1>
        <p>Last updated: October 2026</p>

        <p>
          This policy explains what information {siteConfig.name} collects, how it&apos;s
          used, and the choices you have. {siteConfig.name} is a personal project, not a
          company, and this data is used only to run the app itself.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> your name, email address, and a hashed
            password (we never store your password in plain text). If you sign in with
            Google, we receive your name and email from Google instead.
          </li>
          <li>
            <strong>Content you create:</strong> routines, networks, nodes, folders,
            comments, and other content you add while using the app.
          </li>
          <li>
            <strong>Usage data:</strong> things like practice streaks, badges earned, and
            friend connections, which exist to power the app&apos;s own features.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To create and secure your account, and keep you signed in.</li>
          <li>
            To send account-related email - activation links and password resets - via our
            email provider, Resend.
          </li>
          <li>To show you your content, streaks, badges, and friend activity.</li>
        </ul>
        <p>We don&apos;t use your data for advertising, and we don&apos;t sell it.</p>

        <h2>Cookies and local storage</h2>
        <p>
          We use a cookie to store your sign-in session (a JSON Web Token) so you stay
          logged in. We don&apos;t use third-party advertising or tracking cookies.
        </p>

        <h2>Third-party services</h2>
        <p>Running {siteConfig.name} relies on a small number of service providers:</p>
        <ul>
          <li>
            <strong>Google</strong> - if you choose &quot;Sign in with Google&quot;, subject
            to{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              Google&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Resend</strong> - delivers transactional emails (activation, password
            reset) on our behalf.
          </li>
          <li>
            <strong>Vercel, Render, and Neon</strong> - host the app, its backend, and its
            database.
          </li>
        </ul>

        <h2>Data retention and deletion</h2>
        <p>
          We keep your account data for as long as your account exists. To request that
          your account and data be deleted, email us at the address below.
        </p>

        <h2>Children&apos;s privacy</h2>
        <p>
          {siteConfig.name} is not directed at children under 13, and we don&apos;t
          knowingly collect information from them.
        </p>

        <h2>Security</h2>
        <p>
          Passwords are hashed, not stored in plain text, and connections to the app are
          encrypted (HTTPS). No method of storage or transmission is 100% secure, but we
          take reasonable steps to protect your information.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, we&apos;ll update the date at the top of this page.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy or your data? Email{" "}
          <a href="mailto:evanhammam@gmail.com">evanhammam@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
