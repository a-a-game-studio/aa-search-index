import _ from "lodash";
import { CmdT, QueryContextI, SchemaT } from '../interface/CommonI';
import { IndexationTaskN } from './IndexationTask'


/** Система очередей */
export class IxEngineSys {

    ixSchema:Record<string, SchemaT> = {};

    // Данные таблица
    ixData:Record<number, Record<string, any>> = {};

    // Индексы
    ixLetter:Record<string, Record<string, number[]>> = {};
    ixLetterIx:Record<string, Record<string, Record<number, number>>> = {};

    ixEnum:Record<string, Record<string, { list:number[]; ix:Record<number, number>} >> = {};


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
        
        const sTextLow = sText.toLowerCase();
        const ixFind:Record<number, number> = {}; // Результат


        console.log('find>>>', sTextLow, sCol);

        if(this.ixSchema[sCol] && this.ixSchema[sCol] == SchemaT.ix_string || this.ixSchema[sCol] == SchemaT.ix_text){

            const aFindText = this.encriptChunk(sText);

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
        } else if(this.ixSchema[sCol] && this.ixSchema[sCol] == SchemaT.ix_enum) {
            const aidData = this.ixEnum[sCol][sTextLow].list;
            for (let i = 0; i < aidData.length; i++) {
                const idData = aidData[i];
                ixFind[idData] = 3;
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

        const ixChunkLetterUse:Record<string, Record<string, number>> = {};
        const ixChunkEnumUse:Record<string, Record<string, number>> = {};
        

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
                    // IX TEXT STRING
                    // Назначить новое значение
                    vOldVal = this.ixData[idRow][sCol];

                    vRow[sCol] = vRow[sCol].toLowerCase();
                    this.ixData[idRow][sCol] = vRow[sCol];
                } else if(this.ixSchema[sCol] && this.ixSchema[sCol] == SchemaT.ix_enum) {
                    const sUseEnum = IndexationTaskN.fIxEnum(this, idRow, sCol, vRow[sCol]);
                    if(sUseEnum){
                        ixChunkEnumUse[sCol][sUseEnum];
                    }
                    continue;
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

                        if(!ixChunkLetterUse[sCol]){
                            ixChunkLetterUse[sCol] = {};
                        }

                        if(!ixChunkLetterUse[sCol][sDataChunk]){
                            ixChunkLetterUse[sCol][sDataChunk] = 0;
                        }
                        ixChunkLetterUse[sCol][sDataChunk]++;
                        
                    }

                    this.ixLetter[sCol][sDataChunk].push(vRow.id)
                    this.ixLetterIx[sCol][sDataChunk][vRow.id] = vRow.id;

                    this.cnt++;
                    if(this.cntCopy++ > 100000){
                        this.cntCopy = 0;
                        console.log('indexation_chunk',this.cnt, this.cntCopy);
                    }

                }
                
            }

            // vUser.username;

        }

        // const akChunkUse = Object.keys(ixChunkUse);
        for (const kColUse in ixChunkLetterUse) {
            const vChunkUse = ixChunkLetterUse[kColUse]
            
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
        for (const kColUse in ixChunkEnumUse) {
            const vEnumUse = ixChunkEnumUse[kColUse]
            
            for (const kEnumUse in vEnumUse) {
                this.ixEnum[kColUse][kEnumUse].list = Object.values(this.ixEnum[kColUse][kEnumUse].ix);
                this.cnt++;

                this.cntCopy += this.ixEnum[kColUse][kEnumUse].list.length;

                console.log('this.ixEnum',this.cnt, this.cntCopy);

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
    public search(query:QueryContextI) {

        const ixQuery:Record<CmdT, any[]> = <any>{};

        for (let i = 0; i < query.query.length; i++) {
            let aQuery = query.query[i].map(el => el.trim());

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

            // Сборка значений поиска
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
        } else {
            const aidData = Object.keys(this.ixData);
            for (let i = 0; i < aidData.length; i++) {
                const idData = aidData[i];
                ixResult[idData] = 1;
            }
        }

        
        // console.log('result:', aResult[0]);
        
        if(ixQuery[CmdT.where]){

            
            for (const kRes in ixResult) {
                const idData = Number(kRes);
                const vRow = this.ixData[idData];

                // console.log('WHERE', kRes, idData, vRow);

                for (let i = 0; i < ixQuery[CmdT.where].length; i++) {
                    const aCmd = ixQuery[CmdT.where][i];

                    // console.log(aCmd);
                    if(aCmd[2] == '='){
                        if(vRow[aCmd[1]] != Number(aCmd[3])){
                            delete ixResult[idData];
                        }
                    } else if(aCmd[2] == '>'){
                        if(vRow[aCmd[1]] <= Number(aCmd[3])){
                            delete ixResult[idData];
                        }
                    } else if(aCmd[2] == '>='){
                        if(vRow[aCmd[1]] < Number(aCmd[3])){
                            delete ixResult[idData];
                        }
                    } else if(aCmd[2] == '<'){
                        if(vRow[aCmd[1]] >= Number(aCmd[3])){
                            delete ixResult[idData];
                        }
                    } else if(aCmd[2] == '<='){
                        if(vRow[aCmd[1]] > Number(aCmd[3])){
                            delete ixResult[idData];
                        }
                    }
                }
            }
        }

        let aSortResult = Object.entries(ixResult).sort((a,b) => b[1] - a[1]).map(el => Number(el[0]))

        if(ixQuery[CmdT.limit]){
            aSortResult = aSortResult.slice(0, Number(ixQuery[CmdT.limit][1]) || 10);
        }

        console.timeEnd('t');

        // ========================================

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

        return aSortResult

    }
    
}