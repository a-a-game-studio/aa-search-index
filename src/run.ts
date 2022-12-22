
import _ from 'lodash';

import { db } from './System/DBConnect';


/** Кодирование информации по пользователю */
function encriptChunk(sWord: string): string[] {

    const aEncript: string[] = [];

    for (let i = 0; i < sWord.length; i++) {
        const sChar = sWord[i];

        if (i === 0 || i === sWord.length - 1) {
            continue;
        }

        const sCharLeft = sWord[i - 1];
        const sCharRight = sWord[i + 1];

        // console.log(sCharLeft, sChar, sCharRight);

        const sCript = [sCharLeft, sChar, sCharRight].join('-');

        aEncript.push(sCript);
    }


    return aEncript;

}

const ixData:Record<string, Record<number, { n:string, nl:string }>> = {};
const ixLetter:Record<string, Record<string, number[]>> = {};

interface FindI{
    list_eq:number[];
    list_first:number[];
    list_more:number[];
}


/** find */
function find(sText:string, sCol:string):Record<number, number>{
    const aFindText = encriptChunk(sText.toLowerCase());
    const sTextLow = sText.toLowerCase();

    const ixDataCol = ixData[sCol];
    const ixLetterCol = ixLetter[sCol];

    const ixIndex:Record<number, number> = {};
    for (let c = 0; c < aFindText.length; c++) {
        const sFindText = aFindText[c];
        if (ixLetterCol[sFindText]){
            const aIndex = ixLetterCol[sFindText];
            console.log('aIndex', aIndex);

            for (let i = 0; i < aIndex.length; i++) {
                const idData = aIndex[i];
                if (!ixIndex[idData] && c == 0){
                    ixIndex[idData] = 0;
                }

                if (ixIndex[idData] >= c){
                    ixIndex[idData]++;
                } else if (ixIndex[idData]) {
                    console.log('delete', ixIndex[idData]);
                    delete ixIndex[idData];
                }

                // if(ixIndex[idData] >= c){

                // } else {
                //     delete ixIndex[idData];
                // }

            }

            console.log(ixIndex);

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

    console.log('aFindLoginRaw', aFindLoginRaw);

    // const aEqLen = []
    // const aEqLenLow = [];
    const aMoreLenLowFirst = [];
    const aMoreLenLow = [];
    const ixFind:Record<number, number> = {};
    for (let i = 0; i < aFindLoginRaw.length; i++) {
        const idFindLoginRaw = aFindLoginRaw[i];

        const sLowWord = ixDataCol[idFindLoginRaw].nl;

        if (sTextLow.length == sLowWord.length){
            if (sTextLow == sLowWord){
                if(!ixFind[idFindLoginRaw]){
                    ixFind[idFindLoginRaw] = 0;
                }
                ixFind[idFindLoginRaw] += 3;
            }
        } else {
            if (sLowWord.indexOf(sTextLow) == 0){
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

/** сортировка */
function fSorting(sCol:string, aidData:number[]){

}

/** indexation */
function fIndexation(id:string, aData:any[]){
    for (let c = 0; c < aData.length; c++) {
        const vRow = aData[c];

        const akData = Object.keys(vRow);

        for (let i = 0; i < akData.length; i++) {
            const sCol = akData[i];

            if (id != sCol){

                if (!ixData[sCol]){
                    ixData[sCol] = {};
                }

                ixData[sCol][vRow[id]] = {
                    n:vRow[sCol],
                    nl:vRow[sCol].toLowerCase(),
                };

                const aDataChunk = _.uniq(encriptChunk(vRow[sCol].toLowerCase()));

                for (let i = 0; i < aDataChunk.length; i++) {
                    const sLoginChunk = aDataChunk[i];

                    if (!ixLetter[sCol]){
                        ixLetter[sCol] = {};
                    }

                    if (!ixLetter[sCol][sLoginChunk]){
                        ixLetter[sCol][sLoginChunk] = []; // Индекс
                    }

                    ixLetter[sCol][sLoginChunk].push(vRow.user_id);
                }
            }
        }

        // vUser.username;


    }
}

const cnt = 0;
/** run */
async function run(){
    const aUser = await db('phpbb_users').select('user_id', 'username', 'user_fullname', 'user_mobile')
        .limit(1000)
        .orderBy('user_id', 'asc');

    fIndexation('user_id', aUser);

    // console.log('ixData', ixData);
    // =====================================
    // Запрос писать тут лимит 100000(не все пользователи)
    // =====================================
    const aResult:Record<number, number>[] = [];
    const ixResult:Record<string, number> = {};

    console.time('t');
    for (let i = 0; i < 1; i++) {
        aResult.push(find('Ольга'.toLowerCase(), 'username'));
        aResult.push(find('Ольга'.toLowerCase(), 'username'));
        aResult.push(find('Ольга'.toLowerCase(), 'user_fullname'));
        aResult.push(find('111'.toLowerCase(), 'user_mobile'));
    }

    console.log('result:', aResult[0]);

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

    const aSortResult = Object.entries(ixResult).sort((a,b) => b[1] - a[1]).map(el => el[0])

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

        if (ixData.username[idData]){
            aOutData.push([idData, ixResult[idData], ixData.username[idData].n, ixData.user_fullname[idData].n, ixData.user_mobile[idData].n]);
        } else {
            console.log('Не найден:', idData);
        }
    }

    console.log('aOutData', aOutData);


    // console.log(ixLetter);

    process.exit(0);

}


run();