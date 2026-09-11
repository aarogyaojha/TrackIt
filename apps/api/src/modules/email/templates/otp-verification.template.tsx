import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
} from '@react-email/components';

export interface OtpVerificationTemplateProps {
  name?: string;
  otp: string;
  expiryMinutes?: number;
}

export const OtpVerificationTemplate: React.FC<OtpVerificationTemplateProps> = ({
  name = 'User',
  otp,
  expiryMinutes = 10,
}) => {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: '#f6f9fc',
          margin: 0,
          padding: '24px 0',
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          <Heading
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '16px',
            }}
          >
            Verify Your Email
          </Heading>
          <Text
            style={{
              fontSize: '16px',
              lineHeight: '24px',
              color: '#334155',
              marginBottom: '24px',
            }}
          >
            Hello {name},
          </Text>
          <Text
            style={{
              fontSize: '16px',
              lineHeight: '24px',
              color: '#334155',
              marginBottom: '24px',
            }}
          >
            Thank you for registering with TrackIt. Please use the following
            verification code to complete your registration:
          </Text>
          <Section
            style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            <Text
              style={{
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '6px',
                color: '#0f172a',
                margin: 0,
              }}
            >
              {otp}
            </Text>
          </Section>
          <Text
            style={{
              fontSize: '14px',
              lineHeight: '20px',
              color: '#64748b',
              marginBottom: '8px',
            }}
          >
            This code will expire in {expiryMinutes} minutes. If you did not
            request this code, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
