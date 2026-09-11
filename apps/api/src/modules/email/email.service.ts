import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/render';
import * as React from 'react';
import { Resend } from 'resend';
import { AppException } from '../../common/exceptions/app.exception';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorCode, ErrorMessages } from '../../constants';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;

  constructor(private readonly configService: AppConfigService) {
    if (this.configService.resendApiKey) {
      this.resend = new Resend(this.configService.resendApiKey);
    }
  }

  async send(
    to: string,
    subject: string,
    template: React.JSX.Element | React.ReactElement,
  ): Promise<void> {
    try {
      if (!this.resend || !this.configService.resendApiKey) {
        this.logger.error('Resend API key is not configured');
        throw new AppException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCode.EMAIL_SEND_FAILED,
          ErrorMessages[ErrorCode.EMAIL_SEND_FAILED],
        );
      }

      const html = await render(template);
      const from = `${this.configService.emailFromName} <${this.configService.emailFromAddress}>`;

      const response = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (response.error) {
        this.logger.error(
          `Failed to send email to ${to}: ${response.error.message}`,
          response.error,
        );
        throw new AppException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCode.EMAIL_SEND_FAILED,
          ErrorMessages[ErrorCode.EMAIL_SEND_FAILED],
          response.error,
        );
      }
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error sending email to ${to}: ${(error as Error)?.message || error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new AppException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.EMAIL_SEND_FAILED,
        ErrorMessages[ErrorCode.EMAIL_SEND_FAILED],
        error,
      );
    }
  }
}
