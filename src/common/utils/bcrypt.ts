import * as bcrypt from 'bcrypt';

/**
 * Bcrypt 암호화
 * 
 * @param {*} str 
 * @returns 
 */
export async function getBcrypt(str: string): Promise<string> {
    return await bcrypt.hash(process.env.BCRYPT_CODE + str, 13);
}

/**
 * Bcrypt 비교
 * 
 * @param {*} strA 
 * @param {*} strB 
 */
export async function matchBcrypt(strA: string, strB: string): Promise<boolean> {
    let match1 = await bcrypt.compare(process.env.BCRYPT_CODE + strA, strB);
    let match2 = await bcrypt.compare(process.env.BCRYPT_CODE + strB, strA);
    return match1 || match2;
}