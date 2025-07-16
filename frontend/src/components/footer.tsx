import Link from "next/link";
import { SubmitFeedbackButton } from "@/components/submit-feedback-button";
import { Button } from "@/components/ui/button";

function ContactUsButton() {
  return (
    <Button variant="outline" asChild>
      <Link href="/contact">Contact Us</Link>
    </Button>
  );
}

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container mx-auto py-4">
        <div className="flex items-center">
          <nav className="flex flex-row gap-2">
            <SubmitFeedbackButton />
            <ContactUsButton />
          </nav>
        </div>
      </div>
    </footer>
  );
}
