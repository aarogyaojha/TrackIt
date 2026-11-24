import * as React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Ticket } from '../api/types';
import { TICKETS_LIST_COPY } from '../tickets.constants';
import { StatusBadge } from './StatusBadge';

export interface TicketTableProps {
  tickets: Ticket[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <h3 className="text-base font-semibold text-foreground">
          {TICKETS_LIST_COPY.EMPTY_STATE_TITLE}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {TICKETS_LIST_COPY.EMPTY_STATE_DESCRIPTION}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="h-12 border-b bg-muted/20">
            <TableHead className="w-[140px] font-semibold text-sm">
              {TICKETS_LIST_COPY.TABLE_HEADER_CODE}
            </TableHead>
            <TableHead className="min-w-[150px] font-semibold text-sm">
              {TICKETS_LIST_COPY.TABLE_HEADER_CUSTOMER}
            </TableHead>
            <TableHead className="min-w-[200px] font-semibold text-sm">
              {TICKETS_LIST_COPY.TABLE_HEADER_ITEM}
            </TableHead>
            <TableHead className="w-[130px] font-semibold text-sm">
              {TICKETS_LIST_COPY.TABLE_HEADER_STATUS}
            </TableHead>
            <TableHead className="w-[130px] font-semibold text-sm">
              {TICKETS_LIST_COPY.TABLE_HEADER_CREATED}
            </TableHead>
            <TableHead className="w-[100px] text-right font-semibold text-sm">
              {TICKETS_LIST_COPY.TABLE_HEADER_ACTIONS}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const formattedDate = ticket.createdAt
              ? new Date(ticket.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—';

            return (
              <TableRow key={ticket.id} className="h-16 hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono font-bold text-sm text-primary py-4">
                  {ticket.code}
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-semibold text-sm text-foreground">
                    {ticket.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ticket.customerPhone}
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-muted-foreground text-sm py-4">
                  {ticket.itemDescription}
                </TableCell>
                <TableCell className="py-4">
                  <StatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-4">
                  {formattedDate}
                </TableCell>
                <TableCell className="text-right py-4">
                  <Button variant="ghost" size="sm" asChild className="h-9 px-3 font-medium">
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      {TICKETS_LIST_COPY.VIEW_DETAILS_BUTTON}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
