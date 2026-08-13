import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserProfile } from './user-profile.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserManageController } from './user-manage.controller';
import { UserProfileBackfillService } from './user-profile-backfill.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UserController, UserManageController],
  providers: [UserService, UserProfileBackfillService],
  exports: [UserService],
})
export class UserModule {}
