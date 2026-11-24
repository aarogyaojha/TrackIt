'use client';

import * as React from 'react';
import { StaffPerformanceStat } from '@trackit/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UsersIcon } from 'lucide-react';
import { DASHBOARD_TEAM_COPY } from '../dashboard.constants';
import { formatRoleName } from '@/lib/utils';

interface TeamPerformanceCardProps {
  staffPerformance?: StaffPerformanceStat[];
  isLoading?: boolean;
}

export function TeamPerformanceCard({
  staffPerformance = [],
  isLoading,
}: TeamPerformanceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {DASHBOARD_TEAM_COPY.TITLE}
          </CardTitle>
          <CardDescription>
            {DASHBOARD_TEAM_COPY.DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-8 bg-muted rounded-sm animate-pulse" />
          <div className="h-8 bg-muted rounded-sm animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-5 border-b">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            <CardTitle className="text-xl">
              {DASHBOARD_TEAM_COPY.TITLE}
            </CardTitle>
          </div>
          <CardDescription className="mt-1 text-sm">
            {DASHBOARD_TEAM_COPY.DESCRIPTION}
          </CardDescription>
        </div>
        <Badge variant="secondary" className="text-xs px-2.5 py-1">
          {staffPerformance.length} {DASHBOARD_TEAM_COPY.SUMMARY_LABEL}
        </Badge>
      </CardHeader>

      <CardContent className="p-6 pt-5">
        {staffPerformance.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {DASHBOARD_TEAM_COPY.EMPTY}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-12 border-b">
                  <TableHead className="font-semibold text-sm">{DASHBOARD_TEAM_COPY.MEMBER_HEADER}</TableHead>
                  <TableHead className="font-semibold text-sm">{DASHBOARD_TEAM_COPY.ROLE_HEADER}</TableHead>
                  <TableHead className="text-center font-semibold text-sm">
                    {DASHBOARD_TEAM_COPY.CREATED_HEADER}
                  </TableHead>
                  <TableHead className="text-center font-semibold text-sm">
                    {DASHBOARD_TEAM_COPY.COMPLETED_HEADER}
                  </TableHead>
                  <TableHead className="text-right font-semibold text-sm">
                    {DASHBOARD_TEAM_COPY.UPDATES_HEADER}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffPerformance.map((member) => (
                  <TableRow key={member.userId} className="h-16">
                    <TableCell className="py-4">
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {member.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="text-xs font-normal">
                        {formatRoleName(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm py-4">
                      {member.ticketsCreated}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge variant="success" className="text-xs font-semibold px-2 py-0.5">
                        {member.ticketsCompleted}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm font-semibold tabular-nums py-4">
                      {member.totalStatusUpdates}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

