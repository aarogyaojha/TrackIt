import { OrgStatus } from '@trackit/types';
import { OrganizationDocument } from './organization.schema';

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export function toOrganizationResponse(
  org: OrganizationDocument,
): OrganizationResponse {
  return {
    id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    status: org.status,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
}
