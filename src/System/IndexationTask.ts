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
        sVal = sVal.toLowerCase();
        const sOldVal = ixEngineSys.ixData[idRow][sCol];

        // Если предыдущее значение == 
        if(sOldVal && sOldVal.toLowerCase() == sVal){
            return null;
        }
        ixEngineSys.ixData[idRow][sCol] = sVal;

        if(!ixEngineSys.ixEnum[sCol]){
            ixEngineSys.ixEnum[sCol] = {};   
            // console.log('create',ixEngineSys.ixEnum)
        }

        if(!ixEngineSys.ixEnum[sCol][sVal]){
            ixEngineSys.ixEnum[sCol][sVal] = new Uint32Array(10);
            ixEngineSys.ixEnum[sCol][sVal][0] = 0;
            // console.log('create',ixEngineSys.ixEnum)
        }
        const iDataLength = ixEngineSys.ixEnum[sCol][sVal][0]; // текущее количество данных
        if(iDataLength + 4 > ixEngineSys.ixEnum[sCol][sVal].length){
            ixEngineSys.ixEnum[sCol][sVal] = new Uint32Array(ixEngineSys.ixEnum[sCol][sVal], 0, ixEngineSys.ixEnum[sCol][sVal].length * 2);
        }
        ixEngineSys.ixEnum[sCol][sVal][iDataLength+4] = idRow;
        ixEngineSys.ixEnum[sCol][sVal][0]++;

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