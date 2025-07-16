"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { activateAccountSchema } from "@/schemas/activate-account-schema";
import { formatApiUrl } from "@/lib/utils";

export type ActivateAccountFormValues = z.infer<typeof activateAccountSchema>;

export default function ActivateAccountForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ActivateAccountFormValues>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: {
      token: "",
    },
  });

  const onSubmit = async (values: ActivateAccountFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(formatApiUrl("/activate-account"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: values.token }),
      });

      if (response.ok) {
        toast({
          title: "Account Activated",
          description:
            "Your account has been activated successfully. You can now log in.",
        });
        router.push("/login");
      } else {
        const data = await response.json();
        toast({
          title: "Activation Failed",
          description:
            data.message ||
            "Activation failed. Please check the token and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An error occurred while activating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Account Activation
          </CardTitle>
          <CardDescription className="text-center">
            Enter your activation code to activate your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activation Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your activation code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Activating..." : "Activate Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
