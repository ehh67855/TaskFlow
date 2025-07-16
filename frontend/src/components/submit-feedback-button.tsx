"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { feedbackSchema } from "@/schemas/feedback";
import { formatApiUrl } from "@/lib/utils";

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export function SubmitFeedbackButton() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: "",
    },
  });

  const resetSubmitted = () => {
    setIsSubmitted(false);
    form.reset();
  };

  const onSubmit = async (values: FeedbackFormValues) => {
    try {
      const response = await fetch(formatApiUrl("/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback!",
        });
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">Submit Feedback</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {isSubmitted ? (
          <div className="space-y-4">
            <p className="text-center font-semibold">
              Thank you! Your feedback has been submitted.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                resetSubmitted();
                setIsOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your feedback here"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </Form>
        )}
      </PopoverContent>
    </Popover>
  );
}
