import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or expired JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  // 列表（带过滤）：GET /api/companies?level=1,2&search=Rodriguez
  @Get()
  @ApiOperation({ summary: 'List companies with pagination, level filter, and name search' })
  findAll(@Query() query: CompanyQueryDto) {
    return this.companyService.findAll(query);
  }

  // 单个公司：GET /api/companies/C01
  @Get(':code')
  @ApiOperation({ summary: 'Get one company' })
  findOne(@Param('code') code: string) {
    return this.companyService.findOne(code);
  }

  // 创建：POST /api/companies
  @Post()
  @ApiOperation({ summary: 'Create a company and relationship' })
  @HttpCode(201)
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.createCompany(dto);
  }

  // 更新：PATCH /api/companies/C01
  @Patch(':code')
  @ApiOperation({ summary: 'Update a company and relationship' })
  update(@Param('code') code: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.updateCompany(code, dto);
  }

  // 删除：DELETE /api/companies/C01
  @Delete(':code')
  @ApiOperation({ summary: 'Delete one company' })
  remove(@Param('code') code: string) {
    return this.companyService.removeCompany(code);
  }
}
