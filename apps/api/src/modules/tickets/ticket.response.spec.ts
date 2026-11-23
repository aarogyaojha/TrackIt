import { Types } from 'mongoose';
import { StatusCategory, TicketStatus } from '@trackit/types';
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
    workflowId: new Types.ObjectId(),
    code: 'BIKE-001',
    customerName: 'Alice Springs',
    customerPhone: '+1234567890',
    itemDescription: 'Trek Road Bike Tune-up',
    status: TicketStatus.RECEIVED,
    statusCategory: StatusCategory.INITIAL,
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
        workflowId: mockTicket.workflowId?.toString(),
        code: 'BIKE-001',
        customerName: 'Alice Springs',
        customerPhone: '+1234567890',
        itemDescription: 'Trek Road Bike Tune-up',
        status: TicketStatus.RECEIVED,
        statusCategory: StatusCategory.INITIAL,
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
    it('exposes only customer-safe fields and omits internal IDs, phone numbers, workflowId, staff names, and changedBy', () => {
      const orgName = 'Apex Repairs Ltd.';
      const mockWorkflow = {
        statuses: [
          {
            key: 'RECEIVED',
            name: 'Received (Staff Internal Name)',
            customerLabel: 'Received by Workshop',
            customerDescription: 'Item is safely received.',
            category: StatusCategory.INITIAL,
            order: 0,
          },
          {
            key: 'IN_PROGRESS',
            name: 'In Progress (Staff)',
            customerLabel: 'Being Repaired',
            customerDescription: 'Our technicians are working on it.',
            category: StatusCategory.IN_PROGRESS,
            order: 1,
          },
        ],
      };

      const res = toPublicTicketResponse(mockTicket, orgName, mockWorkflow);

      expect(res).toEqual({
        organizationName: 'Apex Repairs Ltd.',
        code: 'BIKE-001',
        customerName: 'Alice Springs',
        itemDescription: 'Trek Road Bike Tune-up',
        customerLabel: 'Received by Workshop',
        customerDescription: 'Item is safely received.',
        category: StatusCategory.INITIAL,
        stages: [
          {
            customerLabel: 'Received by Workshop',
            customerDescription: 'Item is safely received.',
            category: StatusCategory.INITIAL,
          },
          {
            customerLabel: 'Being Repaired',
            customerDescription: 'Our technicians are working on it.',
            category: StatusCategory.IN_PROGRESS,
          },
        ],
        statusHistory: [
          {
            customerLabel: 'Received by Workshop',
            changedAt: date,
          },
        ],
        createdAt: date,
      });

      // Explicit assertions ensuring sensitive fields are omitted
      expect('id' in res).toBe(false);
      expect('_id' in res).toBe(false);
      expect('workflowId' in res).toBe(false);
      expect('workflow' in res).toBe(false);
      expect('name' in res).toBe(false);
      expect('status' in res).toBe(false);
      expect('statusCategory' in res).toBe(false);
      expect('customerPhone' in res).toBe(false);
      expect('createdBy' in res).toBe(false);
      expect('changedBy' in res).toBe(false);
      expect('qrCodeDataUrl' in res).toBe(false);
      expect('changedBy' in res.statusHistory[0]).toBe(false);
    });

    it('handles missing workflow gracefully with fallback values', () => {
      const orgName = 'Apex Repairs Ltd.';

      const res = toPublicTicketResponse(mockTicket, orgName);

      expect(res).toEqual({
        organizationName: 'Apex Repairs Ltd.',
        code: 'BIKE-001',
        customerName: 'Alice Springs',
        itemDescription: 'Trek Road Bike Tune-up',
        customerLabel: TicketStatus.RECEIVED,
        customerDescription: undefined,
        category: StatusCategory.INITIAL,
        stages: [],
        statusHistory: [
          {
            customerLabel: TicketStatus.RECEIVED,
            changedAt: date,
          },
        ],
        createdAt: date,
      });

      expect('id' in res).toBe(false);
      expect('_id' in res).toBe(false);
      expect('workflowId' in res).toBe(false);
      expect('customerPhone' in res).toBe(false);
      expect('changedBy' in res).toBe(false);
    });
  });
});
