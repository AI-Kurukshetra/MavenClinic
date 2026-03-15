import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { publicEnv, serverEnv } from "@/lib/env";
import {
  buildCarePlanPrompt,
  buildCyclePredictionPrompt,
  buildRiskFlagPrompt,
  buildSymptomInsightPrompt,
} from "@/lib/ai/prompts";

type InsightType = "symptom_insight" | "risk_flag" | "cycle_prediction" | "care_plan_suggestion";

type SymptomInsightLog = {
  loggedAt?: string;
  symptoms?: string[];
  mood?: number;
  energy?: number;
  painLevel?: number;
  sleepHours?: number;
  notes?: string;
};

type RiskFlagResult = {
  flag: boolean;
  reason?: string;
  urgency?: "routine" | "urgent";
};

const MOCK_INSIGHTS = {
  symptom_insight: [
    "Your energy levels have been lower than usual this week. Prioritize sleep, hydration, and lighter movement for a few days. If fatigue persists beyond two weeks, bring it up with your provider.",
    "You have logged headaches more often lately, which can sometimes track with stress, dehydration, or hormonal shifts. Try spacing out water intake through the day and note whether headaches cluster around your cycle. If they intensify, check in with your provider.",
    "Your recent logs show mood changes alongside physical symptoms. Gentle routines, regular meals, and a consistent bedtime may help smooth those swings. Reach out to your provider if mood symptoms begin affecting daily life.",
    "Pain levels look higher than your recent baseline. Rest, heat, hydration, and lighter activity may help today. If pain keeps escalating or feels unusually intense, please consult your provider.",
    "Your logs suggest a steadier pattern over the last few days. Keep building on what is working, especially regular sleep and meals. Small consistency tends to make symptom patterns easier to manage.",
  ],
  risk_flag: [
    { flag: false },
    { flag: true, reason: "Pain levels have remained elevated across multiple recent logs. Please review this pattern with your provider.", urgency: "routine" },
    { flag: true, reason: "Your recent entries suggest symptoms that are intensifying rather than settling. Please consult your provider soon.", urgency: "urgent" },
  ],
  cycle_prediction: [
    {
      nextPeriod: "2026-03-28",
      fertileStart: "2026-03-12",
      fertileEnd: "2026-03-17",
      ovulation: "2026-03-15",
      insight: "Your recent cycle pattern looks fairly consistent, so the next cycle window should be close to your usual rhythm.",
    },
  ],
  care_plan_suggestion: [
    [
      { title: "Track symptoms daily", description: "Log mood, energy, pain, and key symptoms each day.", targetDate: "2026-03-21", category: "tracking" },
      { title: "Protect sleep", description: "Aim for a consistent bedtime and at least 7 hours of sleep on most nights.", targetDate: "2026-03-24", category: "sleep" },
      { title: "Hydration check", description: "Have water with each meal and keep a bottle nearby during the day.", targetDate: "2026-03-26", category: "wellness" },
      { title: "Gentle movement", description: "Schedule three low-impact movement sessions this week.", targetDate: "2026-03-28", category: "movement" },
      { title: "Review symptom triggers", description: "Note any links between symptoms and stress, food, sleep, or cycle phase.", targetDate: "2026-03-31", category: "tracking" },
      { title: "Provider follow-up", description: "Bring persistent or worsening symptoms to your provider with your log history.", targetDate: "2026-04-04", category: "care" },
    ],
  ],
} as const;

const promptBuilders: Record<InsightType, (data: unknown) => string> = {
  symptom_insight: buildSymptomInsightPrompt,
  risk_flag: buildRiskFlagPrompt,
  cycle_prediction: buildCyclePredictionPrompt,
  care_plan_suggestion: buildCarePlanPrompt,
};

function isAiInsightsEnabled() {
  return publicEnv.NEXT_PUBLIC_AI_INSIGHTS_ENABLED === "true";
}

function parseClaudeResponse(type: InsightType, value: string) {
  if (type === "symptom_insight") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    if (type === "risk_flag") {
      return MOCK_INSIGHTS.risk_flag[0];
    }

    return type === "cycle_prediction" ? MOCK_INSIGHTS.cycle_prediction[0] : MOCK_INSIGHTS.care_plan_suggestion[0];
  }
}

