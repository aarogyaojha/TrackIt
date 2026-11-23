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
import { Role, UserResponse } from '@trackit/types';
import { Edit2Icon, Trash2Icon } from 'lucide-react';
import { TEAM_COPY } from '../team.constants';

interface TeamTableProps {
  members: UserResponse[];
  currentUserId?: string;
  onEdit: (member: UserResponse) => void;
  onDelete: (member: UserResponse) => void;
}

export function TeamTable({
  members,
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
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{TEAM_COPY.TABLE.NAME}</TableHead>
            <TableHead>{TEAM_COPY.TABLE.EMAIL}</TableHead>
            <TableHead>{TEAM_COPY.TABLE.ROLE}</TableHead>
            <TableHead>{TEAM_COPY.TABLE.STATUS}</TableHead>
            <TableHead className="hidden md:table-cell">
              {TEAM_COPY.TABLE.JOINED}
            </TableHead>
            <TableHead className="text-right">
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
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{member.name}</span>
                    {isSelf && (
                      <Badge variant="outline" className="text-xs">
                        {TEAM_COPY.YOU_BADGE}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {member.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isAdmin ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.isActive ? (
                    <Badge variant="success" className="text-xs">
                      {TEAM_COPY.STATUS_ACTIVE}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      {TEAM_COPY.STATUS_INACTIVE}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                  {member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(member)}
                      title={TEAM_COPY.EDIT_MEMBER_BUTTON}
                    >
                      <Edit2Icon className="h-4 w-4" />
                      <span className="sr-only">
                        {TEAM_COPY.EDIT_MEMBER_BUTTON}
                      </span>
                    </Button>
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(member)}
                        className="text-destructive hover:text-destructive"
                        title={TEAM_COPY.DELETE_MEMBER_BUTTON}
                      >
                        <Trash2Icon className="h-4 w-4" />
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
