
import _ from "lodash";
import { CmdT, QueryContextI, SchemaT } from '../interface/CommonI';
import { IndexationTaskN } from './IndexationTask'
import * as conf from '../Config/MainConfig'
import e from "express";
import { db } from "./DBConnect";
import { fromLong } from "ip";


/** Система очередей */
export class IxEngineSys {

    ixSchema:Record<string, SchemaT> = {};

    // Данные таблица
    ixData:Record<number, Record<string, any>> = {};

    // Индексы
    ixLetter:Record<string, Uint32Array> = {};

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
    async find(sText:string, sCol:string):Promise<Record<number, number>>{
        
        const sTextLow = sText.toLowerCase();
        const ixFind:Record<number, number> = {}; // Результат

        // console.log('FIND LETTER:',this.ixLetter)
        // console.log('FIND DATA:',this.ixData)

        if(this.ixSchema[sCol] && this.ixSchema[sCol] == SchemaT.ix_string || this.ixSchema[sCol] == SchemaT.ix_text){

            const aFindText = this.encriptChunk(sText);

            // const ixLetterCol = this.ixLetter[sCol];

            const ixIndex:Record<number, number> = {};
            for (let c = 0; c < aFindText.length; c++) {
                const sFindText = aFindText[c];
                if (this.ixLetter[sCol+'--'+sFindText]){
                    const aIndex = this.ixLetter[sCol+'--'+sFindText];
                    // console.log('aIndex', aIndex);

                    const ixUniq:Record<number, boolean> = {};

                    console.log('<<<1>>>',sFindText, aIndex[0], aIndex)

                    for (let i = 0; i < aIndex[0]; i++) {
                        const idData = aIndex[i+4];

                        console.log('>>>', c, idData)

                        if (!ixIndex[idData] && c < 2){
                            ixIndex[idData] = 0;
                            // console.log('>>>',aIndex)
                        }

                        if(!ixUniq[idData]){
                            console.log('FIND UP IF:',ixIndex[idData],'>=', c - 2)
                            console.log('FIND DEL IF:', aFindText.length - c, '<= 2', aFindText.length - 2, '>', ixIndex[idData])
                            if (ixIndex[idData] >= c - 2){
                                ixIndex[idData]++;
                                ixUniq[idData] = true;
                            } else if (ixIndex[idData]) {
                                // console.log('delete', ixIndex[idData]);
                                delete ixIndex[idData];
                            }
                        }

                    }

                    console.log('ixIndex:',ixIndex);

                }
            }

            const aidIndexSort:number[] = [];
            for (const k in ixIndex) {
                const v = ixIndex[k];
                // console.log('FIND SORT FILTER:',v, '>=', aFindText.length);
                if (v >= aFindText.length - 2){
                    aidIndexSort.push(Number(k));
                }
            }

            const aidFindRaw = aidIndexSort;
            console.log('aidFindRaw:', aidFindRaw);

            // TODO тут забираются лишние данные повторно при втором match
            const aRowDB = await db('dt').whereIn('id', aidFindRaw).select();
            for (let i = 0; i < aRowDB.length; i++) {
                const vRowDB = aRowDB[i];
                this.ixData[vRowDB.id] = vRowDB;
            }

            // console.log('FIND this.ixData:',this.ixData);

            for (let i = 0; i < aidFindRaw.length; i++) {
                const idFindRaw = aidFindRaw[i];
                if(!idFindRaw) continue;

                const sWordLow = this.ixData[idFindRaw][sCol];

                // console.log(sTextLow, sTextLow.length, sWordLow, sWordLow.length);

                if (sTextLow.length == sWordLow.length && ixIndex[idFindRaw] == aFindText.length){
                    if (sTextLow == sWordLow){
                        if(!ixFind[idFindRaw]){
                            ixFind[idFindRaw] = 0;
                        }
                        ixFind[idFindRaw] += 3;
                    }
                } else {

                    // console.log(sTextLow, sTextLow.length, sWordLow, sWordLow.length);
                    if (sWordLow.indexOf(sTextLow) == 0){
                        if(!ixFind[idFindRaw]){
                            ixFind[idFindRaw] = 0;
                        }
                        ixFind[idFindRaw] += 2;
                    } else {
                        if(!ixFind[idFindRaw]){
                            ixFind[idFindRaw] = 0;
                        }
                        ixFind[idFindRaw] += 1;
                    }
                }

            }
        } else if(this.ixSchema[sCol] && this.ixSchema[sCol] == SchemaT.ix_enum) {
            const aidData = this.ixLetter[sCol+'--'+sTextLow];
            if(aidData){
                for (let i = 4; i < aidData[0]; i++) {
                    const idData = aidData[i];
                    ixFind[idData] = 3;
                }
            }
        } else if(sCol === 'id') {
            const aidData = this.ixLetter[sCol+'--'+sTextLow];
            if(aidData){
                for (let i = 4; i < aidData[0]; i++) {
                    const idData = aidData[i];
                    ixFind[idData] = 3;
                }
            }
        }

        // const asFindResult = _.concat(aEqLenLow,aMoreLenLowFirst,aMoreLenLow)

        console.log('find', ixFind);

        return ixFind;
    }

