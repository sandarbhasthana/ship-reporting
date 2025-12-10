import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@ship-reporting/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool | null = null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const isAccelerate = connectionString?.startsWith('prisma+postgres://');

    if (isAccelerate && connectionString) {
      // Use Prisma Accelerate - pass accelerateUrl explicitly
      super({
        accelerateUrl: connectionString,
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
      });
    } else {
      // Use direct PostgreSQL connection with pg adapter
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);

      super({
        adapter,
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
      });

      this.pool = pool;
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (this.pool) {
      await this.pool.end();
    }
  }
}
