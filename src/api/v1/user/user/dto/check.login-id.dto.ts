import { ApiProperty } from "@nestjs/swagger";

/**
 * 아이디 중복 확인 Dto
 */
export class CheckLoginIdDto {
    @ApiProperty({description: '로그인 아이디', required: true})
    login_id: string;
}