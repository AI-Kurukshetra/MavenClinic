export const partnerAccessLevels = ["view_appointments", "view_pregnancy", "view_fertility", "full"] as const;

export type PartnerAccessLevel = (typeof partnerAccessLevels)[number];

export function isPartnerAccessLevel(value: string): value is PartnerAccessLevel {
  return partnerAccessLevels.includes(value as PartnerAccessLevel);
}

export function getPartnerAccessLevelLabel(value: PartnerAccessLevel) {
  if (value === "view_appointments") {
    return "Appointments only";
  }

  if (value === "view_pregnancy") {
    return "Pregnancy journey";
  }

  if (value === "view_fertility") {
    return "Fertility journey";
  }

  return "Full access";
}

export function getPartnerAccessSummary(value: PartnerAccessLevel) {
  if (value === "view_appointments") {
    return "View upcoming appointments";
  }

  if (value === "view_pregnancy") {
    return "View appointments and pregnancy milestones";
  }

  if (value === "view_fertility") {
    return "View appointments, fertility, and cycle data";
  }

  return "View everything";
}

export function getPartnerAccessPortalLabel(value: PartnerAccessLevel) {
  if (value === "view_appointments") {
    return "Appointments";
  }

  if (value === "view_pregnancy") {
    return "Appointments + Pregnancy";
  }

  if (value === "view_fertility") {
    return "Appointments + Fertility";
  }

  return "Appointments + Pregnancy + Fertility + Messages";
}
