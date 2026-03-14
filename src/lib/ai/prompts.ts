export function buildSymptomInsightPrompt(data: unknown): string {
  return "You are a compassionate women health assistant for Maven Clinic. Analyze these recent symptom logs and provide a warm actionable insight in exactly 3 sentences. Data: " + JSON.stringify(data) + " Rules: - Never diagnose any condition - Never recommend specific medications - Suggest provider consultation if patterns are concerning - Warm supportive tone never alarming - End with one practical wellness tip";
}

export function buildRiskFlagPrompt(data: unknown): string {
  return "Review these symptom logs for patterns that may need medical attention: " + JSON.stringify(data) + " If you see concerning patterns respond with JSON only: { flag: true, reason: one sentence, urgency: routine|urgent } If no concerns respond with JSON only: { flag: false } Never diagnose. Return JSON only, no other text.";
}

export function buildCyclePredictionPrompt(data: unknown): string {
  return "Based on this cycle history: " + JSON.stringify(data) + " Calculate and return JSON only: { nextPeriod: YYYY-MM-DD, fertileStart: YYYY-MM-DD, fertileEnd: YYYY-MM-DD, ovulation: YYYY-MM-DD, insight: one warm sentence about the cycle } Return JSON only, no other text.";
}

export function buildCarePlanPrompt(data: unknown): string {
  return "Create a 4-week care plan for this patient profile: " + JSON.stringify(data) + " Return JSON array only: [{ title: string, description: string, targetDate: YYYY-MM-DD, category: string }] 6-8 milestones. Return JSON only, no other text.";
}
