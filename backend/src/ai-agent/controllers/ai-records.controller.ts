import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiRecordResponse } from '../dto/ai-swagger';
import { AiScopeGuard, type AiRequest } from '../security/ai-scope.guard';
import { requireAiAdmin } from '../security/ai-context';
import { AiRecordsService } from '../services/ai-records.service';
import { AiAuditService } from '../services/ai-audit.service';
import {
  AiQueryDto,
  CreateMemoryDto,
  UpdateMemoryDto,
  CreateTaskDto,
  UpdateTaskDto,
  CreateAuditDto,
  AuditCorrectionDto,
  TaskStateDto,
} from '../dto/records.dto';

@ApiTags('AI Records')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({
  description: 'Tenant membership or administrator permission required',
})
@ApiBadRequestResponse({
  description: 'Invalid fields, pagination, or attempted ownership override',
})
@ApiNotFoundResponse({
  description: 'Record not found within the authorized scope',
})
@UseGuards(JwtAuthGuard, AiScopeGuard)
@Controller('api/ai-agent')
export class AiRecordsController {
  constructor(
    private readonly records: AiRecordsService,
    private readonly audits: AiAuditService,
  ) {}

  @Post('memories')
  @AiRecordResponse('memory', false, 201)
  @ApiOperation({ summary: 'Create own memory' })
  createMemory(@Req() req: AiRequest, @Body() dto: CreateMemoryDto) {
    return this.records.saveMemory(req.ai, dto);
  }
  @Get('memories')
  @AiRecordResponse('memory', true, 200)
  @ApiOperation({
    summary: 'Paginate own memories; optional userId filter cannot widen scope',
  })
  listMemory(@Req() req: AiRequest, @Query() query: AiQueryDto) {
    return this.records.list(req.ai, 'memory', query);
  }
  @Get('memories/:id')
  @AiRecordResponse('memory', false, 200)
  @ApiOperation({ summary: 'Get own memory by UUID' })
  getMemory(@Req() req: AiRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.records.memory(req.ai, id);
  }
  @Patch('memories/:id')
  @AiRecordResponse('memory', false, 200)
  @ApiOperation({ summary: 'Update own memory' })
  updateMemory(
    @Req() req: AiRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemoryDto,
  ) {
    return this.records.saveMemory(req.ai, dto, id);
  }
  @Delete('memories/:id')
  @AiRecordResponse('deleted', false, 200)
  @ApiOperation({ summary: 'Delete own memory' })
  deleteMemory(@Req() req: AiRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.records.remove(req.ai, 'memory', id);
  }

  @Post('tasks')
  @AiRecordResponse('task', false, 201)
  @ApiOperation({ summary: 'Create own task' })
  createTask(@Req() req: AiRequest, @Body() dto: CreateTaskDto) {
    return this.records.saveTask(req.ai, dto);
  }
  @Get('tasks')
  @AiRecordResponse('task', true, 200)
  @ApiOperation({
    summary: 'Paginate own tasks; optional userId filter cannot widen scope',
  })
  listTask(@Req() req: AiRequest, @Query() query: AiQueryDto) {
    return this.records.list(req.ai, 'task', query);
  }
  @Get('tasks/:id')
  @AiRecordResponse('task', false, 200)
  @ApiOperation({ summary: 'Get own task by UUID' })
  getTask(@Req() req: AiRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.records.task(req.ai, id);
  }
  @Patch('tasks/:id')
  @AiRecordResponse('task', false, 200)
  @ApiOperation({ summary: 'Update own task' })
  updateTask(
    @Req() req: AiRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.records.saveTask(req.ai, dto, id);
  }
  @Delete('tasks/:id')
  @AiRecordResponse('deleted', false, 200)
  @ApiOperation({ summary: 'Delete own task' })
  deleteTask(@Req() req: AiRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.records.remove(req.ai, 'task', id);
  }

  @Get('tasks/:id/state')
  @AiRecordResponse('state')
  @ApiOperation({
    summary: 'Read temporary task state; expired state returns null',
  })
  getState(@Req() req: AiRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.records.state(req.ai, id);
  }
  @Put('tasks/:id/state')
  @AiRecordResponse('state')
  @ApiOperation({
    summary: 'Write temporary task state with TTL; Redis outage returns 503',
  })
  putState(
    @Req() req: AiRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TaskStateDto,
  ) {
    return this.records.state(req.ai, id, dto);
  }
  @Post('audits')
  @AiRecordResponse('audit', false, 201)
  @ApiOperation({ summary: 'Administrator only: append a manual audit event' })
  createAudit(@Req() req: AiRequest, @Body() dto: CreateAuditDto) {
    requireAiAdmin(req.ai);
    return this.audits.append(req.ai, {
      ...dto,
      action: 'manual.' + dto.action.slice(0, 73),
    });
  }
  @Get('audits')
  @AiRecordResponse('audit', true, 200)
  @ApiOperation({
    summary: 'Own audit logs; administrators can see all logs in their tenant',
  })
  listAudit(@Req() req: AiRequest, @Query() query: AiQueryDto) {
    return this.audits.list(req.ai, query);
  }
  @Get('audits/:id')
  @AiRecordResponse('audit', false, 200)
  @ApiOperation({
    summary: 'Read an authorized audit event, including retained corrections',
  })
  getAudit(@Req() req: AiRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.audits.get(req.ai, id);
  }
  @Patch('audits/:id')
  @AiRecordResponse('audit', false, 200)
  @ApiOperation({
    summary:
      'Administrator only: add correction without changing original event',
  })
  correctAudit(
    @Req() req: AiRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AuditCorrectionDto,
  ) {
    return this.audits.correct(req.ai, id, dto.reason);
  }
  @Delete('audits/:id')
  @AiRecordResponse('audit', false, 200)
  @ApiOperation({
    summary: 'Administrator only: mark deleted with a reason; retain evidence',
  })
  deleteAudit(
    @Req() req: AiRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AuditCorrectionDto,
  ) {
    return this.audits.correct(req.ai, id, dto.reason, true);
  }
}
