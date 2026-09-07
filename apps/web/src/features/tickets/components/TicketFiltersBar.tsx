'use client';

import * as React from 'react';
import { TicketStatus } from '@trackit/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TICKET_STATUS_LABELS,
  TICKETS_LIST_COPY,
} from '../tickets.constants';

export interface TicketFiltersBarProps {
  search: string;
  status?: TicketStatus;
  onSearchChange: (search: string) => void;
  onStatusChange: (status?: TicketStatus) => void;
}

const ALL_STATUS_VALUE = 'ALL';

export function TicketFiltersBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: TicketFiltersBarProps) {
  const [localSearch, setLocalSearch] = React.useState(search);
  const [prevSearch, setPrevSearch] = React.useState(search);

  // Synchronize local search state during render when prop changes
  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Debounce search input changes by ~350ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const handleStatusSelect = (val: string | null) => {
    if (!val || val === ALL_STATUS_VALUE) {
      onStatusChange(undefined);
    } else {
      onStatusChange(val as TicketStatus);
    }
  };

  const currentSelectValue = status || ALL_STATUS_VALUE;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <div className="flex-1">
        <Input
          type="search"
          placeholder={TICKETS_LIST_COPY.SEARCH_PLACEHOLDER}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="w-full sm:w-48">
        <Select
          value={currentSelectValue}
          onValueChange={handleStatusSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={TICKETS_LIST_COPY.STATUS_FILTER_ALL} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>
              {TICKETS_LIST_COPY.STATUS_FILTER_ALL}
            </SelectItem>
            {Object.values(TicketStatus).map((st) => (
              <SelectItem key={st} value={st}>
                {TICKET_STATUS_LABELS[st]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
