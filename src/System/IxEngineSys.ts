import _ from "lodash";
import { CmdT, QueryContextI, SchemaT } from '../interface/CommonI';


/** Система очередей */
export class IxEngineSys {

    ixSchema:Record<string, SchemaT> = {};

    // Данные таблица
    ixData:Record<number, Record<string, any>> = {};

    ixLetter:Record<string, Record<string, number[]>> = {};
    ixLetterIx:Record<string, Record<string, Record<number, number>>> = {};


    /** Кодирование информации по пользователю */
    encriptChunk(sWord: string): string[] {

        const sWordLow = sWord.toLowerCase()

        const ixEncript: Record<string, string> = {};

        for (let i = 0; i < sWordLow.length; i++) {
            const sChar = sWordLow[i];

            if (i === 0 || i === sWordLow.length - 1) {
                continue;
            }

            const sCharLeft = sWordLow[i - 1];
            const sCharRight = sWordLow[i + 1];

            // console.log(sCharLeft, sChar, sCharRight);

            const sCript = [sCharLeft, sChar, sCharRight].join('-');

            if(!ixEncript[sCript]){
                ixEncript[sCript] = sCript
            }
            
        }

        return Object.values(ixEncript);

    }

    /** find fulltext */
    find(sText:string, sCol:string):Record<number, number>{
        const aFindText = this.encriptChunk(sText);
        const sTextLow = sText.toLowerCase();

        console.log('find>>>', sTextLow, sCol);

        const ixLetterCol = this.ixLetter[sCol];

        const ixIndex:Record<number, number> = {};
        for (let c = 0; c < aFindText.length; c++) {
            const sFindText = aFindText[c];
            if (ixLetterCol[sFindText]){
                const aIndex = ixLetterCol[sFindText];
                // console.log('aIndex', aIndex);

                const ixUniq:Record<number, boolean> = {};

                for (let i = 0; i < aIndex.length; i++) {
                    const idData = aIndex[i];

                    if (!ixIndex[idData] && c == 0){
                        ixIndex[idData] = 0;
                    }

                    if(!ixUniq[idData]){
                        if (ixIndex[idData] >= c){
                            ixIndex[idData]++;
                            ixUniq[idData] = true;
                        } else if (ixIndex[idData]) {
                            console.log('delete', ixIndex[idData]);
                            delete ixIndex[idData];
                        }
                    }

                }

                // console.log(ixIndex);

            }
        }

        const aIndexSort:number[] = [];
        for (const k in ixIndex) {
            const v = ixIndex[k];
            if (v >= aFindText.length){
                aIndexSort.push(Number(k));
            }
        }

        const aFindLoginRaw = aIndexSort;

        // console.log('aFindLoginRaw', aFindLoginRaw);

        // const aEqLen = []
        // const aEqLenLow = [];
        const aMoreLenLowFirst = [];
        const aMoreLenLow = [];
        const ixFind:Record<number, number> = {};
        for (let i = 0; i < aFindLoginRaw.length; i++) {
            const idFindLoginRaw = aFindLoginRaw[i];

            const sWordLow = this.ixData[idFindLoginRaw][sCol];

            // console.log(sTextLow, sTextLow.length, sWordLow, sWordLow.length);

            if (sTextLow.length == sWordLow.length){
                if (sTextLow == sWordLow){
                    if(!ixFind[idFindLoginRaw]){
                        ixFind[idFindLoginRaw] = 0;
                    }
                    ixFind[idFindLoginRaw] += 3;
                }
            } else {
                if (sWordLow.indexOf(sTextLow) == 0){
                    if(!ixFind[idFindLoginRaw]){
                        ixFind[idFindLoginRaw] = 0;
                    }
                    ixFind[idFindLoginRaw] += 2;
                } else {
                    if(!ixFind[idFindLoginRaw]){
                        ixFind[idFindLoginRaw] = 0;
                    }
                    ixFind[idFindLoginRaw] += 1;
                }
            }

        }

        // const asFindResult = _.concat(aEqLenLow,aMoreLenLowFirst,aMoreLenLow)

        // console.log('find', asFindResult);

        return ixFind;
    }

    /** Установить схему */
    fSchema(ixData:Record<string, SchemaT>){
        this.ixSchema = ixData;
    }
    

