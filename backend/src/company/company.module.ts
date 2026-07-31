import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { Relationship } from './relationship.entity';
import { SeedService } from './seed.service';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Relationship])],
  controllers: [CompanyController],
  providers: [SeedService, CompanyService],
})
export class CompanyModule {}