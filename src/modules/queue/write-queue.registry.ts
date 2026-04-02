import { HttpException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { queueProcessingContext } from './queue-processing.context';
import { setGlobalQueueRegistry } from './use-queue.decorator';

interface JobHandler {
    serviceInstance: any;
    originalFn: Function;
}

interface ConsumerSet {
    queue: Queue;
    worker: Worker;
    queueEvents: QueueEvents;
    handlers: Map<string, JobHandler>;
}

@Injectable()
export class WriteQueueRegistry implements OnModuleInit, OnModuleDestroy {
    private readonly consumers = new Map<string, ConsumerSet>();
    private readonly connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
    };

    /**
     * 앱 시작 시 전역 싱글톤으로 등록
     * @UseQueue 데코레이터가 DI 없이 접근할 수 있도록 함
     */
    onModuleInit(): void {
        setGlobalQueueRegistry(this);
    }

    /**
     * consumerKey에 해당하는 ConsumerSet 반환.
     * 없으면 Queue + Worker + QueueEvents 생성.
     * jobKey → handler는 항상 갱신 (Worker 생성 후 추가도 가능, Map 참조 공유).
     */
    private getOrCreate(
        consumerKey: string,
        jobKey: string,
        serviceInstance: any,
        originalFn: Function,
    ): ConsumerSet {
        if (!this.consumers.has(consumerKey)) {
            const handlers = new Map<string, JobHandler>();
            const queue = new Queue(consumerKey, { connection: this.connection });
            const queueEvents = new QueueEvents(consumerKey, { connection: this.connection });

            const worker = new Worker(
                consumerKey,
                async (job) => {
                    const handler = handlers.get(job.name);
                    if (!handler) {
                        throw new Error(`[WriteQueueRegistry] No handler for job: ${job.name} in consumer: ${consumerKey}`);
                    }

                    try {
                        return await queueProcessingContext.run(true, () =>
                            handler.originalFn.apply(handler.serviceInstance, job.data.args),
                        );
                    } catch (e) {
                        // HttpException 정보를 returnValue로 보존
                        // (BullMQ failedReason은 문자열이라 status code 유실됨)
                        return {
                            __queueError: true,
                            status: e?.getStatus?.() ?? 500,
                            response: e?.getResponse?.() ?? { message: e.message },
                        };
                    }
                },
                {
                    connection: this.connection,
                    concurrency: 1,   // 같은 consumer 내 FIFO 직렬 보장
                },
            );

            this.consumers.set(consumerKey, { queue, worker, queueEvents, handlers });
        }

        // Worker 생성 후에도 handler 추가/갱신 가능 (Map 참조 공유)
        this.consumers.get(consumerKey).handlers.set(jobKey, { serviceInstance, originalFn });

        return this.consumers.get(consumerKey);
    }

    /**
     * job을 consumerKey 큐에 등록하고 완료까지 대기 후 결과 반환.
     * @UseQueue 데코레이터에서 호출됨.
     *
     * @param consumerKey  큐(Worker) 식별자
     * @param jobKey       작업 식별자 (job.name)
     * @param serviceInstance  서비스 인스턴스 (this 바인딩용)
     * @param originalFn   @Transactional 포함한 원본 함수
     * @param args         원본 함수 인수
     */
    async dispatch<T = any>(
        consumerKey: string,
        jobKey: string,
        serviceInstance: any,
        originalFn: Function,
        args: any[],
    ): Promise<T> {
        const { queue, queueEvents } = this.getOrCreate(consumerKey, jobKey, serviceInstance, originalFn);
        const job = await queue.add(jobKey, { args });
        const result = await job.waitUntilFinished(queueEvents);

        if (result?.__queueError) {
            throw new HttpException(result.response, result.status);
        }
        return result;
    }

    /**
     * 앱 종료 시 모든 Worker / QueueEvents / Queue graceful close
     */
    async onModuleDestroy(): Promise<void> {
        for (const { queue, worker, queueEvents } of this.consumers.values()) {
            await worker.close();
            await queueEvents.close();
            await queue.close();
        }
    }
}
