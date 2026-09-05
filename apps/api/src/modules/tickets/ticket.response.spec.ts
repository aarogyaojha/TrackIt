import { Types } from 'mongoose';
import { TicketStatus } from '@trackit/types';
import {
  toPublicTicketResponse,
  toTicketResponse,
} from './ticket.response';
import { TicketDocument } from './ticket.schema';

describe('Ticket Response Mappers', () => {
  const orgId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const ticketId = new Types.ObjectId();
  const date = new Date('2026-01-01T00:00:00.000Z');

  const mockTicket = {
    _id: ticketId,
    organizationId: orgId,
    code: 'BIKE-001',
    customerName: 'Alice Springs',
    customerPhone: '+1234567890',
    itemDescription: 'Trek Road Bike Tune-up',
    status: TicketStatus.RECEIVED,
    statusHistory: [
      {
        status: TicketStatus.RECEIVED,
        changedAt: date,
        changedBy: userId,
      },
    ],
    createdBy: userId,
    createdAt: date,
    updatedAt: date,
  } as unknown as TicketDocument;

  describe('toTicketResponse', () => {
    it('maps all ticket fields correctly and generates a valid QR code data-URL and publicUrl', async () => {
      const orgSlug = 'apex-repairs';
      const corsOrigin = 'http://localhost:3000';

      const res = await toTicketResponse(mockTicket, orgSlug, corsOrigin);

      expect(res).toEqual({
        id: ticketId.toString(),
        code: 'BIKE-001',
        customerName: 'Alice Springs',
        customerPhone: '+1234567890',
        itemDescription: 'Trek Road Bike Tune-up',
        status: TicketStatus.RECEIVED,
        statusHistory: [
          {
            status: TicketStatus.RECEIVED,
            changedAt: date,
            changedBy: userId.toString(),
          },
        ],
        createdAt: date,
        updatedAt: date,
        publicUrl: 'http://localhost:3000/apex-repairs/t/BIKE-001',
        qrCodeDataUrl: expect.stringMatching(/^data:image\/png;base64,/),
      });
    });
  });

  describe('toPublicTicketResponse', () => {
    it('excludes customerPhone, changedBy, and internal _id/id', () => {
      const orgName = 'Apex Repairs Ltd.';

      const res = toPublicTicketResponse(mockTicket, orgName);

      expect(res).toEqual({
        organizationName: 'Apex Repairs Ltd.',
        code: 'BIKE-001',
        customerName: 'Alice Springs',
        itemDescription: 'Trek Road Bike Tune-up',
        status: TicketStatus.RECEIVED,
        statusHistory: [
          {
            status: TicketStatus.RECEIVED,
            changedAt: date,
          },
        ],
        createdAt: date,
      });

      // Explicit assertions ensuring sensitive fields are omitted
      expect('id' in res).toBe(false);
      expect('_id' in res).toBe(false);
      expect('customerPhone' in res).toBe(false);
      expect('createdBy' in res).toBe(false);
      expect('qrCodeDataUrl' in res).toBe(false);
      expect(res.statusHistory[0]).not.toHaveProperty('changedBy');
    });
  });
});
