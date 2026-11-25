import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { OrgStatus } from '@trackit/types';
import { AppConfigService } from '../../../config/app-config.service';
import { OrganizationsService } from '../../organizations/organization.service';
import { UsersService } from '../../users/user.service';

export interface JwtPayload {
  sub: string;
  organizationId: string | null;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    appConfigService: AppConfigService,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtAccessSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const orgId = user.organizationId ? user.organizationId.toString() : null;
    if (orgId) {
      const org = await this.organizationsService.getById(orgId);
      if (!org || org.status !== OrgStatus.ACTIVE) {
        throw new UnauthorizedException();
      }
    }

    return {
      userId: user._id.toString(),
      organizationId: orgId,
      role: user.role,
    };
  }
}
