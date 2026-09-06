import Link from 'next/link';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { buttonVariants } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/constants/app.constants';
import { LOGIN_COPY, REGISTER_COPY } from '@/features/auth/auth.constants';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={ROUTES.LOGIN}
              className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto px-8')}
            >
              {LOGIN_COPY.SUBMIT_BUTTON}
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-full sm:w-auto px-8',
              )}
            >
              {REGISTER_COPY.SUBMIT_BUTTON}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
