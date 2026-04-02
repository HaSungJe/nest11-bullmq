import { ApiProperty } from "@nestjs/swagger";

/**
 * 회원 목록
 */
export class AdminUserListVO {
    @ApiProperty({description: '회원 ID', required: true})
    user_id: string;

    @ApiProperty({description: '권한 ID', required: true})
	auth_id: string;

    @ApiProperty({description: '권한명', required: true})
	auth_name: string;

    @ApiProperty({description: '상태 ID', required: true})
	state_id: string;

    @ApiProperty({description: '상태명', required: true})
	state_name: string;

    @ApiProperty({description: '로그인 가능 여부(Y/N)', required: true})
	login_able_yn: 'Y' | 'N'; 

    @ApiProperty({description: '이름', required: true})
	name: string;

    @ApiProperty({description: '닉네임', required: true})
	nickname: string;

    @ApiProperty({description: '생성일', required: true})
	create_at: string;
}