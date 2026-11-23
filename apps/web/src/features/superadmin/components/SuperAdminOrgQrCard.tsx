'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PrinterIcon,
  QrCodeIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PrintCounterSignDialog } from '@/features/dashboard/components/PrintCounterSignDialog';
import { useOrgCheckInQr } from '../api';
import { SUPERADMIN_COPY } from '../superadmin.constants';

export interface SuperAdminOrgQrCardProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
}

export function SuperAdminOrgQrCard({
  orgId,
  orgName,
  orgSlug,
}: SuperAdminOrgQrCardProps) {
  const { data: qrData, isLoading, isError, refetch } = useOrgCheckInQr(orgId);
  const [copied, setCopied] = React.useState(false);
  const [printDialogOpened, setPrintDialogOpened] = React.useState(false);

  const handleCopy = async () => {
    if (!qrData?.checkInUrl) return;
    try {
      await navigator.clipboard.writeText(qrData.checkInUrl);
      setCopied(true);
      toast.success(SUPERADMIN_COPY.ORGANIZATIONS.QR.COPY_SUCCESS);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const handleDownload = () => {
    if (!qrData?.qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrData.qrCodeDataUrl;
    link.download = `${orgSlug}-tracking-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(SUPERADMIN_COPY.ORGANIZATIONS.QR.DOWNLOAD_SUCCESS);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-96 mt-1" />
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-6">
          <Skeleton className="size-44 rounded-xl" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <QrCodeIcon className="size-4" />
            {SUPERADMIN_COPY.ORGANIZATIONS.QR.ERROR_TITLE}
          </CardTitle>
          <CardDescription>
            {SUPERADMIN_COPY.ORGANIZATIONS.QR.ERROR_DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {SUPERADMIN_COPY.ORGANIZATIONS.QR.RETRY_BUTTON}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <QrCodeIcon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {SUPERADMIN_COPY.ORGANIZATIONS.QR.SECTION_TITLE}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-0.5">
                {SUPERADMIN_COPY.ORGANIZATIONS.QR.SECTION_DESCRIPTION}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-xl shadow-xs border border-border/50 shrink-0">
              <Image
                src={qrData.qrCodeDataUrl}
                alt={`${orgName} Tracking QR Code`}
                width={160}
                height={160}
                className="rounded-md"
                unoptimized
              />
            </div>

            {/* Actions & Link Controls */}
            <div className="space-y-4 flex-1 w-full text-left">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {SUPERADMIN_COPY.ORGANIZATIONS.QR.PORTAL_URL_LABEL}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={qrData.checkInUrl}
                    className="font-mono text-xs h-9 bg-muted/30"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0 gap-1.5 h-9"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="size-3.5 text-emerald-500" />
                        <span>{SUPERADMIN_COPY.ORGANIZATIONS.QR.COPIED_URL}</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-3.5" />
                        <span>{SUPERADMIN_COPY.ORGANIZATIONS.QR.COPY_URL_BUTTON}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  onClick={handleDownload}
                  className="gap-2 shrink-0"
                >
                  <DownloadIcon className="size-4" />
                  {SUPERADMIN_COPY.ORGANIZATIONS.QR.DOWNLOAD_BUTTON}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setPrintDialogOpened(true)}
                  className="gap-2 shrink-0"
                >
                  <PrinterIcon className="size-4" />
                  {SUPERADMIN_COPY.ORGANIZATIONS.QR.PRINT_BUTTON}
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="gap-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <a
                    href={qrData.checkInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon className="size-4" />
                    {SUPERADMIN_COPY.ORGANIZATIONS.QR.OPEN_PORTAL_BUTTON}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PrintCounterSignDialog
        open={printDialogOpened}
        onOpenChange={setPrintDialogOpened}
        orgName={qrData.organizationName}
        checkInUrl={qrData.checkInUrl}
        qrCodeDataUrl={qrData.qrCodeDataUrl}
      />
    </>
  );
}
