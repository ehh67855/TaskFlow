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
import { PageTemplate } from "@/components/page-template";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile Success",
}

export default function EditProfileConfirmation() {
  return (
    <PageTemplate name="Edit Profile Success">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Update Successful!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Your information has been updated.
            </CardDescription>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageTemplate>
  );
}
