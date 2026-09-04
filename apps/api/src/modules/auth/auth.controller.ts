import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ApiStandardErrors } from '../../common/decorators/api-standard-errors.decorator';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_MS,
} from '../../common/throttle/throttle.constants';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorCode } from '../../constants';
import { SWAGGER_DEFAULTS } from '../../constants/swagger.constants';
import { AUTH_MESSAGES, AUTH_SWAGGER } from './auth.constants';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags(AUTH_SWAGGER.TAG)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appConfigService: AppConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.appConfigService.isProduction,
      sameSite: 'strict',
      path: '/auth',
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      path: '/auth',
    });
  }

  @Public()
  @Throttle({
    auth: {
      limit: AUTH_THROTTLE_LIMIT,
      ttl: AUTH_THROTTLE_TTL_MS,
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: AUTH_SWAGGER.LOGIN_SUMMARY,
    description: AUTH_SWAGGER.LOGIN_DESCRIPTION,
  })
  @ApiOkResponse({ description: AUTH_SWAGGER.LOGIN_OK_DESCRIPTION })
  @ApiStandardErrors(
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
  )
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateCredentials(
      dto.email,
      dto.password,
    );
    const tokens = await this.authService.login(user);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: tokens.user,
    };
  }

  @Public()
  @Throttle({
    auth: {
      limit: AUTH_THROTTLE_LIMIT,
      ttl: AUTH_THROTTLE_TTL_MS,
    },
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: AUTH_SWAGGER.REFRESH_SUMMARY,
    description: AUTH_SWAGGER.REFRESH_DESCRIPTION,
  })
  @ApiOkResponse({ description: AUTH_SWAGGER.REFRESH_OK_DESCRIPTION })
  @ApiStandardErrors(ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.refreshToken;
    const tokens = await this.authService.refresh(rawRefreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: tokens.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(SWAGGER_DEFAULTS.AUTH_BEARER_NAME)
  @ApiOperation({
    summary: AUTH_SWAGGER.LOGOUT_SUMMARY,
    description: AUTH_SWAGGER.LOGOUT_DESCRIPTION,
  })
  @ApiOkResponse({ description: AUTH_SWAGGER.LOGOUT_OK_DESCRIPTION })
  @ApiStandardErrors(ErrorCode.UNAUTHORIZED)
  async logout(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    this.clearRefreshTokenCookie(res);

    return { message: AUTH_MESSAGES.LOGGED_OUT };
  }
}
