"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Eye, EyeOff, Camera, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import type { UserData } from "@/types/user";
import { formatApiUrl } from "@/lib/utils";

const MAX_PICTURE_BYTES = 1.5 * 1024 * 1024; // raw file size, before base64 inflation
const MAX_BIO_LENGTH = 500;

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(20, "Password must not exceed 20 characters"),
    confirmPassword: z.string(),
  })
  // .refine((data) => data.password === data.confirmPassword, {
  //   message: "Passwords do not match",
  //   path: ["confirmPassword"],
  // })
  ;

type FormValues = z.infer<typeof formSchema>;

export function EditProfileForm({
  initialData,
  userLogin,
}: {
  initialData: UserData;
  userLogin: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");
  // Not part of the zod-validated field set below (nothing to validate beyond the file-size/
  // length checks done inline) - tracked separately and merged into the POST body on submit,
  // same as how passwordStrength sits alongside the form without being one of its fields.
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [profilePicture, setProfilePicture] = useState<string | null>(initialData.profilePicture ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please choose an image file." });
      return;
    }
    if (file.size > MAX_PICTURE_BYTES) {
      toast({ variant: "destructive", title: "Image too large", description: "Please choose an image under 1.5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      password: "",
      confirmPassword: "",
    },
  });

  const evaluatePassword = (password: string) => {
    const feedback = [];
    let strength = 0;

    if (password.length >= 8 && password.length <= 20) {
      strength += 25;
      feedback.push("Good length");
    } else {
      feedback.push("Password must be 8-20 characters long");
    }

    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[()$@$$!%*#?&]/.test(password)) strength += 10;

    setPasswordStrength(strength);
    setPasswordFeedback(feedback.join(", "));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch(formatApiUrl("/edit-profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, login: userLogin, bio, profilePicture }),
      });

      if (response.ok) {
        router.push("/edit-profile-confirmation");
      } else {
        throw new Error("Profile update failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while updating the profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="h-24 w-24">
            {profilePicture && <AvatarImage src={profilePicture} alt="Profile picture" />}
            <AvatarFallback className="text-2xl">
              {initialData.firstName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePictureChange}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" />
              {profilePicture ? "Change Photo" : "Upload Photo"}
            </Button>
            {profilePicture && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 text-muted-foreground"
                onClick={() => {
                  setProfilePicture("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="First Name" {...field} />
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
                <Input placeholder="Last Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Bio</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Tell people a bit about yourself..."
              value={bio}
              maxLength={MAX_BIO_LENGTH}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </FormControl>
          <FormDescription>{bio.length}/{MAX_BIO_LENGTH}</FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
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
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
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
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Save
        </Button>
      </form>
    </Form>
  );
}
