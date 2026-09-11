import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as React from 'react';
import { AppException } from '../../common/exceptions/app.exception';
import { AppConfigService } from '../../config/app-config.service';
import { ErrorCode } from '../../constants';
import { EmailService } from './email.service';
import { TestEmailTemplate } from './templates/test-email.template';

describe('EmailService', () => {
  let service: EmailService;
  let configService: {
    resendApiKey: string | undefined;
    emailFromAddress: string;
    emailFromName: string;
  };
  let mockSend: jest.Mock;

  beforeEach(async () => {
    mockSend = jest.fn();

    configService = {
      resendApiKey: 're_test_key_123',
      emailFromAddress: 'notifications@trackit.local',
      emailFromName: 'TrackIt Test',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: AppConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);

    // Mock internal resend instance
    (service as unknown as { resend: { emails: { send: jest.Mock } } }).resend = {
      emails: {
        send: mockSend,
      },
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    it('should successfully render template to html and send email via Resend', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email_test_id_123' },
        error: null,
      });

      const template = React.createElement(TestEmailTemplate, { name: 'Alice' });

      await expect(
        service.send('alice@example.com', 'Test Subject', template),
      ).resolves.toBeUndefined();

      expect(mockSend).toHaveBeenCalledTimes(1);
      const sendArgs = mockSend.mock.calls[0][0];
      expect(sendArgs.to).toBe('alice@example.com');
      expect(sendArgs.subject).toBe('Test Subject');
      expect(sendArgs.from).toBe('TrackIt Test <notifications@trackit.local>');
      expect(sendArgs.html).toContain('Alice');
      expect(sendArgs.html).toContain('Test Email');
      expect(sendArgs.html).toContain('this is a test email from TrackIt');
    });

    it('should throw AppException when Resend returns an error response', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key or unverified domain', name: 'resend_error' },
      });

      const template = React.createElement(TestEmailTemplate, { name: 'Bob' });

      await expect(
        service.send('bob@example.com', 'Failed Subject', template),
      ).rejects.toThrow(AppException);

      try {
        await service.send('bob@example.com', 'Failed Subject', template);
      } catch (err) {
        expect(err).toBeInstanceOf(AppException);
        const appException = err as AppException;
        expect(appException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(appException.code).toBe(ErrorCode.EMAIL_SEND_FAILED);
      }
    });

    it('should throw AppException when Resend API call throws an unexpected error', async () => {
      mockSend.mockRejectedValue(new Error('Network connection timeout'));

      const template = React.createElement(TestEmailTemplate, { name: 'Charlie' });

      await expect(
        service.send('charlie@example.com', 'Network Error Subject', template),
      ).rejects.toThrow(AppException);

      try {
        await service.send('charlie@example.com', 'Network Error Subject', template);
      } catch (err) {
        expect(err).toBeInstanceOf(AppException);
        const appException = err as AppException;
        expect(appException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(appException.code).toBe(ErrorCode.EMAIL_SEND_FAILED);
      }
    });

    it('should throw AppException if Resend client or API key is not configured', async () => {
      const unconfiguredConfigService = {
        resendApiKey: undefined,
        emailFromAddress: 'notifications@trackit.local',
        emailFromName: 'TrackIt Test',
      };

      const unconfiguredModule: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: AppConfigService,
            useValue: unconfiguredConfigService,
          },
        ],
      }).compile();

      const unconfiguredService = unconfiguredModule.get<EmailService>(EmailService);
      const template = React.createElement(TestEmailTemplate, { name: 'Dave' });

      await expect(
        unconfiguredService.send('dave@example.com', 'No Key Subject', template),
      ).rejects.toThrow(AppException);

      try {
        await unconfiguredService.send('dave@example.com', 'No Key Subject', template);
      } catch (err) {
        expect(err).toBeInstanceOf(AppException);
        const appException = err as AppException;
        expect(appException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(appException.code).toBe(ErrorCode.EMAIL_SEND_FAILED);
      }
    });
  });
});
