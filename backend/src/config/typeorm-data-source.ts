import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import { UserProfile } from '../user/user-profile.entity';
import { Company } from '../company/company.entity';
import { Relationship } from '../company/relationship.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'devuser',
  password: process.env.DB_PASSWORD || 'devpass',
  database: process.env.DB_DATABASE || 'week1_env',
  entities: [User, UserProfile, Company, Relationship],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
});
