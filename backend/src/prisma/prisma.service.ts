import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    /**
     * Clean database for testing purposes
     * WARNING: Only use in test environment
     */
    async cleanDatabase() {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('cleanDatabase can only be used in test environment');
        }

        const models = Reflect.ownKeys(this).filter(
            (key) => key[0] !== '_' && key[0] !== '$' && typeof key === 'string',
        );

        return Promise.all(
            models.map((modelKey) => (this as any)[modelKey]?.deleteMany?.()),
        );
    }
}
