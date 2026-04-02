import { ApiProperty } from "@nestjs/swagger";

/**
 * 로그인키 재발급 Dto
 */
export class RefreshDto {
    @ApiProperty({description: '로그인 RefreshToken', required: true})
    refresh_token: string;
}

/**
 * 로그인키 재발급 반환 Dto
 */
export class RefreshResultDto {
    @ApiProperty({description: '로그인 RefreshToken', required: true})
    refresh_token: string;

    @ApiProperty({description: '로그인 AccessToken', required: true})
    access_token: string;

    @ApiProperty({description: 'RefreshToken 만료기간', required: true})
    refresh_token_end_dt: Date;

    @ApiProperty({description: 'AccessToken 만료기간', required: true})
    access_token_end_dt: Date;
}