export type TeacherCommissionEntry = {
  amount: number | string | null;
  available_at: string;
  withdrawal_id?: string | null;
  settled_at?: string | null;
};

export function calculateTeacherBalances(
  entries: TeacherCommissionEntry[],
  now: Date = new Date(),
) {
  let available = 0;
  let unsettled = 0;
  let lifetime = 0;
  const nowTimestamp = now.getTime();

  for (const entry of entries) {
    const amount = Number(entry.amount || 0);
    lifetime += amount;

    if (entry.withdrawal_id || entry.settled_at) continue;
    unsettled += amount;

    const availableAt = new Date(entry.available_at).getTime();
    if (!Number.isNaN(availableAt) && availableAt <= nowTimestamp) {
      available += amount;
    }
  }

  const balanceAvailable = Math.max(0, available);
  const balancePending = Math.max(0, unsettled - balanceAvailable);

  return {
    balanceAvailable: Number(balanceAvailable.toFixed(2)),
    balancePending: Number(balancePending.toFixed(2)),
    estimatedEarnings: Number(lifetime.toFixed(2)),
  };
}

export function summarizeAdminCosts({
  gatewayAndManualCosts,
  gatewayCosts,
  teacherCommissions,
}: {
  gatewayAndManualCosts: number;
  gatewayCosts: number;
  teacherCommissions: number;
}) {
  return {
    manualCosts: Math.max(0, gatewayAndManualCosts - gatewayCosts),
    totalCosts: gatewayAndManualCosts + teacherCommissions,
  };
}
