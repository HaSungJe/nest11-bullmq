import { AsyncLocalStorage } from 'async_hooks';

export const queueProcessingContext = new AsyncLocalStorage<boolean>();

/**
 * 현재 BullMQ Worker 처리 컨텍스트 여부 확인
 * @UseQueue 래퍼가 원본 함수를 직접 호출할지 enqueue할지 판단에 사용
 */
export const isProcessingContext = (): boolean =>
    queueProcessingContext.getStore() === true;
