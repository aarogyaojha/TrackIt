import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get nodeEnv(): string {
    return this.configService.get<string>('nodeEnv', { infer: true });
  }

  get port(): number {
    return this.configService.get<number>('port', { infer: true });
  }

  get mongodbUri(): string {
    return this.configService.get<string>('mongodbUri', { infer: true });
  }

  get corsOrigin(): string {
    return this.configService.get<string>('corsOrigin', { infer: true });
  }

  get jwtAccessSecret(): string {
    return this.configService.get<string>('jwtAccessSecret', { infer: true });
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('jwtRefreshSecret', { infer: true });
  }

  get jwtAccessExpiresIn(): string {
    return this.configService.get<string>('jwtAccessExpiresIn', { infer: true });
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('jwtRefreshExpiresIn', { infer: true });
  }

  get superadminEmail(): string | undefined {
    return this.configService.get<string | undefined>('superadminEmail', { infer: true });
  }

  get superadminPassword(): string | undefined {
    return this.configService.get<string | undefined>('superadminPassword', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
