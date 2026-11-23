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
import { Badge } from '@/components/ui/badge';
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
import { useCheckInQr } from '@/features/organization/api/useCheckInQr';
import { COUNTER_QR_COPY } from '../dashboard.constants';
import { PrintCounterSignDialog } from './PrintCounterSignDialog';

export function CounterQrCard() {
  const { data: qrData, isLoading, isError } = useCheckInQr();
  const [copied, setCopied] = React.useState(false);
  const [printDialogOpened, setPrintDialogOpened] = React.useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
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

  if (isError || !qrData) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData.checkInUrl);
      setCopied(true);
      toast.success(COUNTER_QR_COPY.COPY_LINK_SUCCESS);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const handleDownload = () => {
    if (!qrData) return;
    const link = document.createElement('a');
    link.href = qrData.qrCodeDataUrl;
    link.download = `${qrData.orgSlug}-tracking-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(COUNTER_QR_COPY.DOWNLOAD_SUCCESS);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <QrCodeIcon className="size-4" />
              </div>
              <CardTitle className="text-lg font-semibold">
                {COUNTER_QR_COPY.TITLE}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {COUNTER_QR_COPY.COUNTER_BADGE}
            </Badge>
          </div>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            {COUNTER_QR_COPY.DESCRIPTION}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-xl shadow-xs border border-border/50 shrink-0">
              <Image
                src={qrData.qrCodeDataUrl}
                alt={`${qrData.organizationName} Tracking QR Code`}
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
                  {COUNTER_QR_COPY.URL_LABEL}
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
                        <span>{COUNTER_QR_COPY.COPIED_BUTTON}</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-3.5" />
                        <span>{COUNTER_QR_COPY.COPY_LINK_BUTTON}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-2 shrink-0"
                >
                  <DownloadIcon className="size-4" />
                  {COUNTER_QR_COPY.DOWNLOAD_BUTTON}
                </Button>

                <Button
                  onClick={() => setPrintDialogOpened(true)}
                  className="gap-2 shrink-0"
                >
                  <PrinterIcon className="size-4" />
                  {COUNTER_QR_COPY.PRINT_POSTER_BUTTON}
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
                    {COUNTER_QR_COPY.OPEN_PORTAL_BUTTON}
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
