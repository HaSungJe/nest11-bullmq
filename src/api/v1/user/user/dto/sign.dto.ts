import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Length, Matches } from "class-validator";

/**
 * 회원가입 Dto
 */
export class SignDto {
    @ApiProperty({description: '로그인 ID', required: true})
    @Matches(/^[a-zA-Z0-9]+$/, {message: '아이디는 영문 대소문자와 숫자만 사용 가능합니다.'})   
    @Length(4, 20, {message: '아이디는 4자 이상 20자 이하로 입력해주세요.'})
    @IsNotEmpty({message: '아이디를 입력해주세요.'})
    login_id: string;

    @ApiProperty({description: '로그인 PW', required: true})
    @Length(8, 20, {message: '비밀번호는 8자 이상 20자 이하로 입력해주세요.'})
    @IsNotEmpty({message: '비밀번호를 입력해주세요.'})
    login_pw: string;

    @ApiProperty({description: '로그인 PW 확인', required: true})
    @Length(8, 20, {message: '비밀번호는 8자 이상 20자 이하로 입력해주세요.'})
    @IsNotEmpty({message: '비밀번호 한번 더 입력해주세요.'})
    login_pw2: string;

    @ApiProperty({description: '이름', required: true})
    @Matches(/^[가-힣a-zA-Z]+$/, {message: '이름은 한글 또는 영문 대소문자만 사용 가능합니다.'})
    @Length(2, 30, {message: '이름은 2자 이상 30자 이하로 입력해주세요.'})
    @IsNotEmpty({message: '이름을 입력해주세요.'})
    name: string;

    @ApiProperty({description: '닉네임', required: true})
    @Matches(/^[가-힣a-zA-Z0-9]+$/, {message: '닉네임은 한글, 영문 대소문자, 숫자만 사용 가능합니다.'})
    @Length(2, 30, {message: '닉네임은 2자 이상 30자 이하로 입력해주세요.'})
    @IsNotEmpty({message: '닉네임을 입력해주세요.'})
    nickname: string;
}