import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, QueryFilter } from 'mongoose';
import { OrgStatus, Role } from '@trackit/types';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { UsersService } from '../users/user.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { MAX_SLUG_RETRIES } from './organization.constants';
import { OrganizationsRepository } from './organization.repository';
import { OrganizationDocument } from './organization.schema';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersService: UsersService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly subscriptionsService: SubscriptionsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private slugify(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'org'
    );
  }

  async registerOrganization(
    dto: RegisterOrganizationDto,
  ): Promise<{ organization: OrganizationDocument; user: unknown }> {
    const baseSlug = this.slugify(dto.orgName);
    const settings = await this.platformSettingsService.getSettings();
    const initialStatus = settings.requireOrgApproval
      ? OrgStatus.PENDING
      : OrgStatus.ACTIVE;

    for (let slugAttempt = 0; slugAttempt <= MAX_SLUG_RETRIES; slugAttempt++) {
      const slug =
        slugAttempt === 0 ? baseSlug : `${baseSlug}-${slugAttempt}`;

      for (let txAttempt = 0; txAttempt < 3; txAttempt++) {
        const session = await this.connection.startSession();

        try {
          session.startTransaction();

          const org = await this.organizationsRepository.create(
            {
              name: dto.orgName.trim(),
              slug,
              status: initialStatus,
            },
            { session },
          );

          const user = await this.usersService.createUser(
            {
              email: dto.adminEmail,
              name: dto.adminName,
              password: dto.adminPassword,
              role: Role.ORG_ADMIN,
              organizationId: org._id,
            },
            session,
          );

          await this.subscriptionsService.createDefaultSubscription(
            org._id,
            session,
          );

          await session.commitTransaction();
          return { organization: org, user };

        } catch (err: unknown) {
          await session.abortTransaction();

          const mongoError = err as {
            code?: number;
            name?: string;
            message?: string;
            keyPattern?: Record<string, unknown>;
            keyValue?: Record<string, unknown>;
            errorLabels?: string[];
          };

          const isDuplicateKey =
            mongoError.code === 11000 ||
            mongoError.name === 'MongoServerError' ||
            (typeof mongoError.message === 'string' &&
              mongoError.message.includes('E11000'));

          const isSlugDuplicate =
            isDuplicateKey &&
            (mongoError.keyPattern?.slug !== undefined ||
              mongoError.keyValue?.slug !== undefined ||
              (typeof mongoError.message === 'string' &&
                mongoError.message.includes('slug')));

          const isEmailDuplicate =
            isDuplicateKey &&
            (mongoError.keyPattern?.email !== undefined ||
              mongoError.keyValue?.email !== undefined ||
              (typeof mongoError.message === 'string' &&
                mongoError.message.includes('email')));

          if (isEmailDuplicate) {
            throw new AppException(
              HttpStatus.CONFLICT,
              ErrorCode.EMAIL_ALREADY_EXISTS,
              ErrorMessages[ErrorCode.EMAIL_ALREADY_EXISTS],
            );
          }

          if (isSlugDuplicate) {
            break;
          }

          const isTransient =
            (typeof mongoError.message === 'string' &&
              (mongoError.message.includes('catalog changes') ||
                mongoError.message.includes('TransientTransactionError') ||
                mongoError.message.includes('WriteConflict') ||
                mongoError.message.includes('retry your operation'))) ||
            (Array.isArray(mongoError.errorLabels) &&
              mongoError.errorLabels.includes('TransientTransactionError'));

          if (isTransient && txAttempt < 2) {
            continue;
          }

          if (err instanceof AppException) {
            throw err;
          }

          const errorMessage =
            err instanceof Error
              ? err.message
              : ErrorMessages[ErrorCode.INTERNAL_ERROR];

          throw new AppException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCode.INTERNAL_ERROR,
            errorMessage,
          );
        } finally {
          await session.endSession();
        }
      }
    }

    throw new AppException(
      HttpStatus.CONFLICT,
      ErrorCode.ORG_SLUG_TAKEN,
      ErrorMessages[ErrorCode.ORG_SLUG_TAKEN],
    );
  }

  async getBySlug(slug: string): Promise<OrganizationDocument | null> {
    return this.organizationsRepository.findBySlug(slug);
  }

  async getById(id: string): Promise<OrganizationDocument | null> {
    return this.organizationsRepository.findById(id);
  }

  async getByIdForSuperadmin(id: string): Promise<OrganizationDocument> {
    const org = await this.organizationsRepository.findById(id);
    if (!org) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }
    return org;
  }

  async listOrganizations(
    paginationDto: PaginationQueryDto,
    statusFilter?: OrgStatus,
  ): Promise<{ items: OrganizationDocument[]; total: number }> {
    const filter: QueryFilter<OrganizationDocument> = {};
    if (statusFilter) {
      filter.status = statusFilter;
    }

    return this.organizationsRepository.findPaginated(
      filter,
      { page: paginationDto.page, limit: paginationDto.limit },
      { createdAt: -1 },
    );
  }

  async approve(id: string): Promise<OrganizationDocument> {
    const org = await this.getByIdForSuperadmin(id);
    if (org.status !== OrgStatus.PENDING) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.INVALID_STATUS_TRANSITION,
        ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
      );
    }

    const updated = await this.organizationsRepository.updateById(id, {
      $set: { status: OrgStatus.ACTIVE },
    });
    return updated!;
  }

  async reject(id: string): Promise<OrganizationDocument> {
    const org = await this.getByIdForSuperadmin(id);
    if (org.status !== OrgStatus.PENDING) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.INVALID_STATUS_TRANSITION,
        ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
      );
    }

    const updated = await this.organizationsRepository.updateById(id, {
      $set: { status: OrgStatus.REJECTED },
    });
    return updated!;
  }

  async suspend(id: string): Promise<OrganizationDocument> {
    const org = await this.getByIdForSuperadmin(id);
    if (org.status !== OrgStatus.ACTIVE) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.INVALID_STATUS_TRANSITION,
        ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
      );
    }

    const updated = await this.organizationsRepository.updateById(id, {
      $set: { status: OrgStatus.SUSPENDED },
    });
    return updated!;
  }

  async reactivate(id: string): Promise<OrganizationDocument> {
    const org = await this.getByIdForSuperadmin(id);
    if (org.status !== OrgStatus.SUSPENDED) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.INVALID_STATUS_TRANSITION,
        ErrorMessages[ErrorCode.INVALID_STATUS_TRANSITION],
      );
    }

    const updated = await this.organizationsRepository.updateById(id, {
      $set: { status: OrgStatus.ACTIVE },
    });
    return updated!;
  }
}
