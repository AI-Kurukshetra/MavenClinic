import { addDays, subDays } from "date-fns";
import type {
  Appointment,
  CarePlan,
  CycleLog,
  EducationItem,
  MessageThread,
  Profile,
  Provider,
  RecordItem,
  SymptomLog,
} from "@/types/domain";

const today = new Date();

export const mockProfile: Profile = {
  id: "patient-demo-1",
  role: "patient",
  fullName: "Ariana Bennett",
  firstName: "Ariana",
  dateOfBirth: "1992-08-16",
  phone: "+1 (555) 201-7782",
  onboardingComplete: true,
};

export const mockProviders: Provider[] = [
  {
    id: "provider-1",
    fullName: "Dr. Sarah Chen",
    specialty: "ob_gyn",
    specialtyLabel: "OB/GYN",
    bio: "Board-certified OB/GYN with 12 years specializing in reproductive health and minimally invasive surgery.",
    languages: ["English", "Mandarin"],
    acceptingPatients: true,
    consultationFeeCents: 8500,
    rating: 4.9,
    totalReviews: 132,
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80",
    nextAvailable: [addDays(today, 1).toISOString(), addDays(today, 2).toISOString(), addDays(today, 4).toISOString()],
  },
  {
    id: "provider-2",
    fullName: "Dr. Amara Osei",
    specialty: "fertility",
    specialtyLabel: "Fertility",
    bio: "Reproductive endocrinologist focused on IVF, IUI, and natural fertility optimization.",
    languages: ["English", "French"],
    acceptingPatients: true,
    consultationFeeCents: 12000,
    rating: 4.8,
    totalReviews: 98,
    avatarUrl: "https://images.unsplash.com/photo-1594824475317-7f7f98d5f199?auto=format&fit=crop&w=200&q=80",
    nextAvailable: [addDays(today, 3).toISOString(), addDays(today, 5).toISOString()],
  },
  {
    id: "provider-3",
    fullName: "Dr. Maya Patel",
    specialty: "mental_health",
    specialtyLabel: "Mental Health",
    bio: "Licensed therapist specializing in perinatal mental health, anxiety, and women’s life transitions.",
    languages: ["English", "Hindi"],
    acceptingPatients: true,
    consultationFeeCents: 6500,
    rating: 4.9,
    totalReviews: 144,
    avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80",
    nextAvailable: [addDays(today, 1).toISOString(), addDays(today, 6).toISOString()],
  },
  {
    id: "provider-4",
    fullName: "Dr. Elena Rodriguez",
    specialty: "menopause",
    specialtyLabel: "Menopause",
    bio: "Certified menopause specialist and hormone therapy expert helping women navigate midlife health.",
    languages: ["English", "Spanish"],
    acceptingPatients: true,
    consultationFeeCents: 9500,
    rating: 4.7,
    totalReviews: 87,
    avatarUrl: "https://images.unsplash.com/photo-1651008376583-7f69c95b5fc8?auto=format&fit=crop&w=200&q=80",
    nextAvailable: [addDays(today, 2).toISOString(), addDays(today, 7).toISOString()],
  },
  {
    id: "provider-5",
    fullName: "Dr. Priya Sharma",
    specialty: "nutrition",
    specialtyLabel: "Nutrition",
    bio: "Registered dietitian specializing in hormonal health, fertility nutrition, and prenatal care.",
    languages: ["English", "Hindi", "Gujarati"],
    acceptingPatients: true,
    consultationFeeCents: 5500,
    rating: 4.8,
    totalReviews: 119,
    avatarUrl: "https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=200&q=80",
    nextAvailable: [addDays(today, 1).toISOString(), addDays(today, 2).toISOString(), addDays(today, 8).toISOString()],
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    patientId: mockProfile.id,
    providerId: mockProviders[0].id,
    providerName: mockProviders[0].fullName,
    providerSpecialty: mockProviders[0].specialtyLabel,
    scheduledAt: addDays(today, 1).toISOString(),
    durationMinutes: 30,
    type: "video",
    status: "scheduled",
    chiefComplaint: "Cycle irregularity and preconception planning",
    videoRoomUrl: "/consultations/apt-1",
    notes: "Bring recent lab results.",
  },
  {
    id: "apt-2",
    patientId: mockProfile.id,
    providerId: mockProviders[2].id,
    providerName: mockProviders[2].fullName,
    providerSpecialty: mockProviders[2].specialtyLabel,
    scheduledAt: addDays(today, 6).toISOString(),
    durationMinutes: 45,
    type: "video",
    status: "scheduled",
    chiefComplaint: "Anxiety support during fertility treatment",
  },
];

export const mockSymptomLogs: SymptomLog[] = Array.from({ length: 14 }).map((_, index) => ({
  id: `symptom-${index + 1}`,
  loggedAt: subDays(today, 13 - index).toISOString(),
  symptoms: index % 3 === 0 ? ["fatigue", "bloating"] : ["headache", "anxiety"],
  mood: 5 + (index % 4),
  energy: 4 + (index % 5),
  painLevel: index % 6,
  notes: index % 4 === 0 ? "Hydrated more and walked after lunch." : undefined,
  aiInsight: index === 13 ? "Your logs show symptoms clustering ahead of your cycle. Prioritize hydration, magnesium-rich meals, and a lighter evening routine this week." : undefined,
}));

