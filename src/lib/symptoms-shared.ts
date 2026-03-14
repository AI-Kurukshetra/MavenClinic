import { z } from "zod";

export const SYMPTOM_OPTIONS = [
  "Bloating",
  "Cramps",
  "Headache",
  "Fatigue",
  "Breast tenderness",
  "Nausea",
  "Spotting",
  "Mood swings",
  "Anxiety",
  "Hot flashes",
  "Brain fog",
  "Insomnia",
  "Back pain",
  "Joint pain",
  "Acne",
  "Food cravings",
  "Low libido",
  "Night sweats",
] as const;

export const symptomLogSchema = z.object({
  mood: z.number().int().min(1).max(10),
  energy: z.number().int().min(1).max(10),
  painLevel: z.number().int().min(0).max(10),
  sleepHours: z.number().min(4).max(12).multipleOf(0.5),
  symptoms: z.array(z.enum(SYMPTOM_OPTIONS)).max(SYMPTOM_OPTIONS.length),
  notes: z.string().trim().max(500).optional().default(""),
});

export type SymptomLogInput = z.infer<typeof symptomLogSchema>;
