import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../company/company.entity';
import { Relationship } from '../company/relationship.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Relationship])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
