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
import { SuperAdminOrganization } from '../api/types';
import { SUPERADMIN_COPY } from '../superadmin.constants';
import { OrgActionButtons } from './OrgActionButtons';
import { OrgStatusBadge } from './OrgStatusBadge';

export interface OrganizationsTableProps {
  organizations: SuperAdminOrganization[];
  emptyMessage?: string;
}

export function OrganizationsTable({
  organizations,
  emptyMessage = SUPERADMIN_COPY.ORGANIZATIONS.EMPTY_STATES.ALL,
}: OrganizationsTableProps) {
  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">
              {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.NAME}
            </TableHead>
            <TableHead className="w-[160px]">
              {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.SLUG}
            </TableHead>
            <TableHead className="w-[120px]">
              {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.STATUS}
            </TableHead>
            <TableHead className="w-[140px]">
              {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.CREATED}
            </TableHead>
            <TableHead className="min-w-[180px]">
              {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.ACTIONS}
            </TableHead>
            <TableHead className="w-[120px] text-right">
              {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.VIEW_DETAILS}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => {
            const formattedDate = org.createdAt
              ? new Date(org.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—';

            return (
              <TableRow key={org.id}>
                <TableCell className="font-medium text-foreground">
                  {org.name}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {org.slug}
                </TableCell>
                <TableCell>
                  <OrgStatusBadge status={org.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formattedDate}
                </TableCell>
                <TableCell>
                  <OrgActionButtons org={org} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/superadmin/organizations/${org.id}`}>
                      {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.VIEW_DETAILS}
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
