import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as React from 'react';
import { ClientSession, Types } from 'mongoose';
import { Permission, Role } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
} from '../auth/auth.constants';
import { EmailService } from '../email/email.service';
import { OtpVerificationTemplate } from '../email/templates/otp-verification.template';
import { RolesService } from '../roles/role.service';
import { SubscriptionsService } from '../subscriptions/subscription.service';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateStaffUserDto } from './dto/update-staff-user.dto';
import { UsersRepository } from './user.repository';
import { User, UserDocument } from './user.schema';
import { SALT_ROUNDS } from './users.constants';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: Role | string;
  organizationId?: Types.ObjectId | string | null;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  async createUser(
    dto: CreateUserDto,
    session?: ClientSession,
  ): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const userDoc: Partial<User> = {
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name.trim(),
      role: dto.role,
      organizationId: dto.organizationId
        ? (new Types.ObjectId(dto.organizationId.toString()) as unknown as Types.ObjectId)
        : null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    };

    return this.usersRepository.create(userDoc, { session });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findById(id);
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findByIdWithRefreshToken(id);
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string,
  ): Promise<UserDocument | null> {
    return this.usersRepository.updateRefreshTokenHash(userId, refreshTokenHash);
  }

  async clearRefreshTokenHash(userId: string): Promise<UserDocument | null> {
    return this.usersRepository.updateRefreshTokenHash(userId, null);
  }

  async sendEmailVerificationOtp(
    userId: string | Types.ObjectId,
    email: string,
    name: string,
  ): Promise<void> {
    const otp = crypto
      .randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');

    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.usersRepository.setEmailOtp(userId.toString(), otpHash, expiresAt);

    await this.emailService.send(
      email,
      'Verify your email address',
      React.createElement(OtpVerificationTemplate, {
        name,
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
      }),
    );
  }

  async verifyEmailOtp(email: string, rawOtp: string): Promise<void> {
    const user = await this.usersRepository.findByEmailWithOtp(email);
    if (!user) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    if (user.emailVerified) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.EMAIL_ALREADY_VERIFIED,
        ErrorMessages[ErrorCode.EMAIL_ALREADY_VERIFIED],
      );
    }

    if (!user.emailOtpExpiresAt || user.emailOtpExpiresAt < new Date()) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_EXPIRED,
        ErrorMessages[ErrorCode.OTP_EXPIRED],
      );
    }

    if ((user.emailOtpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED,
        ErrorMessages[ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED],
      );
    }

    const computedHash = this.hashOtp(rawOtp);
    const storedHashBuffer = Buffer.from(user.emailOtpHash || '', 'hex');
    const computedHashBuffer = Buffer.from(computedHash, 'hex');

    const isMatch =
      storedHashBuffer.length === computedHashBuffer.length &&
      storedHashBuffer.length > 0 &&
      crypto.timingSafeEqual(storedHashBuffer, computedHashBuffer);

    if (!isMatch) {
      await this.usersRepository.incrementOtpAttempts(user._id.toString());
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.OTP_INVALID,
        ErrorMessages[ErrorCode.OTP_INVALID],
      );
    }

    await this.usersRepository.markEmailVerified(user._id.toString());
  }

  async resendEmailVerificationOtp(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        ErrorMessages[ErrorCode.NOT_FOUND],
      );
    }

    if (user.emailVerified) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.EMAIL_ALREADY_VERIFIED,
        ErrorMessages[ErrorCode.EMAIL_ALREADY_VERIFIED],
      );
    }

    await this.sendEmailVerificationOtp(
      user._id.toString(),
      user.email,
      user.name,
    );
  }

  async listStaffByOrganization(organizationId: string): Promise<UserDocument[]> {
    return this.usersRepository.findByOrganization(organizationId);
  }

  private async resolveAssignableRoleKey(rawRole: string): Promise<string> {
    const normalizedRole = rawRole.trim().toUpperCase();

    if (normalizedRole === Role.SUPERADMIN) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Cannot assign platform superadmin role to organization staff',
      );
    }

    if (
      normalizedRole === Role.ORG_ADMIN ||
      normalizedRole === Role.ORG_STAFF
    ) {
      return normalizedRole;
    }

    const roleDoc = await this.rolesService.getRoleByKey(normalizedRole);
    if (!roleDoc) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.ROLE_NOT_FOUND,
        ErrorMessages[ErrorCode.ROLE_NOT_FOUND],
      );
    }

    if (roleDoc.permissions?.includes(Permission.PLATFORM_ALL)) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Cannot assign platform-level role to organization staff',
      );
    }

    return roleDoc.key;
  }

  async createStaffUser(
    organizationId: string,
    dto: CreateStaffUserDto,
  ): Promise<UserDocument> {
    const assignableRole = await this.resolveAssignableRoleKey(dto.role);

    const existingUser = await this.usersRepository.findByEmailWithPassword(dto.email);
    if (existingUser) {
      throw new AppException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        'A user with this email address already exists',
      );
    }

    // Check plan limits
    const currentStaffCount = await this.usersRepository.countByOrganizationId(organizationId);
    await this.subscriptionsService.assertPlanLimit(
      organizationId,
      'maxStaffUsers',
      currentStaffCount,
    );

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.usersRepository.create({
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      name: dto.name.trim(),
      role: assignableRole,
      organizationId: new Types.ObjectId(organizationId),
      isActive: true,
      emailVerified: true,
    });
  }

  async updateStaffUser(
    organizationId: string,
    userId: string,
    requestingUserId: string,
    dto: UpdateStaffUserDto,
  ): Promise<UserDocument> {
    const user = await this.usersRepository.findById(userId);
    if (!user || user.organizationId?.toString() !== organizationId) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
        ErrorMessages[ErrorCode.USER_NOT_FOUND],
      );
    }

    const assignableRole =
      dto.role !== undefined
        ? await this.resolveAssignableRoleKey(dto.role)
        : undefined;

    // Prevent deactivating own account
    if (dto.isActive === false && userId === requestingUserId) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.CANNOT_DELETE_SELF,
        ErrorMessages[ErrorCode.CANNOT_DELETE_SELF],
      );
    }

    // If changing role away from ORG_ADMIN or deactivating, verify there's another active admin
    if (
      user.role === Role.ORG_ADMIN &&
      ((assignableRole && assignableRole !== Role.ORG_ADMIN) ||
        dto.isActive === false)
    ) {
      const adminCount = await this.usersRepository.countAdminsInOrg(organizationId);
      if (adminCount <= 1) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.CANNOT_REMOVE_LAST_ADMIN,
          ErrorMessages[ErrorCode.CANNOT_REMOVE_LAST_ADMIN],
        );
      }
    }

    const updatePayload: Partial<User> = {};
    if (dto.name !== undefined) {
      updatePayload.name = dto.name.trim();
    }
    if (assignableRole !== undefined) {
      updatePayload.role = assignableRole;
      if (assignableRole !== user.role) {
        // Revoke refresh token when role privileges change
        updatePayload.refreshTokenHash = null;
      }
    }
    if (dto.isActive !== undefined) {
      updatePayload.isActive = dto.isActive;
      if (dto.isActive === false) {
        // Revoke refresh token immediately on deactivation
        updatePayload.refreshTokenHash = null;
      }
    }

    const updated = await this.usersRepository.updateById(userId, {
      $set: updatePayload,
    });

    return updated!;
  }

  async deleteStaffUser(
    organizationId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<void> {
    if (userId === requestingUserId) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.CANNOT_DELETE_SELF,
        ErrorMessages[ErrorCode.CANNOT_DELETE_SELF],
      );
    }

    const user = await this.usersRepository.findById(userId);
    if (!user || user.organizationId?.toString() !== organizationId) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
        ErrorMessages[ErrorCode.USER_NOT_FOUND],
      );
    }

    if (user.role === Role.ORG_ADMIN) {
      const adminCount = await this.usersRepository.countAdminsInOrg(organizationId);
      if (adminCount <= 1) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.CANNOT_REMOVE_LAST_ADMIN,
          ErrorMessages[ErrorCode.CANNOT_REMOVE_LAST_ADMIN],
        );
      }
    }

    await this.usersRepository.deleteById(userId);
  }
}
