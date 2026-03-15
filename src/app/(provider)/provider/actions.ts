"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const prescriptionSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  medicationName: z.string().min(2, "Medication name is required."),
  dosage: z.string().min(1, "Dosage is required."),
  frequency: z.string().min(1, "Frequency is required."),
  instructions: z.string().min(5, "Add brief instructions for the patient."),
  refillsRemaining: z.coerce.number().int().min(0).max(12),
  expiresAt: z.string().optional(),
});

const labOrderSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  panelName: z.string().min(2, "Panel name is required."),
  summary: z.string().min(5, "Add a short note for the patient."),
});

async function requireProviderContext() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || profile?.role !== "provider") {
    redirect("/login");
  }

  const supabase = await getSupabaseServerClient();
  const { data: providerRow, error } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error || !providerRow?.id) {
    throw new Error(error?.message ?? "Provider record not found.");
  }

  return {
    supabase,
    userId: user.id,
    providerId: providerRow.id,
  };
}

function toProviderRedirect(path: Route, message?: string, error?: string): never {
  const search = new URLSearchParams();
  if (message) search.set("message", message);
  if (error) search.set("error", error);
  redirect((search.size ? `${path}?${search.toString()}` : path) as Route);
}

export async function createPrescriptionAction(formData: FormData) {
  const payload = prescriptionSchema.safeParse({
    patientId: String(formData.get("patientId") ?? ""),
    medicationName: String(formData.get("medicationName") ?? "").trim(),
    dosage: String(formData.get("dosage") ?? "").trim(),
    frequency: String(formData.get("frequency") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
    refillsRemaining: String(formData.get("refillsRemaining") ?? "0"),
    expiresAt: String(formData.get("expiresAt") ?? "").trim() || undefined,
  });

  if (!payload.success) {
    toProviderRedirect("/provider/prescriptions", undefined, payload.error.issues[0]?.message ?? "Unable to save prescription.");
  }

  const { supabase, userId, providerId } = await requireProviderContext();
  const prescription = payload.data;

  const { error } = await supabase.from("prescriptions").insert({
    patient_id: prescription.patientId,
    provider_id: providerId,
    medication_name: prescription.medicationName,
    dosage: prescription.dosage,
    frequency: prescription.frequency,
    instructions: prescription.instructions,
    refills_remaining: prescription.refillsRemaining,
    expires_at: prescription.expiresAt ? new Date(prescription.expiresAt).toISOString() : null,
    status: "active",
  });

  if (error) {
    toProviderRedirect("/provider/prescriptions", undefined, "Unable to save this prescription right now.");
  }

  await supabase.from("notifications").insert({
    recipient_id: prescription.patientId,
    actor_id: userId,
    type: "prescription_created",
    title: "New prescription available",
    body: `${prescription.medicationName} was added to your care plan.`,
    link: "/records",
  });

  revalidatePath("/provider/prescriptions");
  revalidatePath("/records");
  toProviderRedirect("/provider/prescriptions", "Prescription added.");
}

export async function createLabOrderAction(formData: FormData) {
  const payload = labOrderSchema.safeParse({
    patientId: String(formData.get("patientId") ?? ""),
    panelName: String(formData.get("panelName") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
  });

  if (!payload.success) {
    toProviderRedirect("/provider/labs", undefined, payload.error.issues[0]?.message ?? "Unable to save lab order.");
  }

  const { supabase, userId, providerId } = await requireProviderContext();
  const labOrder = payload.data;

  const { error } = await supabase.from("lab_results").insert({
    patient_id: labOrder.patientId,
    provider_id: providerId,
    panel_name: labOrder.panelName,
    status: "ordered",
    summary: labOrder.summary,
    markers: [],
  });

  if (error) {
    toProviderRedirect("/provider/labs", undefined, "Unable to create this lab order right now.");
  }

  await supabase.from("notifications").insert({
    recipient_id: labOrder.patientId,
    actor_id: userId,
    type: "lab_ordered",
    title: "Lab order added",
    body: `${labOrder.panelName} has been ordered by your provider.`,
    link: "/records",
  });

  revalidatePath("/provider/labs");
  revalidatePath("/records");
  toProviderRedirect("/provider/labs", "Lab order added.");
}