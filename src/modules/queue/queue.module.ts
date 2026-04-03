import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { WriteQueueRegistry } from './write-queue.registry';

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: process.env.BULLMQ_REDIS_HOST || 'localhost',
                port: parseInt(process.env.BULLMQ_REDIS_PORT) || 6379,
            },
        }),
        BullBoardModule.forRoot({
            route: '/queues',
            adapter: ExpressAdapter,
        }),
    ],
    providers: [WriteQueueRegistry],
    exports: [WriteQueueRegistry],
})
export class QueueModule {}
