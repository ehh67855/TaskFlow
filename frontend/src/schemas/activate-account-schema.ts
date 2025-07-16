import * as z from "zod"

export const activateAccountSchema = z.object({
  token: z.string().min(1, "Activation code is required"),
})