    cnt = 0;
    cntCopy = 0;
    /** Индексация */
    fIndexation(aData:any[]){

        // console.log(aData)

        // const ixOldDataChunk:Record<string, Record<string, Record<number, number>>> = {};

        const ixChunkUse:Record<string, Record<string, number>> = {};
        

        for (let c = 0; c < aData.length; c++) {
            const vRow = aData[c];

            const idRow = vRow.id;

            if (!this.ixData[idRow]){
                this.ixData[idRow] = {};
            }

            // console.log('row', vRow)

            const akData = Object.keys(vRow);

            for (let i = 0; i < akData.length; i++) {
                const sCol = akData[i];

                // console.log('indexation', sCol)
                
                if ('id' == sCol){
                    continue;
                }

                // Получить старое значение
                let vOldVal = null;

                if(this.ixSchema[sCol] && this.ixSchema[sCol] == SchemaT.ix_string || this.ixSchema[sCol] == SchemaT.ix_text){
                    // Назначить новое значение
                    vOldVal = this.ixData[idRow][sCol];

                    vRow[sCol] = vRow[sCol].toLowerCase();
                    this.ixData[idRow][sCol] = vRow[sCol];
                } else {
                    // Назначить новое значение
                    this.ixData[idRow][sCol] = vRow[sCol];
                    continue;
                }

                // TODO тут можно оптимизировать бесполезное удаление и бесполезную индексацию при повторной индексации того же самого
                if(vOldVal && vOldVal == vRow[sCol]){ // Если равно не производить
                    continue;
                }

                const aDataChunk = this.encriptChunk(vRow[sCol]);

                if(vOldVal){ // Если есть старое значение чистим лишнее
                    const aOldChunk = this.encriptChunk(vOldVal);
                    const aDelChunk = _.difference(aOldChunk, aDataChunk);

                    const vLetterCol = this.ixLetterIx[sCol];
                    for (let i = 0; i < aDelChunk.length; i++) {
                        const sOldChunk = aDelChunk[i];
                        
                        if(vLetterCol && vLetterCol[sOldChunk] && vLetterCol[sOldChunk][vRow.id]){
                            delete vLetterCol[sOldChunk][vRow.id];
                        }
                    }
                    
                }

                for (let i = 0; i < aDataChunk.length; i++) {
                    const sDataChunk = aDataChunk[i];

                    if (!this.ixLetterIx[sCol]){
                        this.ixLetter[sCol] = {};
                        this.ixLetterIx[sCol] = {};
                    }

                    if (!this.ixLetterIx[sCol][sDataChunk]){
                        this.ixLetter[sCol][sDataChunk] = []; // Индекс
                        this.ixLetterIx[sCol][sDataChunk] = {}; // Индекс
                    }

                    // console.log(this.ixLetterIx[sCol][sDataChunk][vRow.id])

                    if(this.ixLetterIx[sCol][sDataChunk][vRow.id]){

                        if(!ixChunkUse[sCol]){
                            ixChunkUse[sCol] = {};
                        }

                        if(!ixChunkUse[sCol][sDataChunk]){
                            ixChunkUse[sCol][sDataChunk] = 0;
                        }
                        ixChunkUse[sCol][sDataChunk]++;
                        
                    }

                    this.ixLetter[sCol][sDataChunk].push(vRow.id)
                    this.ixLetterIx[sCol][sDataChunk][vRow.id] = vRow.id;

                    this.cnt++;
                    if(this.cntCopy++ > 100000){
                        this.cntCopy = 0;
                        console.log('this.ixLetter',this.cnt, this.cntCopy);
                    }

                }
                
            }

            // vUser.username;

        }

        // const akChunkUse = Object.keys(ixChunkUse);
        for (const kColUse in ixChunkUse) {
            const vChunkUse = ixChunkUse[kColUse]
            
            for (const kChunkUse in vChunkUse) {
                this.ixLetter[kColUse][kChunkUse] = Object.values(this.ixLetterIx[kColUse][kChunkUse]);
                this.cnt++;

                this.cntCopy += this.ixLetter[kColUse][kChunkUse].length;

                console.log('this.ixLetter',this.cnt, this.cntCopy);

                if(this.cnt % 10000 == 0){
                    this.cntCopy = 0;
                }
                
            }
        }
        process.stdout.write('.')

        
    }

    /** Получить количество записей по запросу */
    public async count(query:QueryContextI) {
    }