    /** Установить схему */
    async fSchema(ixData:Record<string, SchemaT>){
        this.ixSchema = ixData;
        await db.raw(`DROP TABLE IF EXISTS dt`);
        await db.raw(`DROP TABLE IF EXISTS ix`);

        console.log('Создание схемы')

        // Создание таблицы индекса
        await db.raw(`
            CREATE TABLE ix (
                id INT(11) NOT NULL AUTO_INCREMENT,
                k VARCHAR(50) NOT NULL DEFAULT '' COLLATE 'utf8mb4_bin',
                data LONGBLOB NULL DEFAULT '',
                PRIMARY KEY (id) USING BTREE,
                UNIQUE INDEX k (k) USING BTREE
            )
            COLLATE='utf8mb4_bin'
            ENGINE=InnoDB
        `);

        if (!await db.schema.hasTable('dt')) {
            await db.schema.createTable('dt', (table) => {
                table.increments('id');

                for (const k in ixData) {
                    const v = ixData[k];

                    if(v == SchemaT.int){
                        table.integer(k, 12)
                            .defaultTo(0)
                    }

                    if(v == SchemaT.num){
                        table.decimal(k, 2)
                            .defaultTo(0)
                    }

                    if(v == SchemaT.enum){
                        table.string(k, 50)
                            .defaultTo('')
                    }

                    if(v == SchemaT.ix_enum){
                        table.string(k, 50)
                            .defaultTo('')
                            .index(k)
                    }

                    if(v == SchemaT.ix_string){
                        table.string(k, 255)
                            .defaultTo('')
                            .index(k)
                    }

                    if(v == SchemaT.ix_text){
                        table.text(k, 'longtext')
                            .defaultTo('')
                            .index(k)
                    }

                    if(v == SchemaT.text){
                        table.text(k, 'longtext')
                            .defaultTo('')
                            .index(k)
                    }

                }
    
                table.comment('Данные индексв');
                table.collate('utf8_bin');
            });
        }
    }
    

