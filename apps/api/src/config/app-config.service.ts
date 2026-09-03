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

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
