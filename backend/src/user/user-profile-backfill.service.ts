import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserProfile } from './user-profile.entity';

@Injectable()
export class UserProfileBackfillService implements OnModuleInit {
  private readonly logger = new Logger(UserProfileBackfillService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async onModuleInit(): Promise<void> {
    const usersWithoutProfile = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user_profile', 'profile', 'profile.user_id = user.id')
      .where('profile.id IS NULL')
      .getMany();

    if (usersWithoutProfile.length === 0) {
      return;
    }

    const profiles = usersWithoutProfile.map((user) =>
      this.profileRepository.create({
        user_id: user.id,
        name: user.email.split('@')[0] || 'User',
        role: 'User',
        status: 'active',
      }),
    );

    await this.profileRepository.save(profiles);
    this.logger.log(
      `Created profiles for ${profiles.length} existing users.`,
    );
  }
}
