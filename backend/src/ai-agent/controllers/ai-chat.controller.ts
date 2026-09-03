import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
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
  ApiCreatedResponse,
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
@UseGuards(JwtAuthGuard)
@Controller('api/ai-agent')
export class AiChatController {
  constructor(
    private readonly sessions: AiSessionService,
    private readonly chat: AiChatService,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create an AI chat session' })
  @ApiCreatedResponse({ description: 'Session created' })
  create(@Req() req: AuthRequest, @Body() dto: CreateSessionDto) {
    return this.sessions.create(req.user.id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List the current user chat sessions' })
  @ApiOkResponse({ description: 'Sessions ordered by recent activity' })
  list(@Req() req: AuthRequest) {
    return this.sessions.list(req.user.id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Load one chat session with message history' })
  get(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.getOwned(id, req.user.id, true);
  }

  @Delete('sessions/:id')
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
