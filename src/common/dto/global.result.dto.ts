import { ApiProperty } from "@nestjs/swagger";

/**
 * 유효성검사 오류 DTO
 */
export class ValidationErrorDto {
    @ApiProperty({description: '유효성검사 반려 종류'})
    type: string;

    @ApiProperty({description: '유효성검사 반려 대상'})
    property: string;

    @ApiProperty({description: '유효성검사 반려 메시지'})
    message: string;
}

/**
 * API 요청 실패 반환 - 400
 */
export class ApiBadRequestResultDto {
    @ApiProperty({ description: '메세지', required: true })
    message: string;

    @ApiProperty({ description: '에러 목록', isArray: true, type: () => ValidationErrorDto, required: false })
    validationErrors?: Array<ValidationErrorDto>;
}

/**
 * API 요청 실패 반환 - 400 포함 모든 에러상황
 */
export class ApiFailResultDto {
    @ApiProperty({ description: '메세지', required: true })
    message: string;
}