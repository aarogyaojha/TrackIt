import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/app.constants';

export default function SuperAdminIndexPage() {
  redirect(ROUTES.SUPERADMIN_ORGANIZATIONS);
}
