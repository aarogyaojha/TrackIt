import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
} from '@react-email/components';

export interface TestEmailProps {
  name?: string;
}

export const TestEmailTemplate: React.FC<TestEmailProps> = ({
  name = 'User',
}) => {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Heading>Test Email</Heading>
          <Text>Hello {name}, this is a test email from TrackIt.</Text>
        </Container>
      </Body>
    </Html>
  );
};
