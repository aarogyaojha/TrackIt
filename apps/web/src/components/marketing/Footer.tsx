import * as React from 'react';
import { APP_NAME } from '@/constants/app.constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t py-6 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        © {currentYear} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
