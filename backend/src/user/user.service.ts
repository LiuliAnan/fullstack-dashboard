import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserProfile } from './user-profile.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private dataSource: DataSource,
  ) {}

  // ===== 认证相关 =====

  async create(dto: SignUpDto): Promise<Partial<User>> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        password_hash: dto.password,
      });
      const saved = await manager.save(user);

      const profile = manager.create(UserProfile, {
        user_id: saved.id,
        name: this.defaultNameFromEmail(saved.email),
        role: 'User',
        status: 'active',
      });
      await manager.save(profile);

      return {
        id: saved.id,
        email: saved.email,
        createdAt: saved.createdAt,
      };
    });
  }

  private defaultNameFromEmail(email: string): string {
    return email.split('@')[0] || 'User';
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // ===== 用户管理 CRUD =====

  // 列表查询：联表 user + user_profile，支持 role 过滤和 name 搜索
  async findAll(query: UserQueryDto) {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .innerJoin('user_profile', 'p', 'p.user_id = u.id')
      .select([
        'u.id AS id',
        'u.email AS email',
        'p.name AS name',
        'p.role AS role',
        'p.status AS status',
        'u.created_at AS "createdAt"',
      ]);

    // role 多选过滤（逗号分隔，如 ?role=Admin,Manager）
    if (query.role) {
      const roles = query.role.split(',').filter(Boolean);
      if (roles.length > 0) {
        qb.andWhere('p.role IN (:...roles)', { roles });
      }
    }

    // name 搜索（模糊匹配）
    if (query.search) {
      qb.andWhere('p.name ILIKE :search', { search: `%${query.search}%` });
    }

    const total = await qb.getCount();
    const items = await qb
      .orderBy('u.id', 'ASC')
      .offset((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .getRawMany();

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  // 查询单个用户（联表）
  async findOneById(id: number) {
    const result = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('user_profile', 'p', 'p.user_id = u.id')
      .select([
        'u.id AS id',
        'u.email AS email',
        'p.name AS name',
        'p.role AS role',
        'p.status AS status',
        'u.created_at AS "createdAt"',
      ])
      .where('u.id = :id', { id })
      .getRawOne();

    if (!result) {
      throw new NotFoundException('User not found');
    }
    return result;
  }

  // 创建用户 + 资料（事务，保证两条记录同时成功）
  async createWithProfile(dto: CreateUserDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. 建 user（@BeforeInsert 自动加密密码）
      const user = manager.create(User, {
        email: dto.email,
        password_hash: dto.password,
      });
      const savedUser = await manager.save(user);

      // 2. 建 user_profile
      const profile = manager.create(UserProfile, {
        user_id: savedUser.id,
        name: dto.name,
        role: dto.role,
        status: dto.status,
      });
      await manager.save(profile);

      return {
        id: savedUser.id,
        email: savedUser.email,
        name: dto.name,
        role: dto.role,
        status: dto.status,
        createdAt: savedUser.createdAt,
      };
    });
  }

  // 更新用户（分别更新 user 和 profile 表）
  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 更新 user 表字段
    if (dto.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already registered');
      }
      user.email = dto.email;
    }
    if (dto.password) {
      // 更新密码时手动加密（@BeforeInsert 只在插入时触发，更新不会）
      user.password_hash = await bcrypt.hash(dto.password, 10);
    }
    await this.userRepository.save(user);

    // 更新 profile 表字段
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: id },
    });
    if (profile) {
      if (dto.name) profile.name = dto.name;
      if (dto.role) profile.role = dto.role;
      if (dto.status) profile.status = dto.status;
      await this.userProfileRepository.save(profile);
    }

    return { id, ...dto };
  }

  // 删除单个用户（先删 profile 再删 user）
  async removeUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userProfileRepository.delete({ user_id: id });
    await this.userRepository.delete(id);
    return { id };
  }

  // 批量删除
  async removeUsers(ids: number[]) {
    return this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserProfile)
        .where('user_id IN (:...ids)', { ids })
        .execute();

      const result = await manager.delete(User, ids);
      return { deleted: result.affected ?? 0 };
    });
  }
}
