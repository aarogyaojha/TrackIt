import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Role } from '@trackit/types';
import { AppModule } from '../app.module';
import { AppConfigService } from '../config/app-config.service';
import { UsersRepository } from '../modules/users/user.repository';
import { UsersService } from '../modules/users/user.service';

async function bootstrap() {
  const logger = new Logger('SeedSuperadmin');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const usersRepository = app.get(UsersRepository);
    const usersService = app.get(UsersService);
    const configService = app.get(AppConfigService);

    const existingSuperadmin = await usersRepository.findOne({
      role: Role.SUPERADMIN,
    });

    if (existingSuperadmin) {
      logger.log(
        `Superadmin already exists (${existingSuperadmin.email}). Skipping bootstrap.`,
      );
      await app.close();
      return;
    }

    const email = configService.superadminEmail;
    const password = configService.superadminPassword;

    if (!email || !password) {
      logger.error(
        'SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables must be defined to seed superadmin.',
      );
      await app.close();
      process.exit(1);
    }

    const superadmin = await usersService.createUser({
      email,
      name: 'Super Admin',
      password,
      role: Role.SUPERADMIN,
      organizationId: null,
    });

    logger.log(`Superadmin created successfully: ${superadmin.email}`);
    await app.close();
  } catch (error) {
    logger.error('Failed to seed superadmin:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
