export const fallbackMembershipPlans = [
  {
    name: 'MONTHLY',
    label: 'Monthly',
    duration: '1 Month',
    durationMonths: 1,
    price: 1200,
    description: 'A flexible monthly rhythm for building consistency.',
    features: ['Full gym access', 'Locker access', 'Community support'],
  },
  {
    name: 'QUARTERLY',
    label: 'Quarterly',
    duration: '3 Months',
    durationMonths: 3,
    price: 2500,
    description: 'A focused three-month block for measurable progress.',
    features: ['Full gym access', 'Group classes', 'Progress tracking'],
    recommended: true,
  },
  {
    name: 'YEARLY',
    label: 'Yearly',
    duration: '12 Months',
    durationMonths: 12,
    price: 6000,
    description: 'The best long-term value for a lasting routine.',
    features: ['Full gym access', 'Personal training guidance', 'Nutrition support'],
  },
];

export function normalizeMembershipPlan(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'BASIC' || normalized === 'MONTH' || normalized === '1 MONTH') return 'MONTHLY';
  if (normalized === 'PREMIUM' || normalized === 'QUARTER' || normalized === '3 MONTHS') return 'QUARTERLY';
  if (normalized === 'VIP' || normalized === 'YEAR' || normalized === 'ANNUAL' || normalized === '12 MONTHS') return 'YEARLY';
  return normalized;
}

export function planDetails(value, plans = fallbackMembershipPlans) {
  const name = normalizeMembershipPlan(value);
  return plans.find(plan => normalizeMembershipPlan(plan.name) === name) || null;
}

export function membershipPrice(value, plans = fallbackMembershipPlans) {
  return planDetails(value, plans)?.price;
}

export function calculateMembershipEndDate(startDate, plan, plans = fallbackMembershipPlans) {
  if (!startDate || !planDetails(plan, plans)) return '';
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + planDetails(plan, plans).durationMonths);
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatPlanName(value, plans = fallbackMembershipPlans) {
  return planDetails(value, plans)?.label || String(value || 'Not assigned');
}
