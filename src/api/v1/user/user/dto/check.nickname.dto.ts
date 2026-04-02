import { ApiProperty } from "@nestjs/swagger";

/**
 * 닉네임 중복 확인 Dto
 */
export class CheckNicknameDto {
    @ApiProperty({description: '닉네임', required: true})   
    nickname: string;
}