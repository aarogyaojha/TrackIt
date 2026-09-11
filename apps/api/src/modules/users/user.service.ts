import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as React from 'react';
import { ClientSession, Types } from 'mongoose';
import { Role } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode, ErrorMessages } from '../../constants';
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
} from '../auth/auth.constants';
import { EmailService } from '../email/email.service';
import { OtpVerificationTemplate } from '../email/templates/otp-verification.template';
import { UsersRepository } from './user.repository';
import { User, UserDocument } from './user.schema';
import { SALT_ROUNDS } from './users.constants';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: Role;
  organizationId?: Types.ObjectId | string | null;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
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
}
