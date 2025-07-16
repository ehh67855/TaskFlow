import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Signup Confirmation",
};

export default function SignupConfirmationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Registration Successful!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Thank you for signing up.{" "}
              <strong>
                A confirmation email has been sent to your email address.
              </strong>{" "}
              Please follow the instructions in the email to activate your
              account.
            </CardDescription>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
