import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WriteQueueRegistry } from './write-queue.registry';

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
            },
        }),
    ],
    providers: [WriteQueueRegistry],
    exports: [WriteQueueRegistry],
})
export class QueueModule {}
