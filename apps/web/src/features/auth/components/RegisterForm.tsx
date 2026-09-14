'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/constants/app.constants';
import { REGISTER_COPY } from '../auth.constants';
import { useRegisterOrganization } from '../api/useRegisterOrganization';
import { registerSchema, RegisterFormData } from '../schemas/register.schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function RegisterForm() {
  const router = useRouter();
  const {
    mutate: registerOrg,
    isPending,
    error,
  } = useRegisterOrganization();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      orgName: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerOrg(
      {
        orgName: data.orgName,
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      },
      {
        onSuccess: () => {
          router.push(
            `${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.adminEmail)}`,
          );
        },
      },
    );
  };

  const errorMessage =
    error?.response?.data?.error?.message ||
    (error ? REGISTER_COPY.GENERIC_ERROR : null);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{REGISTER_COPY.TITLE}</CardTitle>
        <CardDescription>{REGISTER_COPY.DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{REGISTER_COPY.REGISTRATION_FAILED_TITLE}</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orgName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{REGISTER_COPY.ORG_NAME_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={REGISTER_COPY.ORG_NAME_PLACEHOLDER}
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
              name="adminName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{REGISTER_COPY.ADMIN_NAME_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={REGISTER_COPY.ADMIN_NAME_PLACEHOLDER}
                      autoComplete="name"
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
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{REGISTER_COPY.ADMIN_EMAIL_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={REGISTER_COPY.ADMIN_EMAIL_PLACEHOLDER}
                      autoComplete="email"
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
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{REGISTER_COPY.ADMIN_PASSWORD_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={REGISTER_COPY.ADMIN_PASSWORD_PLACEHOLDER}
                      autoComplete="new-password"
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{REGISTER_COPY.CONFIRM_PASSWORD_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={REGISTER_COPY.CONFIRM_PASSWORD_PLACEHOLDER}
                      autoComplete="new-password"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? REGISTER_COPY.SUBMIT_BUTTON_PENDING
                : REGISTER_COPY.SUBMIT_BUTTON}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <span>{REGISTER_COPY.FOOTER_PROMPT}</span>
        <Link
          href={ROUTES.LOGIN}
          className="ml-1 text-primary underline-offset-4 hover:underline font-medium"
        >
          {REGISTER_COPY.FOOTER_LINK}
        </Link>
      </CardFooter>
    </Card>
  );
}
