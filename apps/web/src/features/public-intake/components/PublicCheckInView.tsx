'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
  SparklesIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/app.constants';
import { PublicIntakeData } from '../api/usePublicIntake';
import { useSubmitPublicTicket } from '../api/useSubmitPublicTicket';
import { PUBLIC_INTAKE_COPY } from '../public-intake.constants';
import {
  PublicCheckInFormData,
  publicCheckInSchema,
} from '../schemas/public-check-in.schema';

export interface PublicCheckInViewProps {
  intake: PublicIntakeData;
}

export function PublicCheckInView({ intake }: PublicCheckInViewProps) {
  const router = useRouter();
  const { mutate: submitTicket, isPending } = useSubmitPublicTicket();

  const defaultWorkflow =
    intake.workflows.find((w) => w.isDefault) || intake.workflows[0];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PublicCheckInFormData>({
    resolver: zodResolver(publicCheckInSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      itemDescription: '',
      workflowId: defaultWorkflow?.id,
    },
  });

  const onSubmit = (formData: PublicCheckInFormData) => {
    submitTicket(
      { orgSlug: intake.orgSlug, payload: formData },
      {
        onSuccess: (ticket) => {
          toast.success(PUBLIC_INTAKE_COPY.SUCCESS_TOAST_TITLE, {
            description: PUBLIC_INTAKE_COPY.SUCCESS_TOAST_DESC,
          });
          // Redirect immediately to customer's live status tracking page
          router.push(`/${intake.orgSlug}/t/${ticket.code}`);
        },
        onError: (err) => {
          const message =
            err.response?.data?.error?.message ||
            'Failed to submit ticket. Please check your details and try again.';
          toast.error(message);
        },
      },
    );
  };

  const hasMultipleWorkflows = intake.workflows && intake.workflows.length > 1;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Business Header Card */}
      <Card className="shadow-sm border-primary/20 bg-card">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {PUBLIC_INTAKE_COPY.BADGE}
          </span>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {intake.organizationName}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
            {PUBLIC_INTAKE_COPY.SUBHEADING}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Check-in Form Card */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <Label htmlFor="customerName" className="text-sm font-medium">
                {PUBLIC_INTAKE_COPY.CUSTOMER_NAME_LABEL}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder={PUBLIC_INTAKE_COPY.CUSTOMER_NAME_PLACEHOLDER}
                disabled={isPending}
                {...register('customerName')}
                className="h-10 text-base sm:text-sm"
              />
              {errors.customerName && (
                <p className="text-xs font-medium text-destructive">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            {/* Customer Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="customerPhone" className="text-sm font-medium">
                {PUBLIC_INTAKE_COPY.CUSTOMER_PHONE_LABEL}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder={PUBLIC_INTAKE_COPY.CUSTOMER_PHONE_PLACEHOLDER}
                disabled={isPending}
                {...register('customerPhone')}
                className="h-10 text-base sm:text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                {PUBLIC_INTAKE_COPY.CUSTOMER_PHONE_HINT}
              </p>
              {errors.customerPhone && (
                <p className="text-xs font-medium text-destructive">
                  {errors.customerPhone.message}
                </p>
              )}
            </div>

            {/* Workflow / Service Selector (only rendered if business has > 1 active workflow) */}
            {hasMultipleWorkflows && (
              <div className="space-y-1.5">
                <Label htmlFor="workflowId" className="text-sm font-medium">
                  {PUBLIC_INTAKE_COPY.SERVICE_TYPE_LABEL}
                </Label>
                <Controller
                  control={control}
                  name="workflowId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue
                          placeholder={
                            PUBLIC_INTAKE_COPY.SERVICE_TYPE_PLACEHOLDER
                          }
                        >
                          {(val: string | null) => {
                            const wf = intake.workflows.find(
                              (w) => w.id === val,
                            );
                            if (!wf) return null;
                            return `${wf.name}${wf.isDefault ? ' (Standard)' : ''}`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {intake.workflows.map((wf) => (
                          <SelectItem key={wf.id} value={wf.id}>
                            <div className="flex flex-col text-left py-0.5">
                              <span className="font-medium text-foreground">
                                {wf.name}
                                {wf.isDefault ? ' (Standard)' : ''}
                              </span>
                              {wf.description && (
                                <span className="text-xs text-muted-foreground">
                                  {wf.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Item & Service Description */}
            <div className="space-y-1.5">
              <Label htmlFor="itemDescription" className="text-sm font-medium">
                {PUBLIC_INTAKE_COPY.ITEM_LABEL}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="itemDescription"
                placeholder={PUBLIC_INTAKE_COPY.ITEM_PLACEHOLDER}
                disabled={isPending}
                rows={4}
                {...register('itemDescription')}
                className="text-base sm:text-sm leading-relaxed"
              />
              {errors.itemDescription && (
                <p className="text-xs font-medium text-destructive">
                  {errors.itemDescription.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className="w-full gap-2 text-base font-semibold shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    {PUBLIC_INTAKE_COPY.SUBMITTING_BUTTON}
                  </>
                ) : (
                  <>
                    <CheckCircle2Icon className="h-4 w-4" />
                    {PUBLIC_INTAKE_COPY.SUBMIT_BUTTON}
                    <ArrowRightIcon className="h-4 w-4 ml-auto" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer attribution */}
      <div className="text-center pt-2 pb-6">
        <p className="text-xs text-muted-foreground">
          {PUBLIC_INTAKE_COPY.FOOTER_ATTRIBUTION_PREFIX}{' '}
          <Link
            href={ROUTES.HOME}
            className="font-semibold text-foreground hover:underline transition-colors"
          >
            {PUBLIC_INTAKE_COPY.FOOTER_ATTRIBUTION_BRAND}
          </Link>
        </p>
      </div>
    </div>
  );
}

