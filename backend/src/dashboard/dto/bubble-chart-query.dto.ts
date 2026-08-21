import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { CompanyBarChartFilterDto } from './bar-chart-query.dto';

export class BubbleChartQueryDto {
  @ApiProperty({ type: CompanyBarChartFilterDto })
  @ValidateNested()
  @Type(() => CompanyBarChartFilterDto)
  filter: CompanyBarChartFilterDto;
}
