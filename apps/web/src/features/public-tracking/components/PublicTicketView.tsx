import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/app.constants';
import { StatusBadge } from '@/features/tickets/components/StatusBadge';
import { PublicTicketData } from '../api/usePublicTicket';
import { PUBLIC_TRACKING_COPY } from '../public-tracking.constants';
import { TicketStatusStepper } from './TicketStatusStepper';

interface PublicTicketViewProps {
  ticket: PublicTicketData;
}

export function PublicTicketView({ ticket }: PublicTicketViewProps) {
  const createdDateFormatted = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Header section */}
      <div className="space-y-2 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {ticket.organizationName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {PUBLIC_TRACKING_COPY.TICKET_CODE_LABEL}:{' '}
            <span className="font-mono font-semibold text-foreground">
              {ticket.code}
            </span>
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          {PUBLIC_TRACKING_COPY.LIVE_UPDATE_BADGE}
        </div>
      </div>

      {/* Stepper Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {ticket.organizationName} — {PUBLIC_TRACKING_COPY.PAGE_TITLE_SUFFIX}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TicketStatusStepper status={ticket.status} />
        </CardContent>
      </Card>

      {/* Ticket Details Grid */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {PUBLIC_TRACKING_COPY.CUSTOMER_LABEL}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {ticket.customerName}
              </p>
            </div>

            {createdDateFormatted && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {PUBLIC_TRACKING_COPY.CREATED_LABEL}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {createdDateFormatted}
                </p>
              </div>
            )}

            <div className="sm:col-span-2 space-y-1 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">
                {PUBLIC_TRACKING_COPY.ITEM_LABEL}
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {ticket.itemDescription}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status History Timeline */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {PUBLIC_TRACKING_COPY.STATUS_TIMELINE_TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {ticket.statusHistory.map((item, index) => {
                const timeString = new Date(item.changedAt).toLocaleString(
                  undefined,
                  {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  },
                );

                return (
                  <div key={index} className="relative">
                    <div className="absolute -left-6 top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {timeString}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {PUBLIC_TRACKING_COPY.TIMELINE_EMPTY}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Footer attribution */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground">
          {PUBLIC_TRACKING_COPY.FOOTER_ATTRIBUTION_PREFIX}{' '}
          <Link
            href={ROUTES.HOME}
            className="font-semibold text-foreground hover:underline transition-colors"
          >
            {PUBLIC_TRACKING_COPY.FOOTER_ATTRIBUTION_BRAND}
          </Link>
        </p>
      </div>
    </div>
  );
}