    cnt = 0;
    cntCopy = 0;
    /** Индексация */
    async fIndexation(aData:any[]){
        this.ixData = {};
        const ixChunkLetterUse:Record<string, number[]> = {};
        const ixEnumUse:Record<string, number[]> = {};
        
        const aChunkIndex:Record<string, Record<string, number[]>> = {};

        const aChunkString:{}[] = [];

        const aidRow = aData.map(el => Number(el.id));
        const aRowDB = await db('dt').whereIn('id', aidRow).select();

        console.log('aRowDB:',aData,aidRow, aRowDB);
        

        // Сбор чанков и данных из БД
        for (let c = 0; c < aRowDB.length; c++) {
            const vRowDB = aRowDB[c];
            this.ixData[vRowDB.id] = vRowDB;

            const akData = Object.keys(vRowDB);

            // console.log(akData)
            for (let i = 0; i < akData.length; i++) {
                const kData = akData[i];

                // console.log(kData,':',this.ixSchema[kData], this.ixSchema[kData]);
                if(this.ixSchema[kData] == SchemaT.ix_enum){
                    aChunkString.push(kData+'--'+vRowDB[kData])
                }

                if(this.ixSchema[kData] == SchemaT.ix_string){
                    aChunkString.push(...this.encriptChunk(vRowDB[kData]).map((el) => kData+'--'+el));
                }
            }

        }

        // Сбор чанков из входных данных
        for (let c = 0; c < aData.length; c++) {
            const vRowInput = aData[c];

            const akData = Object.keys(vRowInput);

            for (let i = 0; i < akData.length; i++) {
                const kData = akData[i];
                if(this.ixSchema[kData] == SchemaT.ix_enum){
                    aChunkString.push(kData+'--'+vRowInput[kData])
                }

                if(this.ixSchema[kData] == SchemaT.ix_string){
                    aChunkString.push(...this.encriptChunk(vRowInput[kData]).map((el) => kData+'--'+el));
                }
            }
        }

        console.log('aChunkString>>>',aChunkString);

        this.ixLetter = {};
        if(aChunkString.length){
            const aIndexDB = await db('ix').whereIn('k', aChunkString).select();
            
            for (let i = 0; i < aIndexDB.length; i++) {
                const vIndexDb = aIndexDB[i];

                var arrayBuffer = new Uint8Array(vIndexDb.data).buffer;
                this.ixLetter[vIndexDb.k] = new Uint32Array(arrayBuffer, 0, arrayBuffer.byteLength/4); 
                // console.log(vIndexDb.k, this.ixLetter[vIndexDb.k])
            }
        }

        console.log('--->',this.ixLetter['username--о-л-ь']);

        // console.log('fIndexation.ixLetter', aChunkString);
        

        // ============================================================

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
                    const sUseEnum = IndexationTaskN.fIxEnum(this, idRow, sCol, String(vRow[sCol]));
                    // Не перезаписываем старые значения потому что они всегда равны сами себе
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

                        if(!ixEnumUse[sCol+'--'+sUseEnum]){
                            ixEnumUse[sCol+'--'+sUseEnum] = [];
                        }
                        ixEnumUse[sCol+'--'+sUseEnum].push(idRow);
                        
                    }
                    continue;
                } else {
                    // Назначить новое значение
                    this.ixData[idRow][sCol] = vRow[sCol];
                    continue;
                }

                if(vOldVal && vOldVal == vRow[sCol]){ // Если равно не производить
                    continue;
                }

                const aDataChunk = this.encriptChunk(vRow[sCol]);

                //  временно отключено
                if(vOldVal){ // Если есть старое значение чистим лишнее
                    const aOldChunk = this.encriptChunk(vOldVal);
                    const aDelChunk = _.difference(aOldChunk, aDataChunk);

                    console.log('DEL CHUNK',aDelChunk);

                    // const vLetterCol = this.ixLetter[sCol];
                    for (let i = 0; i < aDelChunk.length; i++) {
                        const sOldChunk = aDelChunk[i];
                        
                        if(this.ixLetter[sCol+'--'+sOldChunk]){

                            // delete vLetterCol[sOldChunk].ix[vRow.id];

                            // Помечаем чанк как использованный
    
                            if(!ixChunkLetterUse[sCol+'--'+sOldChunk]){
                                ixChunkLetterUse[sCol+'--'+sOldChunk] = [];
                            }
                            ixChunkLetterUse[sCol+'--'+sOldChunk].push(idRow);
                        }
                    }
                    
                }

                for (let i = 0; i < aDataChunk.length; i++) {
                    const sDataChunk = aDataChunk[i];
                    


                    if (!this.ixLetter[sCol+'--'+sDataChunk]){
                        this.ixLetter[sCol+'--'+sDataChunk] = new Uint32Array(100); // Индекс
                    }

                    // console.log(this.ixLetterIx[sCol][sDataChunk][vRow.id])

                    if(ixChunkLetterUse[sCol+'--'+sDataChunk] && ixChunkLetterUse[sCol+'--'+sDataChunk][vRow.id]){
                        delete ixChunkLetterUse[sCol+'--'+sDataChunk][vRow.id];
                        // if(!ixChunkLetterUse[sCol]){
                        //     ixChunkLetterUse[sCol] = {};
                        // }

                        // if(!ixChunkLetterUse[sCol][sDataChunk]){
                        //     ixChunkLetterUse[sCol][sDataChunk] = [];
                        // }
                        // ixChunkLetterUse[sCol][sDataChunk].push(idRow);
                        
                    }

                    // this.ixLetter[sCol][sDataChunk].list.push(vRow.id)
                    // this.ixLetter[sCol][sDataChunk].ix[vRow.id] = vRow.id;

                    const iDataLength = this.ixLetter[sCol+'--'+sDataChunk][0]; // текущее количество данных
                    if(iDataLength + 4 > this.ixLetter[sCol+'--'+sDataChunk].length){
                        this.ixLetter[sCol+'--'+sDataChunk] = new Uint32Array(this.ixLetter[sCol+'--'+sDataChunk], 0, this.ixLetter[sCol+'--'+sDataChunk].length * 2)
                    }

                    console.log('>>>:',sCol+'--'+sDataChunk, this.ixLetter[sCol+'--'+sDataChunk][0])
                    this.ixLetter[sCol+'--'+sDataChunk][iDataLength+4] = vRow.id;
                    this.ixLetter[sCol+'--'+sDataChunk][0]++;

                    this.cnt++;
                    if(this.cnt > 100000){
                        this.cnt = 0;
                        console.log('indexation_chunk',this.cnt, this.cntCopy++);
                    }

                }

            }

            
            

            // console.log(this.ixData[idRow]);
            await db('dt').insert(aData).onConflict().merge();

            // vUser.username;

        }

        // const akChunkUse = Object.keys(ixChunkUse);
        // ОЧИСТКА

        
        console.log('ОЧИСТКА1', ixChunkLetterUse);
        for (const kChunkUse in ixChunkLetterUse) {

            const aChunkRow = this.ixLetter[kChunkUse];
            const aiChunkRowUse = ixChunkLetterUse[kChunkUse];
            const ixChunkRowUse = _.keyBy(aiChunkRowUse);

            // console.log('ОЧИСТКА2', ixChunkRowUse, aChunkRow)
            
            const ixChunkRowNewUniq:Record<number, number> = {};
            for (let i = 0; i < aChunkRow[0]; i++) {
                const idChunkRow = aChunkRow[i+4];
                if(idChunkRow == 0) continue;
                if(!ixChunkRowUse[idChunkRow]){
                    ixChunkRowNewUniq[idChunkRow] = idChunkRow;
                }
            }


            const aChunkRowUniqNew = Object.values(ixChunkRowNewUniq)
            if(aChunkRowUniqNew.length == 0) {
                delete this.ixLetter[kChunkUse]
                await db('ix').where({'k':kChunkUse}).del();
                console.log('DEL:',kChunkUse)
            } else {

                // console.log('ixChunkRowNewUniq', ixChunkRowNewUniq);

                const aRowsNew = new Uint32Array(aChunkRow.length + 100);
                // console.log('ОЧИСТКА3', kColUse, kChunkUse, aChunkRowUniqNew, aRowsNew)
                
                aRowsNew[0] = 0;
                for (let i = 0; i < aChunkRowUniqNew.length; i++) {
                    const iChunkRowUniqNew = aChunkRowUniqNew[i];

                    aRowsNew[i+4] = iChunkRowUniqNew;
                    aRowsNew[0]++;
                    
                }
                
                this.ixLetter[kChunkUse] = aRowsNew;
                this.cnt++;
            }
                
            
        }

        // console.log('ОЧИСТКА10', this.ixLetter);

        // console.log('ОЧИСТКА ENUM1', ixEnumUse);
        for (const kEnumUse in ixEnumUse) {
            const aEnumRow = this.ixLetter[kEnumUse];
            const aiEnumRowUse = ixEnumUse[kEnumUse];
            const ixEnumRowUse = _.keyBy(aiEnumRowUse);

            // console.log('ОЧИСТКА ENUM2', ixEnumRowUse, aEnumRow)
            
            const ixEnumRowNewUniq:Record<number, number> = {};
            for (let i = 0; i < aEnumRow[0]; i++) {
                const idEnumRow = aEnumRow[i+4];
                if(idEnumRow == 0) continue;
                if(!ixEnumRowUse[idEnumRow]){
                    ixEnumRowNewUniq[idEnumRow] = idEnumRow;
                }
            }

            const aEnumRowUniqNew = Object.values(ixEnumRowNewUniq)
            if(aEnumRowUniqNew.length == 0) {
                delete this.ixLetter[kEnumUse]
                await db('ix').where({'k':kEnumUse}).del()
                console.log('DEL:',kEnumUse)
            } else {

                // console.log('ixChunkRowNewUniq ENUM', ixEnumRowNewUniq);

                const aRowsNew = new Uint32Array(aEnumRow.length + 100);
                // console.log('ОЧИСТКА ENUM3', kColUse, kEnumUse, aEnumRowUniqNew, aRowsNew)
                
                aRowsNew[0] = 0;
                for (let i = 0; i < aEnumRowUniqNew.length; i++) {
                    const iEnumRowUniqNew = aEnumRowUniqNew[i];

                    aRowsNew[i+4] = iEnumRowUniqNew;
                    aRowsNew[0]++;
                    
                }
                
                this.ixLetter[kEnumUse] = aRowsNew;
                this.cnt++;
            }
                
        }

        const aChunkIndexInsert = [];

        for (const k in this.ixLetter) {
   
            const aLetterRow = this.ixLetter[k];
            // console.log({
            //     k:k,
            //     data:Buffer.from(aLetterRow)
            // })
            aChunkIndexInsert.push({
                k:k,
                data:Buffer.from(aLetterRow.buffer)
            })
        }

        if(aChunkIndexInsert.length){
            await db('ix').insert(aChunkIndexInsert).onConflict().merge();
        }

        // console.log('ОЧИСТКА ENUM10', this.ixEnum);
        // for (const kColUse in ixChunkEnumUse) {
        //     const vEnumUse = ixChunkEnumUse[kColUse]
            
        //     for (const kEnumUse in vEnumUse) {
        //         this.ixEnum[kColUse][kEnumUse].list = Object.values(this.ixEnum[kColUse][kEnumUse].ix);
        //         this.cnt++;

        //         this.cntCopy += this.ixEnum[kColUse][kEnumUse].list.length;

        //         console.log('this.ixEnum',this.cnt, this.cntCopy);

        //         if(this.cnt % 10000 == 0){
        //             this.cntCopy = 0;
        //         }
                
        //     }
        // }
        process.stdout.write('.')

        // // Проверка содержимого индекса
        // for (const kColUse in this.ixLetter) {
        //     console.log('this.ixLetter:',kColUse,'>>',this.ixLetter[kColUse]);
        // }


        const memoryData = process.memoryUsage();

        const formatMemoryUsage = (data:any) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

        console.log('==============================')
        console.log(`${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`),
        console.log(`${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`),
        console.log(`${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`),
        console.log(`${formatMemoryUsage(memoryData.external)} -> V8 external memory`);
        console.log(Object.keys(this.ixData).length);
        console.log('==============================')
    }

    /** Получить количество записей по запросу */
    public count(query:QueryContextI):number {
        return Object.keys(this.ixData).length;
    }

    /** Очистка индекса */
    public truncate() {
        this.ixData = {};
        this.ixLetter = {};
    }

    /** run */
    public async search(query:QueryContextI) {

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

            } else if(sCmd == CmdT.in){ // WHERE
                if(!ixQuery[CmdT.in]){
                    ixQuery[CmdT.in] = [];
                }
                ixQuery[CmdT.in].push(aQuery)

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

        if(conf.common.env === 'dev'){
            console.log('ixQuery:',ixQuery);
        }
        

        const aResult:Record<number, number>[] = [];
        const ixResult:Record<string, number> = {};

        // ============================================
        // Обнуление внутреннего индекса;
        this.ixLetter = {};
        const aSearchIndex:string[] = [];
        // Заполнение поискового индекса
        if(ixQuery[CmdT.match]){
            
            for (let i = 0; i < ixQuery[CmdT.match].length; i++) {
                const aQuery = ixQuery[CmdT.match][i];

                const asChunk = this.encriptChunk(aQuery[2]);
                for (let j = 0; j < asChunk.length; j++) {
                    const sChunk = asChunk[j];
                    aSearchIndex.push(aQuery[1]+'--'+sChunk);
                }
            }
        }

        if(ixQuery[CmdT.in]){
            
            for (let i = 0; i < ixQuery[CmdT.in].length; i++) {
                const aQuery = ixQuery[CmdT.in][i];
                try {
                    aQuery[2] = JSON.parse(aQuery[2])
                } catch (error) {
                    aQuery[2] = [];
                }
                
                const sCol = aQuery[1];
                
                console.log(aQuery[2]);
                for (let j = 0; j < aQuery[2].length; j++) {
                    const valIn = aQuery[2][j];

                    aSearchIndex.push(sCol+'--'+valIn);
                }
            }

        }
        const aUniqSearchIndex = _.uniq(aSearchIndex);
        const aIndexDb = await db('ix').whereIn('k', aUniqSearchIndex);
        for (let i = 0; i < aIndexDb.length; i++) {
            const vIndexDb = aIndexDb[i];

            var arrayBuffer = new Uint8Array(vIndexDb.data).buffer;
            this.ixLetter[vIndexDb.k] = new Uint32Array(arrayBuffer, 0, arrayBuffer.byteLength/4); 
        }

        // ============================================

        // console.time('t');

        if(ixQuery[CmdT.match]){
            for (let i = 0; i < ixQuery[CmdT.match].length; i++) {
                const aQuery = ixQuery[CmdT.match][i];

                console.log('query:',aQuery.slice(2).join(' ').toLowerCase(), aQuery[1])
                aResult.push(await this.find(aQuery.slice(2).join(' ').toLowerCase(), aQuery[1]));
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
        } else if(ixQuery[CmdT.in]){ // Если match нет - мы берем выборку по id которые прямо указаны
            for (let i = 0; i < ixQuery[CmdT.in].length; i++) {
                const aQuery = ixQuery[CmdT.in][i];
                try {
                    aQuery[2] = JSON.parse(aQuery[2])
                } catch (error) {
                    aQuery[2] = [];
                }
                
                const sCol = aQuery[1];
                let aidInRow:number[] = [];
                
                console.log(aQuery[2]);
                for (let j = 0; j < aQuery[2].length; j++) {
                    const valIn = aQuery[2][j];

                    // Проверяем наличие значения
                    if(this.ixLetter[sCol+'--'+valIn]){
                        aidInRow.push(...this.ixLetter[sCol+'--'+valIn])
                    }
                }

                const ixInRow = _.keyBy(aidInRow);
                

                for (const kRes in ixInRow) {
                    const idData = Number(kRes);
                    
                    if(!ixResult[idData]){
                        ixResult[idData] = 1;
                    }
                }
            }
        } else {
            const aidData = Object.keys(this.ixData);
            for (let i = 0; i < aidData.length; i++) {
                const idData = aidData[i];
                ixResult[idData] = 1;
            }
        }

        // Обработка выборки по IN после match если он есть
        if(ixQuery[CmdT.in] && ixQuery[CmdT.match]){

            for (let i = 0; i < ixQuery[CmdT.in].length; i++) {
                const aQuery = ixQuery[CmdT.in][i];
                try {
                    aQuery[2] = JSON.parse(aQuery[2])
                } catch (error) {
                    aQuery[2] = [];
                }
                
                const sCol = aQuery[1];
                let aidInRow:number[] = [];
                
                console.log(aQuery[2]);
                for (let j = 0; j < aQuery[2].length; j++) {
                    const valIn = aQuery[2][j];

                    // Проверяем наличие значения
                    if(this.ixLetter[sCol][valIn]){
                        aidInRow.push(...this.ixLetter[sCol+'--'+valIn])
                    }
                }

                const ixInRow = _.keyBy(aidInRow);
                

                for (const kRes in ixResult) {
                    const idData = Number(kRes);
                    
                    if(!ixInRow[idData]){
                        delete ixResult[idData];
                    }
                }
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

        // console.timeEnd('t');

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

        if(conf.common.env === 'dev'){
            console.log('aOutData', aOutData);
        }

        const memoryData = process.memoryUsage();

        const formatMemoryUsage = (data:any) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
        console.log(`${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`),
        console.log(`${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`),
        console.log(`${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`),
        console.log(`${formatMemoryUsage(memoryData.external)} -> V8 external memory`);

        return aSortResult

    }
    
}