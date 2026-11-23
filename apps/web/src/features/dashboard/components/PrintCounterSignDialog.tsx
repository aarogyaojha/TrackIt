'use client';

import * as React from 'react';
import Image from 'next/image';
import { PrinterIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { COUNTER_QR_COPY } from '../dashboard.constants';

export interface PrintCounterSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  checkInUrl: string;
  qrCodeDataUrl: string;
}

export function PrintCounterSignDialog({
  open,
  onOpenChange,
  orgName,
  checkInUrl,
  qrCodeDataUrl,
}: PrintCounterSignDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-xl p-6">
        <DialogHeader>
          <DialogTitle>{COUNTER_QR_COPY.PRINT_DIALOG_TITLE}</DialogTitle>
          <DialogDescription>
            {COUNTER_QR_COPY.PRINT_DIALOG_DESC}
          </DialogDescription>
        </DialogHeader>

        {/* Printable Counter Stand Poster */}
        <div
          id="counter-sign-printable"
          className="my-2 p-8 border-2 border-dashed rounded-2xl bg-card text-center flex flex-col items-center space-y-5 shadow-xs print:border-none print:shadow-none print:p-8"
        >
          {/* Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
              <SparklesIcon className="size-3.5" />
              <span>{COUNTER_QR_COPY.SIGN_BADGE}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground print:text-black">
              {orgName}
            </h2>
            <p className="text-sm font-medium text-muted-foreground print:text-gray-600 max-w-sm mx-auto">
              {COUNTER_QR_COPY.INSTRUCTIONS}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-border/40 inline-flex flex-col items-center">
            <Image
              src={qrCodeDataUrl}
              alt={`${orgName} Tracking QR Code`}
              width={220}
              height={220}
              className="rounded-lg"
              priority
              unoptimized
            />
          </div>

          {/* Subtext and Direct URL */}
          <div className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground print:text-gray-600">
              {COUNTER_QR_COPY.SUB_INSTRUCTIONS}
            </p>
            <p className="text-xs font-mono font-medium text-foreground print:text-black break-all">
              {checkInUrl}
            </p>
          </div>

          {/* Brand Attribution */}
          <div className="pt-2 border-t border-border/30 w-full">
            <p className="text-[11px] text-muted-foreground print:text-gray-500">
              {COUNTER_QR_COPY.FOOTER_BRAND}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {COUNTER_QR_COPY.CLOSE_BUTTON}
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <PrinterIcon className="size-4" />
            {COUNTER_QR_COPY.PRINT_BUTTON}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
