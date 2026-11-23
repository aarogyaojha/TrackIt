import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateWorkflowDto } from './create-workflow.dto';

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {
  @ApiPropertyOptional({
    description: 'Whether the workflow is active and available for new tickets',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

