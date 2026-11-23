import { Types } from 'mongoose';
import { StatusCategory } from '@trackit/types';
import {
  toWorkflowResponse,
  toWorkflowSummaryResponse,
} from './workflow.response';
import { WorkflowDocument } from './workflow.schema';

describe('Workflow Response Mappers', () => {
  const orgId = new Types.ObjectId();
  const workflowId = new Types.ObjectId();
  const date = new Date('2026-01-01T00:00:00.000Z');

  const mockWorkflow = {
    _id: workflowId,
    organizationId: orgId,
    name: 'Custom Tailor Workflow',
    description: 'Custom suit alteration lifecycle',
    isDefault: true,
    isActive: true,
    statuses: [
      {
        key: 'ready',
        name: 'Ready for Fitting',
        customerLabel: 'Fitting Ready',
        customerDescription: 'Come try on your garment.',
        category: StatusCategory.READY,
        color: 'warning',
        order: 2,
      },
      {
        key: 'cutting',
        name: 'Fabric Cutting',
        customerLabel: 'Cutting Pattern',
        customerDescription: 'We are cutting the cloth.',
        category: StatusCategory.INITIAL,
        color: 'secondary',
        order: 0,
      },
      {
        key: 'stitching',
        name: 'Stitching',
        customerLabel: 'Under Needle',
        customerDescription: 'Tailoring the panels together.',
        category: StatusCategory.IN_PROGRESS,
        color: 'default',
        order: 1,
      },
      {
        key: 'completed',
        name: 'Collected',
        customerLabel: 'Finished & Collected',
        customerDescription: 'Customer collected their suit.',
        category: StatusCategory.COMPLETED,
        color: 'success',
        order: 3,
      },
    ],
    createdAt: date,
    updatedAt: date,
  } as unknown as WorkflowDocument;

  describe('toWorkflowSummaryResponse', () => {
    it('maps summary fields and computes statusCount', () => {
      const summary = toWorkflowSummaryResponse(mockWorkflow);

      expect(summary).toEqual({
        id: workflowId.toString(),
        organizationId: orgId.toString(),
        name: 'Custom Tailor Workflow',
        description: 'Custom suit alteration lifecycle',
        isDefault: true,
        isActive: true,
        statusCount: 4,
        createdAt: date,
        updatedAt: date,
      });
    });
  });

  describe('toWorkflowResponse', () => {
    it('maps all details and sorts statuses by order ascending', () => {
      const detail = toWorkflowResponse(mockWorkflow);

      expect(detail.id).toBe(workflowId.toString());
      expect(detail.name).toBe('Custom Tailor Workflow');
      expect(detail.statuses).toHaveLength(4);

      // Verify order is sorted ascending (0, 1, 2, 3)
      expect(detail.statuses[0].key).toBe('cutting');
      expect(detail.statuses[0].order).toBe(0);
      expect(detail.statuses[1].key).toBe('stitching');
      expect(detail.statuses[1].order).toBe(1);
      expect(detail.statuses[2].key).toBe('ready');
      expect(detail.statuses[2].order).toBe(2);
      expect(detail.statuses[3].key).toBe('completed');
      expect(detail.statuses[3].order).toBe(3);
    });
  });
});

