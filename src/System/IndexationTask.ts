import _ from "lodash";
import { IxEngineSys } from "./IxEngineSys";

export namespace IndexationTaskN {

    function ixString(ixEngineSys:IxEngineSys, sCol:string, sVal:string){

    }

    function ixText(ixEngineSys:IxEngineSys, sCol:string, sVal:string){
        
    }

    export function fIxEnum(ixEngineSys:IxEngineSys, idRow:number, sCol:string, sVal:string): string|null{
        // IX ENUM
        sVal = sVal.toLowerCase();
        const vOldVal = ixEngineSys.ixData[idRow][sCol];

        // Если предыдущее значение == 
        if(vOldVal.toLowerCase() == sVal){
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

        if(this.ixEnum[sCol][vOldVal[sCol]][idRow]){

            if(!ixChunkLetterUse[sCol]){
                ixChunkLetterUse[sCol] = {};
            }

            if(!ixChunkLetterUse[sCol][sDataChunk]){
                ixChunkLetterUse[sCol][sDataChunk] = 0;
            }
            ixChunkLetterUse[sCol][sDataChunk]++;
            
        }

        return vOldVal;
    }
}