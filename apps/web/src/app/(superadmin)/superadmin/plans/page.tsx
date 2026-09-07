'use client';

import * as React from 'react';
import { PlanTier } from '@trackit/types';
import { SuperAdminPlansSkeleton } from '@/components/skeletons/SuperAdminPlansSkeleton';
import { usePlans } from '@/features/superadmin/api';
import { PlanLimitsCard } from '@/features/superadmin/components';
import { SUPERADMIN_COPY } from '@/features/superadmin/superadmin.constants';

export default function SuperAdminPlansPage() {
  const { data: plans, isLoading, isError, error } = usePlans();

  if (isLoading) {
    return <SuperAdminPlansSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
        {error?.message || 'Failed to load plans.'}
      </div>
    );
  }

  // Ensure stable tier order: FREE, BASIC, PRO
  const tierOrder = [PlanTier.FREE, PlanTier.BASIC, PlanTier.PRO];
  const sortedPlans = [...(plans || [])].sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {SUPERADMIN_COPY.PLANS.TITLE}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {SUPERADMIN_COPY.PLANS.DESCRIPTION}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => (
          <PlanLimitsCard key={plan.tier} plan={plan} />
        ))}
      </div>
    </div>
  );
}
