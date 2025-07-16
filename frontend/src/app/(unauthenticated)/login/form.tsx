"use client";

import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema } from "@/schemas/login-schema";
import { setAuthHeader } from "@/services/BackendService";
import { formatApiUrl } from "@/lib/utils";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await fetch(formatApiUrl("/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          login: values.email,
          password: values.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await setAuthHeader(data["token"]);
        router.push("/");
      } else {
        let errorMessage: string | null;
        if (response.status === 404) {
          errorMessage = "Email not found";
        } else if (response.status === 400) {
          errorMessage = "Invalid password";
        } else if (response.status === 403) {
          errorMessage =
            "User Account not active. Check your inbox to activate your account";
        } else {
          errorMessage = "An error occurred while logging in.";
        }
        toast({
          title: "Error logging in",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto mt-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Remember me</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/register">Create an account</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Forgot password?</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
