'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SuperAdminOrgDetailSkeleton } from '@/components/skeletons/SuperAdminOrgDetailSkeleton';
import { ROUTES } from '@/constants/app.constants';
import { useOrganization } from '@/features/superadmin/api';
import { OrgDetailView } from '@/features/superadmin/components';
import { SUPERADMIN_COPY } from '@/features/superadmin/superadmin.constants';

export default function SuperAdminOrganizationDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { data: org, isLoading, isError, error } = useOrganization(id || '');

  if (isLoading) {
    return <SuperAdminOrgDetailSkeleton />;
  }

  if (isError) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const isNotFound = status === 404 || status === 400;

    if (isNotFound) {
      return (
        <Card className="max-w-xl mx-auto my-12 text-center">
          <CardHeader>
            <CardTitle className="text-xl">
              {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.NOT_FOUND_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.NOT_FOUND_DESCRIPTION}
            </p>
            <Button variant="outline" asChild>
              <Link href={ROUTES.SUPERADMIN_ORGANIZATIONS}>
                <ArrowLeftIcon className="mr-1 size-4" />
                {SUPERADMIN_COPY.ORGANIZATIONS.DETAIL.BACK_LINK}
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
        {error?.message || 'An error occurred while loading organization details.'}
      </div>
    );
  }

  if (!org) {
    return null;
  }

  return <OrgDetailView org={org} />;
}
