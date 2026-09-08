'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CheckIcon, CopyIcon, QrCodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Ticket } from '../api/types';
import {
  TICKET_DETAIL_COPY,
  TICKET_STATUS_LABELS,
} from '../tickets.constants';
import { StatusBadge } from './StatusBadge';
import { StatusUpdateControl } from './StatusUpdateControl';

export interface TicketDetailViewProps {
  ticket: Ticket;
}

export function TicketDetailView({ ticket }: TicketDetailViewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    if (!ticket.publicUrl) return;
    try {
      await navigator.clipboard.writeText(ticket.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard fails
    }
  };

  const formattedCreated = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/tickets">
            <ArrowLeftIcon className="mr-1 size-4" />
            {TICKET_DETAIL_COPY.BACK_BUTTON}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Created: {formattedCreated}
          </span>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Details & History */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-medium text-muted-foreground uppercase">
                    {TICKET_DETAIL_COPY.CODE_PREFIX}
                  </span>
                  <CardTitle className="text-2xl font-mono font-bold text-foreground">
                    {ticket.code}
                  </CardTitle>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {TICKET_DETAIL_COPY.CUSTOMER_SECTION_TITLE}
                  </h4>
                  <p className="font-medium text-foreground">
                    {ticket.customerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.customerPhone}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {TICKET_DETAIL_COPY.ITEM_SECTION_TITLE}
                  </h4>
                  <p className="text-sm text-foreground">
                    {ticket.itemDescription}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  {TICKET_DETAIL_COPY.UPDATE_STATUS_TITLE}
                </h4>
                <StatusUpdateControl
                  ticketId={ticket.id}
                  currentStatus={ticket.status}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {TICKET_DETAIL_COPY.TIMELINE_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
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
                            <span className="text-sm font-medium text-foreground">
                              {TICKET_STATUS_LABELS[item.status]}
                            </span>
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
                  {TICKET_DETAIL_COPY.TIMELINE_EMPTY}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: QR Code & Public URL */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCodeIcon className="size-5 text-muted-foreground" />
                <CardTitle className="text-lg">
                  {TICKET_DETAIL_COPY.PUBLIC_TRACKING_TITLE}
                </CardTitle>
              </div>
              <CardDescription>
                {TICKET_DETAIL_COPY.PUBLIC_TRACKING_DESCRIPTION}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center space-y-4">
              {ticket.qrCodeDataUrl ? (
                <div className="rounded-lg border border-border bg-white p-3 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ticket.qrCodeDataUrl}
                    alt={TICKET_DETAIL_COPY.QR_CODE_ALT}
                    className="size-48 object-contain"
                  />
                </div>
              ) : null}

              <div className="w-full space-y-2">
                <p className="text-xs font-medium text-muted-foreground text-left">
                  {TICKET_DETAIL_COPY.PUBLIC_URL_LABEL}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={ticket.publicUrl}
                    className="flex-1 min-w-0 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-xs text-foreground font-mono focus:outline-hidden"
                  />
                  <Tooltip open={copied} onOpenChange={setCopied}>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLink}
                          aria-label={TICKET_DETAIL_COPY.COPY_LINK_BUTTON}
                        >
                          {copied ? (
                            <CheckIcon className="size-4 text-success" />
                          ) : (
                            <CopyIcon className="size-4" />
                          )}
                        </Button>
                      }
                    />
                    <TooltipContent>
                      {TICKET_DETAIL_COPY.LINK_COPIED_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
