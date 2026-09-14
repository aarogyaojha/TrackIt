'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ErrorCode } from '@/constants/error-codes';
import { ErrorMessages } from '@/constants/error-messages';
import { useCreateTicket } from '../api/useCreateTicket';
import {
  CreateTicketFormData,
  createTicketSchema,
} from '../schemas/create-ticket.schema';
import { CREATE_TICKET_COPY } from '../tickets.constants';

export interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
}: CreateTicketDialogProps) {
  const { mutate: createTicket, isPending } = useCreateTicket();

  const form = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      customerName: '',
      customerPhone: '',
      itemDescription: '',
    },
  });

  // Reset form when dialog closes or opens
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (data: CreateTicketFormData) => {
    createTicket(data, {
      onSuccess: (newTicket) => {
        toast.success(CREATE_TICKET_COPY.SUCCESS_TITLE, {
          description: `Ticket ${newTicket.code} created successfully.`,
        });
        onOpenChange(false);
        form.reset();
      },
      onError: (error) => {
        const errorCode = error.response?.data?.error?.code;

        if (errorCode === ErrorCode.TICKET_CODE_TAKEN) {
          toast.error(CREATE_TICKET_COPY.ERROR_TITLE, {
            description: ErrorMessages[ErrorCode.TICKET_CODE_TAKEN],
          });
        } else if (errorCode === ErrorCode.PLAN_LIMIT_EXCEEDED) {
          toast.error(CREATE_TICKET_COPY.ERROR_TITLE, {
            description: ErrorMessages[ErrorCode.PLAN_LIMIT_EXCEEDED],
          });
        } else {
          toast.error(CREATE_TICKET_COPY.ERROR_TITLE, {
            description:
              error.response?.data?.error?.message ||
              'Failed to create ticket. Please check your inputs and try again.',
          });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{CREATE_TICKET_COPY.DIALOG_TITLE}</DialogTitle>
          <DialogDescription>
            {CREATE_TICKET_COPY.DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CREATE_TICKET_COPY.CODE_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={CREATE_TICKET_COPY.CODE_PLACEHOLDER}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CREATE_TICKET_COPY.CUSTOMER_NAME_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={CREATE_TICKET_COPY.CUSTOMER_NAME_PLACEHOLDER}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CREATE_TICKET_COPY.CUSTOMER_PHONE_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        CREATE_TICKET_COPY.CUSTOMER_PHONE_PLACEHOLDER
                      }
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{CREATE_TICKET_COPY.ITEM_DESCRIPTION_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        CREATE_TICKET_COPY.ITEM_DESCRIPTION_PLACEHOLDER
                      }
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {CREATE_TICKET_COPY.CANCEL_BUTTON}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? CREATE_TICKET_COPY.SUBMIT_BUTTON_PENDING
                  : CREATE_TICKET_COPY.SUBMIT_BUTTON}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
