import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiScopeGuard, type AiRequest } from '../security/ai-scope.guard';
import { AiToolsService } from '../services/ai-tools.service';
import { BarChartQueryDto } from '../../dashboard/dto/bar-chart-query.dto';

@ApiTags('AI Tools')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard, AiScopeGuard)
@Controller('api/ai-agent/tools')
export class AiToolsController {
  constructor(private readonly tools: AiToolsService) {}
  @Post('companies/filter')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Read-only company aggregation through the existing DashboardService',
  })
  @ApiOkResponse({
    description: 'data: existing aggregation response; cacheHit: boolean',
  })
  companies(@Req() req: AiRequest, @Body() dto: BarChartQueryDto) {
    return this.tools.companies(req.ai, dto);
  }
}
