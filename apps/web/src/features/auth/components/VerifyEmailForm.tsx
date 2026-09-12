'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/constants/app.constants';
import { VERIFY_EMAIL_COPY } from '../auth.constants';
import { useVerifyEmail } from '../api/useVerifyEmail';
import { useResendVerificationOtp } from '../api/useResendVerificationOtp';
import {
  verifyEmailSchema,
  VerifyEmailFormData,
} from '../schemas/verify-email.schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [resendFeedback, setResendFeedback] = React.useState<string | null>(
    null,
  );

  const {
    mutate: verifyEmail,
    isPending: isVerifying,
    isSuccess: isVerified,
    error: verifyError,
  } = useVerifyEmail();

  const {
    mutate: resendOtp,
    isPending: isResending,
    error: resendError,
  } = useResendVerificationOtp();

  const form = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      otp: '',
    },
  });

  // Keep form email in sync if query param changes
  React.useEffect(() => {
    if (initialEmail && !form.getValues('email')) {
      form.setValue('email', initialEmail);
    }
  }, [initialEmail, form]);

  const onSubmit = (data: VerifyEmailFormData) => {
    setResendFeedback(null);
    verifyEmail(data);
  };

  const handleResend = () => {
    const currentEmail = form.getValues('email');
    if (!currentEmail) {
      form.trigger('email');
      return;
    }

    setResendFeedback(null);
    resendOtp(
      { email: currentEmail },
      {
        onSuccess: () => {
          setResendFeedback(VERIFY_EMAIL_COPY.RESEND_SUCCESS_MESSAGE);
        },
      },
    );
  };

  if (isVerified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{VERIFY_EMAIL_COPY.SUCCESS_TITLE}</CardTitle>
          <CardDescription>
            {VERIFY_EMAIL_COPY.SUCCESS_DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href={ROUTES.LOGIN}
            className={cn(buttonVariants({ variant: 'default' }), 'w-full')}
          >
            {VERIFY_EMAIL_COPY.PROCEED_TO_LOGIN_BUTTON}
          </Link>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <Link
            href={ROUTES.LOGIN}
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            {VERIFY_EMAIL_COPY.BACK_TO_LOGIN_LINK}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const verifyErrorMessage =
    verifyError?.response?.data?.error?.message ||
    (verifyError ? VERIFY_EMAIL_COPY.GENERIC_ERROR : null);

  const resendErrorMessage =
    resendError?.response?.data?.error?.message ||
    (resendError ? VERIFY_EMAIL_COPY.GENERIC_ERROR : null);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{VERIFY_EMAIL_COPY.TITLE}</CardTitle>
        <CardDescription>{VERIFY_EMAIL_COPY.DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verifyErrorMessage && (
          <Alert variant="destructive">
            <AlertTitle>
              {VERIFY_EMAIL_COPY.VERIFICATION_FAILED_TITLE}
            </AlertTitle>
            <AlertDescription>{verifyErrorMessage}</AlertDescription>
          </Alert>
        )}

        {resendErrorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{resendErrorMessage}</AlertDescription>
          </Alert>
        )}

        {resendFeedback && (
          <Alert>
            <AlertDescription>{resendFeedback}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{VERIFY_EMAIL_COPY.EMAIL_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={VERIFY_EMAIL_COPY.EMAIL_PLACEHOLDER}
                      autoComplete="email"
                      disabled={isVerifying || isResending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{VERIFY_EMAIL_COPY.OTP_LABEL}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder={VERIFY_EMAIL_COPY.OTP_PLACEHOLDER}
                      autoComplete="one-time-code"
                      disabled={isVerifying || isResending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || isResending}
            >
              {isVerifying
                ? VERIFY_EMAIL_COPY.SUBMIT_BUTTON_PENDING
                : VERIFY_EMAIL_COPY.SUBMIT_BUTTON}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground items-center">
        <div className="flex items-center gap-1">
          <span>{VERIFY_EMAIL_COPY.FOOTER_PROMPT}</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isVerifying}
            className="text-primary underline-offset-4 hover:underline font-medium disabled:opacity-50"
          >
            {isResending
              ? VERIFY_EMAIL_COPY.RESEND_BUTTON_PENDING
              : VERIFY_EMAIL_COPY.RESEND_BUTTON}
          </button>
        </div>
        <Link
          href={ROUTES.LOGIN}
          className="text-primary underline-offset-4 hover:underline font-medium text-xs mt-1"
        >
          {VERIFY_EMAIL_COPY.BACK_TO_LOGIN_LINK}
        </Link>
      </CardFooter>
    </Card>
  );
}
