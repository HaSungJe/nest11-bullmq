import { HttpException, HttpStatus, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { InjectBullBoard } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import type { createBullBoard } from '@bull-board/api';
import { queueProcessingContext } from './queue-processing.context';
import { setGlobalQueueRegistry, getRegisteredConsumerKeys } from './use-queue.decorator';

type BullBoardInstance = ReturnType<typeof createBullBoard>;

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
        host: process.env.BULLMQ_REDIS_HOST || 'localhost',
        port: parseInt(process.env.BULLMQ_REDIS_PORT) || 6379,
    };

    constructor(
        @InjectBullBoard() private readonly boardServer: BullBoardInstance,
    ) {}

    /**
     * 앱 시작 시 전역 싱글톤 등록 + @UseQueue가 선언된 모든 consumerKey의 큐를 사전 생성.
     * 서버 시작 직후 bull-board에서 이전 이력을 바로 확인할 수 있도록 함.
     */
    async onModuleInit(): Promise<void> {
        setGlobalQueueRegistry(this);
        for (const consumerKey of getRegisteredConsumerKeys()) {
            await this.ensureConsumer(consumerKey);
        }
    }

    /**
     * consumerKey에 해당하는 ConsumerSet 반환.
     * 없으면 Queue + Worker + QueueEvents 생성.
     * QueueEvents는 waitUntilReady()로 연결 완료를 보장한 뒤 반환.
     * jobKey → handler는 항상 갱신 (Worker 생성 후 추가도 가능, Map 참조 공유).
     */
    /**
     * consumerKey에 해당하는 ConsumerSet이 없으면 생성 후 bull-board에 등록.
     * onModuleInit(사전 생성)과 dispatch(지연 생성 fallback) 양쪽에서 호출.
     */
    private async ensureConsumer(consumerKey: string): Promise<void> {
        if (this.consumers.has(consumerKey)) return;

        const handlers = new Map<string, JobHandler>();
        const queue = new Queue(consumerKey, { connection: this.connection });
        const queueEvents = new QueueEvents(consumerKey, { connection: this.connection });

        // 큐에서 job을 꺼내 순차적으로 실행하는 곳 (concurrency:1 → FIFO 보장)
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
                    // 에러 정보를 JSON으로 직렬화 후 throw → job "실패" 처리
                    // dispatch()에서 역직렬화 후 원본 HttpException 재현
                    const status = e?.getStatus?.() ?? 500;
                    const response = e?.getResponse?.() ?? { message: e.message };
                    throw new Error(JSON.stringify({ status, response }));
                }
            },
            {
                connection: this.connection,
                concurrency: 1,   // 같은 consumer 내 FIFO 직렬 보장
            },
        );

        // QueueEvents가 Redis에 완전히 연결된 후 job을 추가해야
        // waitUntilFinished에서 completion 이벤트를 놓치지 않음
        await queueEvents.waitUntilReady();

        // Bull-board에 큐 등록 — 대시보드에서 이력 확인 가능
        this.boardServer.addQueue(new BullMQAdapter(queue));

        this.consumers.set(consumerKey, { queue, worker, queueEvents, handlers });
    }

    private async getOrCreate(
        consumerKey: string,
        jobKey: string,
        serviceInstance: any,
        originalFn: Function,
    ): Promise<ConsumerSet> {
        await this.ensureConsumer(consumerKey);

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
        try {
            const { queue, queueEvents } = await this.getOrCreate(consumerKey, jobKey, serviceInstance, originalFn);
            const job = await queue.add(jobKey, { args }, {
                removeOnComplete: { count: 100 },  // 완료 job 최대 100개 보존
                removeOnFail: { count: 100 },       // 실패 job 최대 100개 보존
            });
            return await job.waitUntilFinished(queueEvents);
        } catch (e) {
            // Worker에서 직렬화한 HttpException 정보 복원
            try {
                const { status, response } = JSON.parse(e.message);
                throw new HttpException(response, status);
            } catch (parseError) {
                // HttpException은 그대로 re-throw
                if (parseError instanceof HttpException) throw parseError;
                // JSON 파싱 실패 = BullMQ 인프라 에러 (Redis 연결 실패 등)
                console.error(`[WriteQueueRegistry] dispatch error - consumer: ${consumerKey}, job: ${jobKey}`, e);
                throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
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
