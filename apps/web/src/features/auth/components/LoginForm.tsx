'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@trackit/types';
import { ErrorCode } from '@/constants/error-codes';
import { ErrorMessages } from '@/constants/error-messages';
import { ROUTES } from '@/constants/app.constants';
import { LOGIN_COPY } from '../auth.constants';
import { useLogin } from '../api/useLogin';
import { loginSchema, LoginFormData } from '../schemas/login.schema';
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

export function LoginForm() {
  const router = useRouter();
  const { mutate: login, isPending, error } = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: (res) => {
        if (res.user?.role === Role.SUPERADMIN) {
          router.push(ROUTES.SUPERADMIN);
        } else {
          router.push(ROUTES.DASHBOARD);
        }
      },
    });
  };

  const errorCode = error?.response?.data?.error?.code;
  const isOrgNotApproved = errorCode === ErrorCode.ORG_NOT_APPROVED;
  const genericErrorMessage =
    error?.response?.data?.error?.message ||
    (error ? LOGIN_COPY.GENERIC_ERROR : null);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{LOGIN_COPY.TITLE}</CardTitle>
        <CardDescription>{LOGIN_COPY.DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOrgNotApproved && (
          <Alert variant="destructive">
            <AlertTitle>{LOGIN_COPY.PENDING_APPROVAL_TITLE}</AlertTitle>
            <AlertDescription>
              {ErrorMessages[ErrorCode.ORG_NOT_APPROVED]}
            </AlertDescription>
          </Alert>
        )}

        {error && !isOrgNotApproved && (
          <Alert variant="destructive">
            <AlertTitle>{LOGIN_COPY.LOGIN_FAILED_TITLE}</AlertTitle>
            <AlertDescription>{genericErrorMessage}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{LOGIN_COPY.EMAIL_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={LOGIN_COPY.EMAIL_PLACEHOLDER}
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{LOGIN_COPY.PASSWORD_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={LOGIN_COPY.PASSWORD_PLACEHOLDER}
                      autoComplete="current-password"
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
                ? LOGIN_COPY.SUBMIT_BUTTON_PENDING
                : LOGIN_COPY.SUBMIT_BUTTON}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <span>{LOGIN_COPY.FOOTER_PROMPT}</span>
        <Link
          href={ROUTES.REGISTER}
          className="ml-1 text-primary underline-offset-4 hover:underline font-medium"
        >
          {LOGIN_COPY.FOOTER_LINK}
        </Link>
      </CardFooter>
    </Card>
  );
}
