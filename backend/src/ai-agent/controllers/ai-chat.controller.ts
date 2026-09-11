import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { AiSessionService } from '../services/ai-session.service';
import { AiChatService } from '../services/ai-chat.service';
import { AiScopeGuard } from '../security/ai-scope.guard';
import { AiQueryDto, UpdateSessionDto } from '../dto/records.dto';
import { AiRecordResponse } from '../dto/ai-swagger';

interface AuthRequest {
  user: { id: number; email: string };
}
const uploadDir = join(process.cwd(), 'uploads', 'ai-agent');
mkdirSync(uploadDir, { recursive: true });
const allowedMimeTypes = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
]);

@ApiTags('AI Agent')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or expired JWT' })
@UseGuards(JwtAuthGuard, AiScopeGuard)
@Controller('api/ai-agent')
export class AiChatController {
  constructor(
    private readonly sessions: AiSessionService,
    private readonly chat: AiChatService,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create an AI chat session' })
  @AiRecordResponse('session', false, 201)
  create(@Req() req: AuthRequest, @Body() dto: CreateSessionDto) {
    return this.sessions.create(req.user.id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List the current user chat sessions' })
  @AiRecordResponse('session', true)
  list(@Req() req: AuthRequest, @Query() query: AiQueryDto) {
    return this.sessions.list(req.user.id, query);
  }

  @Patch('sessions/:id')
  @AiRecordResponse('session')
  @ApiOperation({
    summary: 'Update own session; closing clears short-term memory',
  })
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessions.update(id, req.user.id, dto);
  }

  @Get('sessions/:id')
  @AiRecordResponse('session')
  @ApiOperation({ summary: 'Load one chat session with message history' })
  get(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.getOwned(id, req.user.id, true);
  }

  @Delete('sessions/:id')
  @AiRecordResponse('deleted')
  @ApiOperation({ summary: 'Delete one chat session and its messages' })
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.remove(id, req.user.id);
  }

  @Post('chat')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a message and receive a model response' })
  @ApiOkResponse({ description: 'User and assistant messages persisted' })
  send(@Req() req: AuthRequest, @Body() dto: SendMessageDto) {
    return this.chat.send(req.user.id, dto);
  }

  @Post('files')
  @ApiOperation({ summary: 'Upload up to five chat attachments' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, callback) =>
          callback(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          ),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, callback) =>
        allowedMimeTypes.has(file.mimetype)
          ? callback(null, true)
          : callback(
              new BadRequestException('Unsupported attachment type'),
              false,
            ),
    }),
  )
  upload(@UploadedFiles() files: Express.Multer.File[] = []) {
    if (!files.length)
      throw new BadRequestException('At least one supported file is required');
    return files.map((file) => ({
      id: file.filename,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/ai-agent/${file.filename}`,
    }));
  }
}
