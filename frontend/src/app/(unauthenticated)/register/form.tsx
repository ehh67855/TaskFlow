"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import * as z from "zod";
import { registerSchema } from "@/schemas/register-schema";
import { formatApiUrl } from "@/lib/utils";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");

  const evaluatePassword = (password: string) => {
    const feedback = [];
    let strength = 0;

    if (password.length >= 8 && password.length <= 20) {
      strength += 25;
      feedback.push("Good length");
    } else {
      feedback.push("Password must be 8-20 characters long");
    }

    if (/[A-Z]/.test(password)) {
      strength += 25;
      feedback.push("Includes uppercase");
    } else {
      feedback.push("Needs an uppercase letter");
    }

    if (/[a-z]/.test(password)) {
      strength += 25;
      feedback.push("Includes lowercase");
    } else {
      feedback.push("Needs a lowercase letter");
    }

    if (/[0-9]/.test(password)) {
      strength += 15;
      feedback.push("Includes number");
    } else {
      feedback.push("Needs a number");
    }

    if (/[()$@$$!%*#?&]/.test(password)) {
      strength += 10;
      feedback.push("Includes special character");
    } else {
      feedback.push("Needs a special character");
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback.join(", "));
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await fetch(formatApiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          login: values.email,
          password: values.password,
        }),
      });

      if (response.status === 201) {
        router.push("/signup-confirmation");
      } else if (response.status === 400) {
        toast({
          title: "Registration Error",
          description: "Email is already in use",
          variant: "destructive",
        });
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Let's get started</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Register below to get started in minutes. It's easy!
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
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
                    <div className="relative">
                      <Input
                        type={passwordVisible ? "text" : "password"}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          evaluatePassword(e.target.value);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        {passwordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <Progress value={passwordStrength} className="h-2 mt-2" />
                  <FormDescription>
                    Password Feedback: {passwordFeedback}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type={passwordVisible ? "text" : "password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Register
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
