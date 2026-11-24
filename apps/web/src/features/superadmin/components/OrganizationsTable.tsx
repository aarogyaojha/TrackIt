import * as React from 'react';
import Link from 'next/link';
import { QrCodeIcon } from 'lucide-react';
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
import { OrgQrDialog } from './OrgQrDialog';

export interface OrganizationsTableProps {
  organizations: SuperAdminOrganization[];
  emptyMessage?: string;
}

export function OrganizationsTable({
  organizations,
  emptyMessage = SUPERADMIN_COPY.ORGANIZATIONS.EMPTY_STATES.ALL,
}: OrganizationsTableProps) {
  const [selectedQrOrg, setSelectedQrOrg] =
    React.useState<SuperAdminOrganization | null>(null);

  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card List (md:hidden) */}
      <div className="md:hidden space-y-3">
        {organizations.map((org) => {
          const formattedDate = org.createdAt
            ? new Date(org.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '—';

          return (
            <div
              key={org.id}
              className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {org.name}
                  </h4>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">
                    {org.slug}
                  </p>
                </div>
                <OrgStatusBadge status={org.status} />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>{SUPERADMIN_COPY.ORGANIZATIONS.TABLE.CREATED}:</span>
                <span className="font-medium text-foreground">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs text-foreground"
                  onClick={() => setSelectedQrOrg(org)}
                >
                  <QrCodeIcon className="size-3.5 text-primary" />
                  <span>{SUPERADMIN_COPY.ORGANIZATIONS.QR.VIEW_QR_BUTTON}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs"
                  asChild
                >
                  <Link href={`/superadmin/organizations/${org.id}`}>
                    {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.VIEW_DETAILS}
                  </Link>
                </Button>
              </div>

              <div className="pt-2 border-t border-border/40">
                <OrgActionButtons org={org} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (hidden md:block) */}
      <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-12 border-b bg-muted/20">
              <TableHead className="min-w-[180px] font-semibold text-sm">
                {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.NAME}
              </TableHead>
              <TableHead className="w-[150px] font-semibold text-sm">
                {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.SLUG}
              </TableHead>
              <TableHead className="w-[110px] font-semibold text-sm">
                {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.STATUS}
              </TableHead>
              <TableHead className="w-[130px] font-semibold text-sm">
                {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.CREATED}
              </TableHead>
              <TableHead className="w-[120px] font-semibold text-sm">
                {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.QR_CODE}
              </TableHead>
              <TableHead className="min-w-[170px] font-semibold text-sm">
                {SUPERADMIN_COPY.ORGANIZATIONS.TABLE.ACTIONS}
              </TableHead>
              <TableHead className="w-[120px] text-right font-semibold text-sm">
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
                <TableRow key={org.id} className="h-16 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground py-4">
                    {org.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground py-4">
                    {org.slug}
                  </TableCell>
                  <TableCell className="py-4">
                    <OrgStatusBadge status={org.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-4">
                    {formattedDate}
                  </TableCell>
                  <TableCell className="py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-foreground hover:border-primary/50"
                      onClick={() => setSelectedQrOrg(org)}
                      title={SUPERADMIN_COPY.ORGANIZATIONS.QR.TOOLTIP_LABEL}
                    >
                      <QrCodeIcon className="size-3.5 text-primary" />
                      <span>{SUPERADMIN_COPY.ORGANIZATIONS.QR.VIEW_QR_BUTTON}</span>
                    </Button>
                  </TableCell>
                  <TableCell className="py-4">
                    <OrgActionButtons org={org} />
                  </TableCell>
                  <TableCell className="text-right py-4">
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

      {selectedQrOrg && (
        <OrgQrDialog
          open={Boolean(selectedQrOrg)}
          onOpenChange={(open) => !open && setSelectedQrOrg(null)}
          orgId={selectedQrOrg.id}
          orgName={selectedQrOrg.name}
          orgSlug={selectedQrOrg.slug}
        />
      )}
    </>
  );
}