function normalizeSymptomInsightLogs(data: unknown): SymptomInsightLog[] {
  if (Array.isArray(data)) {
    return data as SymptomInsightLog[];
  }

  if (data && typeof data === "object") {
    const source = data as { recentLogs?: unknown; newLog?: unknown };
    const recentLogs = Array.isArray(source.recentLogs) ? (source.recentLogs as SymptomInsightLog[]) : [];
    const newLog = source.newLog && typeof source.newLog === "object" ? [source.newLog as SymptomInsightLog] : [];
    return [...recentLogs, ...newLog];
  }

  return [];
}

function pickMockSymptomInsight(data: unknown) {
  const logs = normalizeSymptomInsightLogs(data);

  if (!logs.length) {
    return MOCK_INSIGHTS.symptom_insight[4];
  }

  const symptomCounts = new Map<string, number>();
  let moodTotal = 0;
  let energyTotal = 0;
  let painMax = 0;
  let sleepMin = Number.POSITIVE_INFINITY;

  for (const log of logs) {
    moodTotal += log.mood ?? 0;
    energyTotal += log.energy ?? 0;
    painMax = Math.max(painMax, log.painLevel ?? 0);
    if (typeof log.sleepHours === "number") {
      sleepMin = Math.min(sleepMin, log.sleepHours);
    }

    for (const symptom of log.symptoms ?? []) {
      symptomCounts.set(symptom, (symptomCounts.get(symptom) ?? 0) + 1);
    }
  }

  const avgMood = moodTotal / logs.length;
  const avgEnergy = energyTotal / logs.length;
  const headacheCount = symptomCounts.get("Headache") ?? symptomCounts.get("headache") ?? 0;
  const moodSymptoms = (symptomCounts.get("Mood swings") ?? 0) + (symptomCounts.get("mood swings") ?? 0) + (symptomCounts.get("Anxiety") ?? 0) + (symptomCounts.get("anxiety") ?? 0);

  if (painMax >= 7) {
    return MOCK_INSIGHTS.symptom_insight[3];
  }

  if ((avgEnergy > 0 && avgEnergy <= 4) || sleepMin < 6) {
    return MOCK_INSIGHTS.symptom_insight[0];
  }

  if (headacheCount >= 2) {
    return MOCK_INSIGHTS.symptom_insight[1];
  }

  if ((avgMood > 0 && avgMood <= 5) || moodSymptoms >= 2) {
    return MOCK_INSIGHTS.symptom_insight[2];
  }

  return MOCK_INSIGHTS.symptom_insight[4];
}

function pickMockRiskFlag(data: unknown): RiskFlagResult {
  const logs = normalizeSymptomInsightLogs(data);

  if (!logs.length) {
    return MOCK_INSIGHTS.risk_flag[0];
  }

  const highPainLogs = logs.filter((log) => (log.painLevel ?? 0) >= 8).length;
  const lowEnergyLogs = logs.filter((log) => (log.energy ?? 10) <= 2).length;

  if (highPainLogs >= 2) {
    return MOCK_INSIGHTS.risk_flag[2];
  }

  if (highPainLogs >= 1 || lowEnergyLogs >= 3) {
    return MOCK_INSIGHTS.risk_flag[1];
  }

  return MOCK_INSIGHTS.risk_flag[0];
}

function buildMockInsight(type: InsightType, data: unknown) {
  if (type === "symptom_insight") {
    return pickMockSymptomInsight(data);
  }

  if (type === "risk_flag") {
    return pickMockRiskFlag(data);
  }

  return type === "cycle_prediction" ? MOCK_INSIGHTS.cycle_prediction[0] : MOCK_INSIGHTS.care_plan_suggestion[0];
}

export async function generateAiInsight(type: InsightType, data: unknown) {
  if (!serverEnv.ANTHROPIC_API_KEY || !isAiInsightsEnabled()) {
    return buildMockInsight(type, data);
  }

  const client = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: promptBuilders[type](data) }],
  });

  const block = message.content.find((item) => item.type === "text");
  const text = block?.text?.trim();

  if (!text) {
    return buildMockInsight(type, data);
  }

  return parseClaudeResponse(type, text);
}

export const aiRequestSchema = z.object({
  type: z.enum(["symptom_insight", "risk_flag", "cycle_prediction", "care_plan_suggestion"]),
  data: z.unknown(),
  logId: z.uuid().optional(),
});

export type AiRequestInput = z.infer<typeof aiRequestSchema>;

