import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OrgStatus } from '@trackit/types';
import { AppException } from '../../common/exceptions/app.exception';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorCode, ErrorMessages } from '../../constants';
import { OrganizationsService } from '../organizations/organization.service';
import { toUserResponse, UserResponse } from '../users/user.response';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/user.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly appConfigService: AppConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async validateCredentials(
    email: string,
    pass: string,
  ): Promise<UserDocument> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessages[ErrorCode.INVALID_CREDENTIALS],
      );
    }

    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
        ErrorMessages[ErrorCode.INVALID_CREDENTIALS],
      );
    }

    if (user.organizationId) {
      const org = await this.organizationsService.getById(
        user.organizationId.toString(),
      );

      if (!org || org.status !== OrgStatus.ACTIVE) {
        throw new AppException(
          HttpStatus.FORBIDDEN,
          ErrorCode.ORG_NOT_APPROVED,
          ErrorMessages[ErrorCode.ORG_NOT_APPROVED],
        );
      }
    }

    return user;
  }

  async login(user: UserDocument): Promise<AuthTokens> {
    const userId = user._id.toString();
    const organizationId = user.organizationId
      ? user.organizationId.toString()
      : null;

    const accessPayload = {
      sub: userId,
      organizationId,
      role: user.role,
    };

    const refreshPayload = {
      sub: userId,
      type: 'refresh',
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.appConfigService.jwtAccessSecret,
      expiresIn: this.appConfigService
        .jwtAccessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.appConfigService.jwtRefreshSecret,
      expiresIn: this.appConfigService
        .jwtRefreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshTokenHash = this.hashToken(refreshToken);
    await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: toUserResponse(user),
    };
  }

  async refresh(rawRefreshToken: string | undefined): Promise<AuthTokens> {
    if (!rawRefreshToken) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
        ErrorMessages[ErrorCode.INVALID_REFRESH_TOKEN],
      );
    }

    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: this.appConfigService.jwtRefreshSecret,
      });
    } catch {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
        ErrorMessages[ErrorCode.INVALID_REFRESH_TOKEN],
      );
    }

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
        ErrorMessages[ErrorCode.INVALID_REFRESH_TOKEN],
      );
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
        ErrorMessages[ErrorCode.INVALID_REFRESH_TOKEN],
      );
    }

    if (user.organizationId) {
      const org = await this.organizationsService.getById(
        user.organizationId.toString(),
      );

      if (!org || org.status !== OrgStatus.ACTIVE) {
        throw new AppException(
          HttpStatus.FORBIDDEN,
          ErrorCode.ORG_NOT_APPROVED,
          ErrorMessages[ErrorCode.ORG_NOT_APPROVED],
        );
      }
    }

    const computedHash = this.hashToken(rawRefreshToken);
    const storedHashBuffer = Buffer.from(user.refreshTokenHash, 'hex');
    const computedHashBuffer = Buffer.from(computedHash, 'hex');

    if (
      storedHashBuffer.length !== computedHashBuffer.length ||
      !crypto.timingSafeEqual(storedHashBuffer, computedHashBuffer)
    ) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
        ErrorMessages[ErrorCode.INVALID_REFRESH_TOKEN],
      );
    }

    return this.login(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.clearRefreshTokenHash(userId);
  }
}
