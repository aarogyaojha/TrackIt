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
    <div className="rounded-md border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{ROLES_COPY.TABLE.NAME}</TableHead>
            <TableHead>{ROLES_COPY.TABLE.KEY}</TableHead>
            <TableHead className="hidden md:table-cell">
              {ROLES_COPY.TABLE.DESCRIPTION}
            </TableHead>
            <TableHead>{ROLES_COPY.TABLE.PERMISSIONS}</TableHead>
            <TableHead>{ROLES_COPY.TABLE.TYPE}</TableHead>
            <TableHead className="text-right">
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
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{role.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                    {role.key}
                  </code>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                  {role.description || '—'}
                </TableCell>
                <TableCell>
                  {hasWildcard ? (
                    <Badge variant="default" className="text-xs">
                      {ROLES_COPY.ALL_PERMISSIONS_BADGE}
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {role.permissions.length} permission(s)
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {role.isSystem ? (
                    <Badge variant="outline" className="text-xs">
                      {ROLES_COPY.SYSTEM_BADGE}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs">
                      {ROLES_COPY.CUSTOM_BADGE}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(role)}
                      title={ROLES_COPY.EDIT_ROLE_BUTTON}
                    >
                      <Edit2Icon className="h-4 w-4" />
                      <span className="sr-only">
                        {ROLES_COPY.EDIT_ROLE_BUTTON}
                      </span>
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(role)}
                        className="text-destructive hover:text-destructive"
                        title={ROLES_COPY.DELETE_ROLE_BUTTON}
                      >
                        <Trash2Icon className="h-4 w-4" />
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
