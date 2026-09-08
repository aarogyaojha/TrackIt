import * as React from 'react';
import { TicketStatus } from '@trackit/types';
import {
  Check,
  Clock,
  Wrench,
  Sparkles,
  PackageCheck,
  XCircle,
} from 'lucide-react';
import {
  PUBLIC_STEPPER_STATUSES,
  PUBLIC_TRACKING_COPY,
  TICKET_STATUS_LABELS,
} from '../public-tracking.constants';

interface TicketStatusStepperProps {
  status: TicketStatus;
}

const STEP_ICONS: Record<
  (typeof PUBLIC_STEPPER_STATUSES)[number],
  React.ComponentType<{ className?: string }>
> = {
  [TicketStatus.RECEIVED]: Clock,
  [TicketStatus.IN_PROGRESS]: Wrench,
  [TicketStatus.READY]: Sparkles,
  [TicketStatus.DELIVERED]: PackageCheck,
};

export function TicketStatusStepper({ status }: TicketStatusStepperProps) {
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
          const StepIcon = STEP_ICONS[stepStatus];

          return (
            <div
              key={stepStatus}
              className="flex flex-col items-center relative group"
            >
              {/* Connector line behind icon */}
              {index < PUBLIC_STEPPER_STATUSES.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-1 z-0 transition-colors ${
                    currentStepIndex > index
                      ? 'bg-primary'
                      : 'bg-muted'
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
