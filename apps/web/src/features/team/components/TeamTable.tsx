'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Role, RoleResponse, UserResponse } from '@trackit/types';
import { Edit2Icon, Trash2Icon } from 'lucide-react';
import { TEAM_COPY } from '../team.constants';
import { formatRoleName } from '@/lib/utils';

interface TeamTableProps {
  members: UserResponse[];
  roles?: RoleResponse[];
  currentUserId?: string;
  onEdit: (member: UserResponse) => void;
  onDelete: (member: UserResponse) => void;
}

export function TeamTable({
  members,
  roles,
  currentUserId,
  onEdit,
  onDelete,
}: TeamTableProps) {
  if (members.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {TEAM_COPY.TABLE.EMPTY}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="h-12 border-b bg-muted/20">
            <TableHead className="font-semibold text-sm">{TEAM_COPY.TABLE.NAME}</TableHead>
            <TableHead className="font-semibold text-sm">{TEAM_COPY.TABLE.EMAIL}</TableHead>
            <TableHead className="font-semibold text-sm">{TEAM_COPY.TABLE.ROLE}</TableHead>
            <TableHead className="font-semibold text-sm">{TEAM_COPY.TABLE.STATUS}</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-sm">
              {TEAM_COPY.TABLE.JOINED}
            </TableHead>
            <TableHead className="text-right font-semibold text-sm">
              {TEAM_COPY.TABLE.ACTIONS}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isSelf = member.id === currentUserId;
            const isAdmin =
              member.role === Role.ORG_ADMIN || member.role === 'ORG_ADMIN';

            return (
              <TableRow key={member.id} className="h-16 hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{member.name}</span>
                    {isSelf && (
                      <Badge variant="outline" className="text-xs">
                        {TEAM_COPY.YOU_BADGE}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm py-4">
                  {member.email}
                </TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant={isAdmin ? 'default' : 'secondary'}
                    className="text-xs px-2.5 py-0.5 font-medium"
                  >
                    {formatRoleName(member.role, roles)}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  {member.isActive ? (
                    <Badge variant="success" className="text-xs px-2.5 py-0.5 font-medium">
                      {TEAM_COPY.STATUS_ACTIVE}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs px-2.5 py-0.5 font-medium">
                      {TEAM_COPY.STATUS_INACTIVE}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs py-4">
                  {member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(member)}
                      title={TEAM_COPY.EDIT_MEMBER_BUTTON}
                    >
                      <Edit2Icon className="size-4" />
                      <span className="sr-only">
                        {TEAM_COPY.EDIT_MEMBER_BUTTON}
                      </span>
                    </Button>
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(member)}
                        title={TEAM_COPY.DELETE_MEMBER_BUTTON}
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">
                          {TEAM_COPY.DELETE_MEMBER_BUTTON}
                        </span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

