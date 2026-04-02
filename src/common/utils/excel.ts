import { utils, write, read } from 'xlsx-js-style';
import { BadRequestException } from '@nestjs/common';

/**
 * 엑셀파일 생성
 * 
 * @param list 
 * @returns 
 */
export function createExcel(list: Array<object>) {
    let excel = utils.book_new();

    for (let i=0; i<list.length; i++) {
        let data = list[i];
        utils.book_append_sheet(excel, data['sheet'], data['name']);
    }

    return write(excel, {bookType: 'xlsx', type: 'base64'});
}

/**
 * 엑셀시트 생성
 * 
 * @param conf
 * @param list 
 * @returns 
 */
export function createSheet(conf: any, list: Array<any>) {
    try {
        const header_style = { 
            border: {
                bottom: {style: 'thin', color: '#000000'},
                top: {style: 'thin', color: '#000000'},
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
            },  
            alignment: { horizontal: "center", vertical: "center" }, 
            fill: {fgColor: {rgb: "E9E9E9"}}, 
            font: {bold: true, sz: 15},
        }
    
        const row_style = { 
            font: { color: { rgb: 188038} },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
            },
            
        }
    
        const row_style_last = {
            font: { color: { rgb: 188038} },
            alignment: { horizontal: "center", vertical: "center" }, 
            border: {
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
                bottom: {style: 'thin', color: '#000000'},
            }
        }
    
        let size_cols = [];
        let rows = [[]];
        let list_keys = list && list[0] ? Object.keys(list[0]) : [];
        let keys = conf.map((e) => {
            if (list_keys.includes(e.column)) {
                return e.column;
            }
        });
    
        for (let i=0; i<keys.length; i++) {
            if (keys[i]) {
                // 셀 너비, 높이조절
                size_cols.push({ wpx: 200}); 
        
                rows[0].push({
                    v: conf.find(e => e.column === keys[i])['memo'],
                    t: 's',
                    s: header_style
                });
            }
        }
    
        for (let i=0; i<list.length; i++) {
            let tmp_row = [];
            let row = list[i];
    
            let style = i < list.length-1 ? row_style : row_style_last;
    
            for (let i=0; i<keys.length; i++) {
                tmp_row.push({
                    v: row[keys[i]] ? row[keys[i]] : '',
                    t: 's',
                    s: style
                });
            }
    
            rows.push(tmp_row)
        }
    
        let sheet = utils.aoa_to_sheet(rows);
    
        // 셀 너비 조정
        sheet["!cols"] = size_cols;
    
        // 셀 높이 조절
        let size_rows = [{ hpx: 50}];
        for (let i=0; i<list.length; i++) {
            size_rows.push({ hpx: 25});
        }
        sheet["!rows"] = size_rows;
    
        return sheet;
    } catch (error) {
        return null;
    }
}

/**
 * 엑셀파일 읽기
 * 
 * @param file 
 */
export function readExcel(conf: any, file: Express.Multer.File) {
    try {
        let result = [];
        let excel = read(file.buffer, {type: 'buffer'});

        for (let i=0; i<excel.SheetNames.length; i++) {
            let sheetName = excel.SheetNames[i];
            let sheet = utils.sheet_to_json(excel.Sheets[sheetName], { raw: false, dateNF: 'yyyy-mm-dd' });
            
            for (let i=0; i<sheet.length; i++) {
                let obj = {};
                for (let y=0; y<conf.length; y++) {
                    let data = sheet[i][conf[y]['memo']];
                    if (data) {
                        const type = conf[y]['type'] ? conf[y]['type'] : null;
                        obj[conf[y]['column']] = data;
                    } 
                }
    
                result.push(obj);
            }
        }

        return { result };
    } catch (error) {
        throw new BadRequestException({message: '파일을 읽어오는데 실패하였습니다.'});
    }
}