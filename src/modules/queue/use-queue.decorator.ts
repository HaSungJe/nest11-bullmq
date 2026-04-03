import { isProcessingContext } from './queue-processing.context';
import type { WriteQueueRegistry } from './write-queue.registry';

let _registry: WriteQueueRegistry | null = null;

/**
 * @UseQueue 데코레이터가 적용된 consumerKey 목록 (클래스 로드 시점에 수집)
 * onModuleInit에서 큐 사전 생성에 사용
 */
const _registeredConsumerKeys = new Set<string>();

export const getRegisteredConsumerKeys = (): ReadonlySet<string> => _registeredConsumerKeys;

/**
 * WriteQueueRegistry 전역 싱글톤 등록
 * WriteQueueRegistry.onModuleInit()에서 호출
 */
export const setGlobalQueueRegistry = (r: WriteQueueRegistry): void => {
    _registry = r;
};

export const getGlobalQueueRegistry = (): WriteQueueRegistry | null => _registry;

/**
 * @UseQueue(consumerKey, jobKey)
 *
 * Service write 메서드에 붙이면 BullMQ를 통해 FIFO 처리됨.
 * 컨트롤러·서비스 호출 코드 변경 없이 투명하게 동작.
 *
 * @param consumerKey 큐(Worker) 식별자. 같은 키는 하나의 Worker가 직렬 처리.
 * @param jobKey      작업 식별자. Worker가 올바른 handler를 찾는 데 사용.
 *
 * ⚠️ 데코레이터 순서: @UseQueue를 반드시 @Transactional() 위에 배치
 *   @UseQueue(...)    ← 바깥 (먼저 실행)
 *   @Transactional()  ← 안쪽 (Worker 실행 시에만 동작)
 *   async method() {}
 */
export function UseQueue(consumerKey: string, jobKey: string) {
    _registeredConsumerKeys.add(consumerKey);

    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalFn = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Worker 처리 컨텍스트이면 원본 직접 실행 (@Transactional 포함)
            if (isProcessingContext()) {
                return originalFn.apply(this, args);
            }

            const registry = getGlobalQueueRegistry();
            if (!registry) {
                // 레지스트리 미초기화(테스트 등) 시 fallback — 직접 실행
                return originalFn.apply(this, args);
            }

            return registry.dispatch(consumerKey, jobKey, this, originalFn, args);
        };

        return descriptor;
    };
}
