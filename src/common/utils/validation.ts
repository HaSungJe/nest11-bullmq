import { ValidationErrorDto } from '@root/common/dto/global.result.dto';

/**
 * Create Custom Class-Validation Reject Error
 * - 유효성 검사 커스텀 생성
 * 
 * @param property 
 * @param message 
 * @returns 
 */
export function createValidationError(property: string, message: string): Array<ValidationErrorDto> {
    return [{type: 'isBoolean', property, message}];
}