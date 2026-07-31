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
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('api/companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  // 列表（带过滤）：GET /api/companies?level=1,2&search=Rodriguez
  @Get()
  findAll(@Query('level') level?: string, @Query('search') search?: string) {
    return this.companyService.findAll({ level, search });
  }

  // 单个公司：GET /api/companies/C01
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.companyService.findOne(code);
  }

  // 创建：POST /api/companies
  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.createCompany(dto);
  }

  // 更新：PATCH /api/companies/C01
  @Patch(':code')
  update(@Param('code') code: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.updateCompany(code, dto);
  }

  // 删除：DELETE /api/companies/C01
  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.companyService.removeCompany(code);
  }
}