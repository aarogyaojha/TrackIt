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
import { Permission, RoleResponse } from '@trackit/types';
import { Edit2Icon, Trash2Icon } from 'lucide-react';
import { ROLES_COPY } from '../roles.constants';

interface RolesTableProps {
  roles: RoleResponse[];
  onEdit: (role: RoleResponse) => void;
  onDelete: (role: RoleResponse) => void;
}

export function RolesTable({ roles, onEdit, onDelete }: RolesTableProps) {
  if (roles.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {ROLES_COPY.TABLE.EMPTY}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="h-12 border-b bg-muted/20">
            <TableHead className="font-semibold text-sm">{ROLES_COPY.TABLE.NAME}</TableHead>
            <TableHead className="font-semibold text-sm">{ROLES_COPY.TABLE.KEY}</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-sm">
              {ROLES_COPY.TABLE.DESCRIPTION}
            </TableHead>
            <TableHead className="font-semibold text-sm">{ROLES_COPY.TABLE.PERMISSIONS}</TableHead>
            <TableHead className="font-semibold text-sm">{ROLES_COPY.TABLE.TYPE}</TableHead>
            <TableHead className="text-right font-semibold text-sm">
              {ROLES_COPY.TABLE.ACTIONS}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const hasWildcard = role.permissions.includes(
              Permission.PLATFORM_ALL,
            );
            return (
              <TableRow key={role.id} className="h-16 hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{role.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <code className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                    {role.key}
                  </code>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate py-4">
                  {role.description || '—'}
                </TableCell>
                <TableCell className="py-4">
                  {hasWildcard ? (
                    <Badge variant="default" className="text-xs px-2.5 py-0.5 font-medium">
                      {ROLES_COPY.ALL_PERMISSIONS_BADGE}
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-medium">
                        {role.permissions.length} permission(s)
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  {role.isSystem ? (
                    <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-medium">
                      {ROLES_COPY.SYSTEM_BADGE}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs px-2.5 py-0.5 font-medium">
                      {ROLES_COPY.CUSTOM_BADGE}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(role)}
                      title={ROLES_COPY.EDIT_ROLE_BUTTON}
                    >
                      <Edit2Icon className="size-4" />
                      <span className="sr-only">
                        {ROLES_COPY.EDIT_ROLE_BUTTON}
                      </span>
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(role)}
                        title={ROLES_COPY.DELETE_ROLE_BUTTON}
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">
                          {ROLES_COPY.DELETE_ROLE_BUTTON}
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
