import _ from "lodash";
import { IxEngineSys } from "./IxEngineSys";

export namespace IndexationTaskN {

    export function ixString(ixEngineSys:IxEngineSys, sCol:string, sVal:string){
        
    }

    function ixText(ixEngineSys:IxEngineSys, sCol:string, sVal:string){
        
    }

    export function fIxEnum(ixEngineSys:IxEngineSys, idRow:number, sCol:string, sVal:string): string|null{
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
        }

        if(!ixEngineSys.ixEnum[sCol][sVal]){
            ixEngineSys.ixEnum[sCol][sVal] = {
                list:[], ix:{}
            };
        }
        ixEngineSys.ixEnum[sCol][sVal].ix[idRow] = idRow;
        ixEngineSys.ixEnum[sCol][sVal].list.push(idRow)

        return sOldVal;
    }
}