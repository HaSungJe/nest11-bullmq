import sharp from 'sharp';

/**
 * 파일명 인코딩 체크
 * 
 * @param str 
 * @returns 
 */
export function isLatin1(str: string): boolean {
    const buffer = Buffer.from(str, 'latin1');
    return buffer.toString('latin1') === str;
}

/**
 * 파일의 메타데이터 얻기
 * 
 * @param buffer 
 */
export async function getFileMetaData(buffer: Buffer) {
    return await sharp(buffer).metadata();
}

/**
 * 이미지파일의 썸네일 생성
 * 
 * @param buffer 
 * @param width 
 * @param height 
 * @returns 
 */
export async function getFileImageThumnail(buffer: Buffer, width: number, height: number) {
    width = Math.round(width);
    height = Math.round(height);
    return await sharp(buffer).resize(width, height).toBuffer();
}