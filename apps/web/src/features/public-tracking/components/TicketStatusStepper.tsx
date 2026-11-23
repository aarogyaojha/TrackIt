import * as React from 'react';
import { StatusCategory, TicketStatus } from '@trackit/types';
import {
  Check,
  Clock,
  PackageCheck,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import { WorkflowDetail } from '@/features/workflows/api/types';
import {
  PUBLIC_STEPPER_STATUSES,
  PUBLIC_TRACKING_COPY,
  TICKET_STATUS_LABELS,
} from '../public-tracking.constants';

interface TicketStatusStepperProps {
  status?: TicketStatus | string;
  category?: StatusCategory;
  customerLabel?: string;
  stages?: Array<{
    customerLabel: string;
    customerDescription?: string;
    category: StatusCategory;
  }>;
  workflow?: WorkflowDetail;
}

const CATEGORY_ICONS: Record<
  StatusCategory,
  React.ComponentType<{ className?: string }>
> = {
  [StatusCategory.INITIAL]: Clock,
  [StatusCategory.IN_PROGRESS]: Wrench,
  [StatusCategory.READY]: Sparkles,
  [StatusCategory.COMPLETED]: PackageCheck,
  [StatusCategory.CANCELLED]: XCircle,
};

const LEGACY_STEP_ICONS: Record<
  (typeof PUBLIC_STEPPER_STATUSES)[number],
  React.ComponentType<{ className?: string }>
> = {
  [TicketStatus.RECEIVED]: Clock,
  [TicketStatus.IN_PROGRESS]: Wrench,
  [TicketStatus.READY]: Sparkles,
  [TicketStatus.DELIVERED]: PackageCheck,
};

export function TicketStatusStepper({
  status,
  category,
  customerLabel,
  stages,
  workflow,
}: TicketStatusStepperProps) {
  // Normalize stages from either ticket.stages or workflow.statuses
  const rawSteps =
    stages && stages.length > 0
      ? stages.map((s, idx) => ({
          key: `stage-${idx}`,
          name: s.customerLabel,
          customerLabel: s.customerLabel,
          customerDescription: s.customerDescription,
          category: s.category,
          order: idx,
        }))
      : workflow?.statuses && workflow.statuses.length > 0
        ? workflow.statuses
        : null;

  if (rawSteps && rawSteps.length > 0) {
    const isCancelled =
      category === StatusCategory.CANCELLED ||
      status === TicketStatus.CANCELLED ||
      rawSteps.find(
        (s) =>
          status && s.key.toLowerCase() === (status as string).toLowerCase(),
      )?.category === StatusCategory.CANCELLED;

    if (isCancelled) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive">
            <XCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">
            {PUBLIC_TRACKING_COPY.CANCELLED_TITLE}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {PUBLIC_TRACKING_COPY.CANCELLED_DESCRIPTION}
          </p>
        </div>
      );
    }

    const linearSteps = [...rawSteps]
      .filter((s) => s.category !== StatusCategory.CANCELLED)
      .sort((a, b) => a.order - b.order);

    const currentStepIndex = linearSteps.findIndex((s) => {
      if (customerLabel) {
        return (
          (s.customerLabel || '').toLowerCase().trim() ===
          customerLabel.toLowerCase().trim()
        );
      }
      if (status) {
        return (
          s.key.toLowerCase().trim() ===
          (status as string).toLowerCase().trim()
        );
      }
      if (category) {
        return s.category === category;
      }
      return false;
    });

    return (
      <div className="w-full py-4 overflow-x-auto pb-6">
        <div
          className="flex md:grid items-start gap-3 relative min-w-max md:min-w-0"
          style={{
            gridTemplateColumns: `repeat(${linearSteps.length}, minmax(110px, 1fr))`,
            minWidth:
              linearSteps.length > 5
                ? `${linearSteps.length * 125}px`
                : undefined,
          }}
        >
          {linearSteps.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = currentStepIndex === index;
            const StepIcon = CATEGORY_ICONS[step.category] || Clock;

            return (
              <div
                key={step.key}
                className="flex-1 flex flex-col items-center relative group min-w-[100px]"
              >
                {/* Connector line behind icon */}
                {index < linearSteps.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-1 z-0 transition-colors ${
                      currentStepIndex > index ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}

                {/* Step indicator circle */}
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md scale-110'
                        : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Step label */}
                <div className="mt-3 text-center px-1">
                  <p
                    className={`text-xs sm:text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'text-primary font-semibold'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.customerLabel || step.name}
                  </p>
                  {step.customerDescription && isCurrent && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 max-w-[130px]">
                      {step.customerDescription}
                    </p>
                  )}
                  {isCurrent && (
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Current
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Legacy fallback without custom workflow
  if (status === TicketStatus.CANCELLED) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive">
          <XCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-destructive">
          {PUBLIC_TRACKING_COPY.CANCELLED_TITLE}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {PUBLIC_TRACKING_COPY.CANCELLED_DESCRIPTION}
        </p>
      </div>
    );
  }

  const currentStepIndex = PUBLIC_STEPPER_STATUSES.indexOf(
    status as (typeof PUBLIC_STEPPER_STATUSES)[number],
  );

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-4 gap-2 relative">
        {PUBLIC_STEPPER_STATUSES.map((stepStatus, index) => {
          const isCompleted = currentStepIndex > index;
          const isCurrent = currentStepIndex === index;
          const StepIcon = LEGACY_STEP_ICONS[stepStatus] || Clock;

          return (
            <div
              key={stepStatus}
              className="flex flex-col items-center relative group"
            >
              {/* Connector line behind icon */}
              {index < PUBLIC_STEPPER_STATUSES.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-1 z-0 transition-colors ${
                    currentStepIndex > index ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}

              {/* Step indicator circle */}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md scale-110'
                      : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>

              {/* Step label */}
              <div className="mt-3 text-center">
                <p
                  className={`text-xs sm:text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'text-primary font-semibold'
                      : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }`}
                >
                  {TICKET_STATUS_LABELS[stepStatus]}
                </p>
                {isCurrent && (
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    Current
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