    /** run */
    public async search(query:QueryContextI) {

        const ixQuery:Record<CmdT, any[]> = <any>{};

        for (let i = 0; i < query.query.length; i++) {
            let sQuery = query.query[i];
            
            sQuery = sQuery.replace('\s+', ' ');
            const aQuery = sQuery.split(' ');

            const sCmd = aQuery[0];

            if(sCmd == CmdT.match){ // MATCH
                if(!ixQuery[CmdT.match]){
                    ixQuery[CmdT.match] = [];
                }
                ixQuery[CmdT.match].push(aQuery)

            } else if(sCmd == CmdT.limit){ // LIMIT
                ixQuery[CmdT.limit] = aQuery;

            } else if(sCmd == CmdT.where){ // WHERE
                if(!ixQuery[CmdT.where]){
                    ixQuery[CmdT.where] = [];
                }
                ixQuery[CmdT.where].push(aQuery)

            } else if(sCmd == CmdT.count){ // COUNT
                if(!ixQuery[CmdT.count]){
                    ixQuery[CmdT.count] = [];
                }
                ixQuery[CmdT.count].push(aQuery)
            }
        }

        console.log('ixQuery:',ixQuery);
        

        const aResult:Record<number, number>[] = [];
        const ixResult:Record<string, number> = {};

        console.time('t');

        if(ixQuery[CmdT.match]){
            for (let i = 0; i < ixQuery[CmdT.match].length; i++) {
                const aQuery = ixQuery[CmdT.match][i];

                console.log('query:',aQuery.slice(2).join(' ').toLowerCase(), aQuery[1])
                aResult.push(this.find(aQuery.slice(2).join(' ').toLowerCase(), aQuery[1]));
            }
        }
        

        // console.log('result:', aResult[0]);
        for (let i = 0; i < aResult.length; i++) {
            const vResult = aResult[i];

            for (const kRes in vResult) {
                const vRes = vResult[kRes];

                if (!ixResult[kRes]){
                    ixResult[kRes] = 0;
                }
                ixResult[kRes]+=vRes;
            }
        }

        const aResultPair = Object.entries(ixResult);
        if(ixQuery[CmdT.where]){

            
            for (const kRes in ixResult) {
                const idData = Number(kRes);
                const vRow = this.ixData[idData];

                console.log('WHERE', kRes, idData, vRow);

                for (let i = 0; i < ixQuery[CmdT.where].length; i++) {
                    const aCmd = ixQuery[CmdT.where][i];

                    console.log(aCmd);
                    if(aCmd[2] == '='){
                        if(vRow[aCmd[1]] != Number(aCmd[3])){
                            delete ixResult[idData];
                        }
                    }
                }
            }
        }

        let aSortResult = Object.entries(ixResult).sort((a,b) => b[1] - a[1]).map(el => el[0])

        if(ixQuery[CmdT.limit]){
            aSortResult = aSortResult.slice(0, Number(ixQuery[CmdT.limit][1]) || 10);
        }


        // for (const kRes in result) {
        //     const vRes = result[kRes];

        //     for (let i = 0; i < vRes.list_eq.length; i++) {
        //         const idData = vRes.list_eq[i];
        //         if (!ixResult[idData]){
        //             ixResult[idData] = 0;
        //         }

        //         ixResult[idData] += 3;
        //     }

        //     for (let i = 0; i < vRes.list_first.length; i++) {
        //         const idData = vRes.list_first[i];
        //         if (!ixResult[idData]){
        //             ixResult[idData] = 0;
        //         }

        //         ixResult[idData] += 2;
        //     }

        //     for (let i = 0; i < vRes.list_more.length; i++) {
        //         const idData = vRes.list_more[i];
        //         if (!ixResult[idData]){
        //             ixResult[idData] = 0;
        //         }

        //         ixResult[idData] += 1;
        //     }
        // }

        

        // console.log('ixResult:', );

        // const ixSort:Record<string, number[]> = {};
        // for (const kRes in ixResult) {
        //     const iVal = ixResult[kRes];

        //     if (!ixSort[iVal]){
        //         ixSort[iVal] = [];
        //     }

        //     ixSort[iVal].push(Number(kRes));
        // }

        // const akSort = Object.keys(ixSort).map((el) => Number(el)).sort((a,b) => a - b);
        // for (let index = 0; index < array.length; index++) {
        //     const element = array[index];
            
        // }

        // console.log('ixSort:', _.orderBy(Object.entries(ixSort), ['0'],['desc']));

        // const aOut = _.concat(Object.values(ixSort));

        console.timeEnd('t');

        // console.log(ixData);

        const aOutData = [];
        for (let i = 0; i < aSortResult.length; i++) {
            const idData = Number(aSortResult[i]);

            if (this.ixData[idData]){
                const aLineData = [];
                aOutData.push([idData, ixResult[idData], this.ixData[idData]]);
            } else {
                console.log('Не найден:', idData);
            }
        }

        console.log('aOutData', aOutData);


    }
    
}