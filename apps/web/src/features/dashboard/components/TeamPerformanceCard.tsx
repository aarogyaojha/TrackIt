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
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            <CardTitle className="text-lg">
              {DASHBOARD_TEAM_COPY.TITLE}
            </CardTitle>
          </div>
          <CardDescription className="mt-1">
            {DASHBOARD_TEAM_COPY.DESCRIPTION}
          </CardDescription>
        </div>
        <Badge variant="secondary" className="text-xs">
          {staffPerformance.length} {DASHBOARD_TEAM_COPY.SUMMARY_LABEL}
        </Badge>
      </CardHeader>

      <CardContent className="pt-4">
        {staffPerformance.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {DASHBOARD_TEAM_COPY.EMPTY}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{DASHBOARD_TEAM_COPY.MEMBER_HEADER}</TableHead>
                  <TableHead>{DASHBOARD_TEAM_COPY.ROLE_HEADER}</TableHead>
                  <TableHead className="text-center">
                    {DASHBOARD_TEAM_COPY.CREATED_HEADER}
                  </TableHead>
                  <TableHead className="text-center">
                    {DASHBOARD_TEAM_COPY.COMPLETED_HEADER}
                  </TableHead>
                  <TableHead className="text-right">
                    {DASHBOARD_TEAM_COPY.UPDATES_HEADER}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffPerformance.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatRoleName(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {member.ticketsCreated}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="success" className="text-xs font-semibold">
                        {member.ticketsCompleted}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm font-medium">
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

