import { z } from "zod";
import { SYMPTOM_OPTIONS } from "@/lib/symptoms-shared";

export const FLOW_INTENSITY_OPTIONS = ["spotting", "light", "medium", "heavy"] as const;
export const OPK_RESULT_OPTIONS = ["negative", "high", "peak"] as const;

export const cycleLogSchema = z.object({
  periodStart: z.iso.date({ message: "Period start date is required." }),
  periodEnd: z.iso.date({ message: "Period end date is required." }),
  flowIntensity: z.enum(FLOW_INTENSITY_OPTIONS, { message: "Flow intensity is required." }),
  symptoms: z.array(z.enum(SYMPTOM_OPTIONS)).max(SYMPTOM_OPTIONS.length),
  notes: z.string().trim().max(300).optional().default(""),
}).refine((value) => new Date(value.periodEnd).getTime() >= new Date(value.periodStart).getTime(), {
  message: "Period end date must be on or after the start date.",
  path: ["periodEnd"],
});

export const fertilitySnapshotSchema = z.object({
  bbtTemp: z.number().min(90).max(110).optional(),
  opkResult: z.enum(OPK_RESULT_OPTIONS).optional(),
});

export type CycleLogInput = z.infer<typeof cycleLogSchema>;
export type FertilitySnapshotInput = z.infer<typeof fertilitySnapshotSchema>;
export type OpkResult = (typeof OPK_RESULT_OPTIONS)[number];
