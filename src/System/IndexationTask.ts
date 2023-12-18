import _ from "lodash";
import { IxEngineSys } from "./IxEngineSys";

export namespace IndexationTaskN {

    export function ixString(ixEngineSys:IxEngineSys, sCol:string, sVal:string){
        
    }

    function ixText(ixEngineSys:IxEngineSys, sCol:string, sVal:string){
        
    }

    export function fIxEnum(ixEngineSys:IxEngineSys, idRow:number, sCol:string, sVal:string): string|null{

        // console.log(ixEngineSys.ixEnum)
        // IX ENUM
        sVal = String(sVal).toLowerCase();
        const sOldVal = ixEngineSys.ixData[idRow][sCol];

        // Если предыдущее значение == 
        if(sOldVal && String(sOldVal).toLowerCase() == sVal){
            return null;
        }
        ixEngineSys.ixData[idRow][sCol] = sVal;

        if(!ixEngineSys.ixLetter[sCol+'--'+sVal]){
            ixEngineSys.ixLetter[sCol+'--'+sVal] = new Uint32Array(10);
            ixEngineSys.ixLetter[sCol+'--'+sVal][0] = 0;
            // console.log('create',ixEngineSys.ixEnum)
        }
        const iDataLength = ixEngineSys.ixLetter[sCol+'--'+sVal][0]; // текущее количество данных
        if(iDataLength + 4 > ixEngineSys.ixLetter[sCol+'--'+sVal].length){
            ixEngineSys.ixLetter[sCol+'--'+sVal] = new Uint32Array(ixEngineSys.ixLetter[sCol+'--'+sVal], 0, ixEngineSys.ixLetter[sCol+'--'+sVal].length * 2);
        }
        ixEngineSys.ixLetter[sCol+'--'+sVal][iDataLength+4] = idRow;
        ixEngineSys.ixLetter[sCol+'--'+sVal][0]++;

        // ixEngineSys.ixEnum[sCol][sVal].ix[idRow] = idRow;
        // ixEngineSys.ixEnum[sCol][sVal].list.push(idRow)

        // TODO скрыто временно
        // Удаляем старое значение
        // if(sCol !== 'id' && sOldVal){
        //     delete ixEngineSys.ixEnum[sCol][sOldVal].ix[idRow]
        // }
        return sOldVal;
    }
}