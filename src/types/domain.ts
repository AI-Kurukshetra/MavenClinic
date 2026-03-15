import type { ReactNode } from "react";

﻿export type UserRole = "patient" | "provider" | "employer_admin" | "clinic_admin" | "super_admin" | "partner";

export type ProviderSpecialty =
  | "ob_gyn"
  | "fertility"
  | "mental_health"
  | "nutrition"
  | "lactation"
  | "menopause"
  | "general";

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  firstName: string;
  dateOfBirth?: string;
  phone?: string;
  avatarUrl?: string;
  onboardingComplete: boolean;
  employerId?: string;
}

export interface Provider {
  id: string;
  profileId?: string;
  fullName: string;
  specialty: ProviderSpecialty;
  specialtyLabel: string;
  bio: string;
  languages: string[];
  acceptingPatients: boolean;
  consultationFeeCents: number;
  rating: number;
  totalReviews: number;
  avatarUrl?: string;
  nextAvailable: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  providerAvatarUrl?: string;
  scheduledAt: string;
  durationMinutes: number;
  type: "video" | "messaging" | "async_review";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  chiefComplaint: string;
  videoRoomUrl?: string;
  notes?: string;
  paymentMethod?: "insurance" | "direct_pay";
  startedAt?: string;
  completedAt?: string;
}

export interface SymptomLog {
  id: string;
  loggedAt: string;
  symptoms: string[];
  mood: number;
  energy: number;
  painLevel: number;
  sleepHours?: number;
  notes?: string;
  aiInsight?: string;
}

export interface CycleLog {
  id: string;
  periodStart: string;
  periodEnd: string;
  cycleLength: number;
  flowIntensity: "spotting" | "light" | "medium" | "heavy";
  symptoms: string[];
  ovulationDate?: string;
  fertileWindowStart?: string;
  fertileWindowEnd?: string;
  notes?: string;
}

export interface CarePlanMilestone {
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  category: string;
}

export interface CarePlan {
  id: string;
  title: string;
  description: string;
  status: string;
  milestones: CarePlanMilestone[];
}

export interface MessageThread {
  id: string;
  providerName: string;
  providerSpecialty: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessagePreview: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: "patient" | "provider";
    content: string;
    createdAt: string;
  }[];
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  status: "active" | "completed" | "cancelled";
  prescribedAt: string;
  expiresAt?: string | null;
  refillsRemaining: number;
  providerName: string;
  patientName?: string;
}

export interface LabResult {
  id: string;
  panelName: string;
  status: "ordered" | "collected" | "resulted" | "reviewed";
  orderedAt: string;
  resultedAt?: string | null;
  summary: string;
  markers: Array<{ label: string; value: string; flag?: "normal" | "high" | "low" }>;
  providerName: string;
  patientName?: string;
}

export interface RecordItem {
  id: string;
  title: string;
  category: string;
  date: string;
  provider: string;
  summary: string;
}

export interface EducationItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  summary: string;
}

export interface EmployerMetric {
  title: string;
  value: string;
  delta: string;
  icon?: ReactNode;
}