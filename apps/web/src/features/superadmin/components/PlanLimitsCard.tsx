'use client';

import * as React from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plan, useUpdatePlanLimits } from '../api';
import {
  UpdatePlanLimitsFormData,
  updatePlanLimitsSchema,
} from '../schemas/update-plan-limits.schema';
import { SUPERADMIN_COPY } from '../superadmin.constants';

export interface PlanLimitsCardProps {
  plan: Plan;
}

export function PlanLimitsCard({ plan }: PlanLimitsCardProps) {
  const updateLimitsMutation = useUpdatePlanLimits(plan.tier);

  const form = useForm<UpdatePlanLimitsFormData>({
    resolver: zodResolver(updatePlanLimitsSchema) as Resolver<UpdatePlanLimitsFormData>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      maxActiveTickets: plan.limits.maxActiveTickets,
      maxStaffUsers: plan.limits.maxStaffUsers,
      maxTicketsPerMonth: plan.limits.maxTicketsPerMonth,
    },
  });

  // Reset form when plan data updates from server
  React.useEffect(() => {
    form.reset({
      maxActiveTickets: plan.limits.maxActiveTickets,
      maxStaffUsers: plan.limits.maxStaffUsers,
      maxTicketsPerMonth: plan.limits.maxTicketsPerMonth,
    });
  }, [plan.limits, form]);

  const onSubmit = async (values: UpdatePlanLimitsFormData) => {
    try {
      await updateLimitsMutation.mutateAsync({
        tier: plan.tier,
        limits: values,
      });
      toast.success(SUPERADMIN_COPY.PLANS.SAVE_SUCCESS);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to update plan limits';
      toast.error(errorMsg);
    }
  };

  const tierTitle =
    SUPERADMIN_COPY.PLANS.TIER_LABELS[
      plan.tier as keyof typeof SUPERADMIN_COPY.PLANS.TIER_LABELS
    ] || `${plan.tier} Tier`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tierTitle}</CardTitle>
        <CardDescription>
          Resource constraints applied to organizations on the {plan.tier} plan.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="maxActiveTickets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SUPERADMIN_COPY.PLANS.MAX_ACTIVE_TICKETS}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    {SUPERADMIN_COPY.PLANS.UNLIMITED_HINT}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxStaffUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SUPERADMIN_COPY.PLANS.MAX_STAFF_USERS}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    {SUPERADMIN_COPY.PLANS.UNLIMITED_HINT}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxTicketsPerMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{SUPERADMIN_COPY.PLANS.MAX_TICKETS_PER_MONTH}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    {SUPERADMIN_COPY.PLANS.UNLIMITED_HINT}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={updateLimitsMutation.isPending || !form.formState.isDirty}
            >
              {updateLimitsMutation.isPending
                ? SUPERADMIN_COPY.PLANS.SAVING
                : SUPERADMIN_COPY.PLANS.SAVE_BUTTON}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
