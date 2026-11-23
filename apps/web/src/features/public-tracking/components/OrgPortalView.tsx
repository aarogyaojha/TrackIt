'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  SearchIcon,
  SparklesIcon,
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
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/app.constants';
import { publicApi } from '@/lib/api/public-client';
import { PublicTicketData } from '../api/usePublicTicket';
import {
  ORG_PORTAL_COPY,
  PUBLIC_TRACKING_COPY,
} from '../public-tracking.constants';
import { TicketStatusStepper } from './TicketStatusStepper';

export interface OrgPortalViewProps {
  orgName: string;
  orgSlug: string;
}

export function OrgPortalView({ orgName, orgSlug }: OrgPortalViewProps) {
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [tickets, setTickets] = React.useState<PublicTicketData[] | null>(null);
  const [selectedTicket, setSelectedTicket] = React.useState<PublicTicketData | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setNotFound(false);
    setSelectedTicket(null);
    setTickets(null);

    try {
      const res = await publicApi.get<{
        success: boolean;
        data: PublicTicketData[];
      }>(`/public/${encodeURIComponent(orgSlug)}/lookup`, {
        params: { query: trimmed },
      });

      const items = res.data.data;
      if (items && items.length > 0) {
        setTickets(items);
        if (items.length === 1) {
          setSelectedTicket(items[0]);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyDirectLink = async (code: string) => {
    const url = `${window.location.origin}/${orgSlug}/t/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success(ORG_PORTAL_COPY.LINK_COPIED);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Organization Header */}
      <Card className="shadow-sm border-primary/20 bg-card">
        <CardHeader className="text-center pb-5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {ORG_PORTAL_COPY.BADGE}
          </span>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {orgName}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
            {ORG_PORTAL_COPY.SUBHEADING}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Ticket Lookup Card */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {ORG_PORTAL_COPY.SEARCH_CARD_TITLE}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            {ORG_PORTAL_COPY.SEARCH_CARD_DESC}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="search-input" className="text-sm font-medium">
                {ORG_PORTAL_COPY.INPUT_LABEL}
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={ORG_PORTAL_COPY.INPUT_PLACEHOLDER}
                    className="pl-9 h-11 text-base sm:text-sm font-medium"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSearching || !query.trim()}
                  className="gap-2 h-11 font-semibold"
                >
                  {isSearching ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      {ORG_PORTAL_COPY.SEARCHING_BUTTON}
                    </>
                  ) : (
                    <>
                      <SearchIcon className="h-4 w-4" />
                      {ORG_PORTAL_COPY.SEARCH_BUTTON}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {ORG_PORTAL_COPY.HINT}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Not Found Alert */}
      {notFound && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 text-center space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              {ORG_PORTAL_COPY.NOT_FOUND_TITLE}
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {ORG_PORTAL_COPY.NOT_FOUND_DESC}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Multiple Results List */}
      {tickets && tickets.length > 1 && !selectedTicket && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {ORG_PORTAL_COPY.MULTIPLE_RESULTS_TITLE}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {ORG_PORTAL_COPY.MULTIPLE_RESULTS_DESC}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.code}
                onClick={() => setSelectedTicket(t)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 hover:border-primary/40 bg-card cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {t.code}
                    </span>
                    {t.customerLabel && (
                      <Badge variant="outline" className="text-xs">
                        {t.customerLabel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {t.itemDescription}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                  {ORG_PORTAL_COPY.VIEW_STATUS_BUTTON}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Live Ticket Status View */}
      {selectedTicket && (
        <div className="space-y-6 pt-2">
          {tickets && tickets.length > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTicket(null)}
                className="text-xs text-muted-foreground"
              >
                ← Back to all matching tickets
              </Button>
            </div>
          )}

          {/* Stepper Card */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <span className="text-xs text-muted-foreground font-mono">
                  {PUBLIC_TRACKING_COPY.TICKET_CODE_LABEL}: {selectedTicket.code}
                </span>
                <CardTitle className="text-lg font-bold text-foreground mt-0.5">
                  {selectedTicket.customerLabel || selectedTicket.status}
                </CardTitle>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                {PUBLIC_TRACKING_COPY.LIVE_UPDATE_BADGE}
              </div>
            </CardHeader>
            <CardContent>
              <TicketStatusStepper
                status={selectedTicket.status}
                category={selectedTicket.category || selectedTicket.statusCategory}
                customerLabel={selectedTicket.customerLabel}
                stages={selectedTicket.stages}
                workflow={selectedTicket.workflow}
              />
            </CardContent>
          </Card>

          {/* Ticket Details & History */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                {PUBLIC_TRACKING_COPY.DETAILS_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {PUBLIC_TRACKING_COPY.CUSTOMER_LABEL}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTicket.customerName}
                  </p>
                </div>

                {selectedTicket.createdAt && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {PUBLIC_TRACKING_COPY.CREATED_LABEL}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedTicket.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                )}

                <div className="sm:col-span-2 space-y-1 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground">
                    {PUBLIC_TRACKING_COPY.ITEM_LABEL}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.itemDescription}
                  </p>
                </div>
              </div>

              {/* Status History Timeline */}
              {selectedTicket.statusHistory && selectedTicket.statusHistory.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-foreground">
                    {PUBLIC_TRACKING_COPY.STATUS_TIMELINE_TITLE}
                  </p>
                  <div className="space-y-2">
                    {selectedTicket.statusHistory.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-muted/30"
                      >
                        <span className="font-medium text-foreground">
                          {h.customerLabel || h.status}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {new Date(h.changedAt).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Link Share */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyDirectLink(selectedTicket.code)}
                  className="gap-1.5 w-full sm:w-auto text-xs"
                >
                  {copiedLink ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5" />
                      <span>{ORG_PORTAL_COPY.COPY_LINK_BUTTON}</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-1.5 w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  <Link href={`/${orgSlug}/t/${selectedTicket.code}`}>
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    <span>{ORG_PORTAL_COPY.VIEW_DIRECT_PAGE}</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer Attribution */}
      <div className="text-center pt-2 pb-6">
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

