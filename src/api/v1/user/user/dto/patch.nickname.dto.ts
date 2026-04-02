import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Length, Matches } from "class-validator";

/**
 * 닉네임 변경 Dto
 */
export class PatchNicknameDto {
    @ApiProperty({description: '닉네임', required: true})
    @Matches(/^[가-힣a-zA-Z0-9]+$/, {message: '닉네임은 한글, 영문 대소문자, 숫자만 사용 가능합니다.'})
    @Length(2, 30, {message: '닉네임은 2자 이상 30자 이하로 입력해주세요.'})
    @IsNotEmpty({message: '닉네임을 입력해주세요.'})
    nickname: string;
}