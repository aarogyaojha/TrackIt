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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PrintCounterSignDialog } from '@/features/dashboard/components/PrintCounterSignDialog';
import { useOrgCheckInQr } from '../api';
import { SUPERADMIN_COPY } from '../superadmin.constants';

export interface OrgQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
  orgSlug: string;
}

export function OrgQrDialog({
  open,
  onOpenChange,
  orgId,
  orgName,
  orgSlug,
}: OrgQrDialogProps) {
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <QrCodeIcon className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold">
                {orgName}
              </DialogTitle>
            </div>
            <DialogDescription>
              {SUPERADMIN_COPY.ORGANIZATIONS.QR.DIALOG_DESCRIPTION}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center py-6 space-y-4">
              <Skeleton className="size-48 rounded-xl" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : isError || !qrData ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-destructive">
                {SUPERADMIN_COPY.ORGANIZATIONS.QR.ERROR_DESCRIPTION}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {SUPERADMIN_COPY.ORGANIZATIONS.QR.RETRY_BUTTON}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 space-y-4">
              {/* QR Image */}
              <div className="p-3 bg-white rounded-xl shadow-xs border border-border/50">
                <Image
                  src={qrData.qrCodeDataUrl}
                  alt={`${orgName} Tracking QR`}
                  width={180}
                  height={180}
                  className="rounded-md"
                  unoptimized
                />
              </div>

              {/* URL with Copy */}
              <div className="w-full space-y-1.5">
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

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 w-full">
                <Button
                  onClick={handleDownload}
                  className="gap-1.5 flex-1 shrink-0"
                >
                  <DownloadIcon className="size-4" />
                  {SUPERADMIN_COPY.ORGANIZATIONS.QR.DOWNLOAD_BUTTON}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setPrintDialogOpened(true)}
                  className="gap-1.5 shrink-0"
                >
                  <PrinterIcon className="size-4" />
                  {SUPERADMIN_COPY.ORGANIZATIONS.QR.PRINT_BUTTON}
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="gap-1.5 shrink-0 text-muted-foreground hover:text-foreground"
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
          )}

          <DialogFooter className="pt-2 border-t border-border/40">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {SUPERADMIN_COPY.ORGANIZATIONS.QR.CLOSE_BUTTON}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {qrData && (
        <PrintCounterSignDialog
          open={printDialogOpened}
          onOpenChange={setPrintDialogOpened}
          orgName={qrData.organizationName}
          checkInUrl={qrData.checkInUrl}
          qrCodeDataUrl={qrData.qrCodeDataUrl}
        />
      )}
    </>
  );
}
