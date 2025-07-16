import * as z from "zod";

export const feedbackSchema = z.object({
  feedback: z.string().min(1, "Feedback is required"),
});