export const mockCycleLogs: CycleLog[] = [
  {
    id: "cycle-1",
    periodStart: subDays(today, 58).toISOString(),
    periodEnd: subDays(today, 53).toISOString(),
    cycleLength: 29,
    flowIntensity: "medium",
    symptoms: ["cramps", "fatigue"],
    ovulationDate: subDays(today, 44).toISOString(),
    fertileWindowStart: subDays(today, 48).toISOString(),
    fertileWindowEnd: subDays(today, 43).toISOString(),
  },
  {
    id: "cycle-2",
    periodStart: subDays(today, 29).toISOString(),
    periodEnd: subDays(today, 24).toISOString(),
    cycleLength: 30,
    flowIntensity: "heavy",
    symptoms: ["cramps", "mood swings"],
    ovulationDate: subDays(today, 15).toISOString(),
    fertileWindowStart: subDays(today, 19).toISOString(),
    fertileWindowEnd: subDays(today, 14).toISOString(),
  },
  {
    id: "cycle-3",
    periodStart: subDays(today, 1).toISOString(),
    periodEnd: addDays(today, 3).toISOString(),
    cycleLength: 29,
    flowIntensity: "light",
    symptoms: ["fatigue", "cramps"],
    ovulationDate: addDays(today, 13).toISOString(),
    fertileWindowStart: addDays(today, 10).toISOString(),
    fertileWindowEnd: addDays(today, 15).toISOString(),
  },
];

export const mockCarePlan: CarePlan = {
  id: "care-plan-1",
  title: "Preconception support plan",
  description: "A four-week plan to steady cycle awareness, nutrition, and stress recovery.",
  status: "active",
  milestones: [
    { title: "Daily folate routine", description: "Take prenatal vitamin five days this week.", targetDate: addDays(today, 5).toISOString(), completed: true, category: "nutrition" },
    { title: "Symptom check-ins", description: "Log mood, energy, and symptoms at least 5 times.", targetDate: addDays(today, 7).toISOString(), completed: true, category: "tracking" },
    { title: "Sleep consistency", description: "Hit 7.5 hours for 4 nights.", targetDate: addDays(today, 9).toISOString(), completed: false, category: "wellness" },
    { title: "Provider follow-up", description: "Review cycle pattern trends with OB/GYN.", targetDate: addDays(today, 12).toISOString(), completed: false, category: "clinical" },
  ],
};

export const mockMessages: MessageThread[] = [
  {
    id: "thread-1",
    providerName: mockProviders[0].fullName,
    providerSpecialty: mockProviders[0].specialtyLabel,
    avatarUrl: mockProviders[0].avatarUrl,
    unreadCount: 2,
    lastMessagePreview: "I reviewed your cycle trends and have a few suggestions before our visit.",
    updatedAt: subDays(today, 0).toISOString(),
    messages: [
      { id: "m1", sender: "provider", content: "I reviewed your cycle trends and have a few suggestions before our visit.", createdAt: subDays(today, 0).toISOString() },
      { id: "m2", sender: "patient", content: "Great, thank you. I also uploaded my recent labs.", createdAt: subDays(today, 0).toISOString() },
      { id: "m3", sender: "provider", content: "Perfect. Please also note any pain changes after ovulation.", createdAt: subDays(today, 0).toISOString() },
    ],
  },
  {
    id: "thread-2",
    providerName: mockProviders[2].fullName,
    providerSpecialty: mockProviders[2].specialtyLabel,
    avatarUrl: mockProviders[2].avatarUrl,
    unreadCount: 0,
    lastMessagePreview: "Let’s keep your evening wind-down routine simple this week.",
    updatedAt: subDays(today, 1).toISOString(),
    messages: [
      { id: "m4", sender: "provider", content: "Let’s keep your evening wind-down routine simple this week.", createdAt: subDays(today, 1).toISOString() },
    ],
  },
];

export const mockRecords: RecordItem[] = [
  {
    id: "record-1",
    title: "Hormone panel",
    category: "Lab result",
    date: subDays(today, 12).toISOString(),
    provider: mockProviders[0].fullName,
    summary: "Estradiol, LH, FSH and TSH uploaded for cycle review.",
  },
  {
    id: "record-2",
    title: "Pelvic ultrasound summary",
    category: "Imaging",
    date: subDays(today, 34).toISOString(),
    provider: mockProviders[0].fullName,
    summary: "Normal uterus and ovaries. Follow-up only if symptoms worsen.",
  },
];

export const mockEducation: EducationItem[] = [
  {
    id: "edu-1",
    title: "Understanding your fertile window",
    category: "Fertility",
    duration: "6 min read",
    summary: "A concise guide to ovulation timing, cervical mucus, and cycle variability.",
  },
  {
    id: "edu-2",
    title: "How mood shifts track with hormonal phases",
    category: "Mental wellness",
    duration: "4 min read",
    summary: "Simple ways to adjust workload, nutrition, and sleep around your cycle.",
  },
  {
    id: "edu-3",
    title: "What to ask at your first preconception appointment",
    category: "General health",
    duration: "8 min checklist",
    summary: "Questions to bring, labs to expect, and how to prepare your history.",
  },
];

export const mockEmployerMetrics = {
  mau: [
    { month: "Jan", users: 1240 },
    { month: "Feb", users: 1490 },
    { month: "Mar", users: 1715 },
    { month: "Apr", users: 1832 },
    { month: "May", users: 2050 },
  ],
  categories: [
    { name: "Cycle care", value: 36 },
    { name: "Mental wellness", value: 24 },
    { name: "Fertility", value: 19 },
    { name: "Nutrition", value: 12 },
    { name: "Menopause", value: 9 },
  ],
};

