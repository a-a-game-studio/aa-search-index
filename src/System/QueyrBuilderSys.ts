import { QuerySys } from "@a-a-game-studio/aa-front";
import { resolve } from "dns";
import e from "express";

import { v4 as uuidv4 } from 'uuid';

import ip from 'ip'
import { reject } from "lodash";
import { mWait } from "../Helper/WaitH";
import { QueryContextI, QueryT, SchemaT } from '../interface/CommonI';
import { IxClientSys } from "..";

type  OpT = '='|'>='|'<='|'!='|'>'|'<'|'like'|'like_i';

export class QueyrBuilderSys {

    private aaString:string[][] = [];

    /** init */
    constructor(){
    }

    /** получить сырой запрос */
    public getQuery():string[][]{
        return this.aaString;
    }


    /** 
     * Поиск совпадений по индексу
    */
    public match(sCol:string, sText:string): QueyrBuilderSys {
        this.aaString.push(['match', sCol, sText]);

        return this;
    }

    /** 
     * Поиск совпадений по индексу
    */
    public in(sCol:string, aVal:string[]|number[]): QueyrBuilderSys {
        this.aaString.push(['in', sCol, JSON.stringify(aVal)]);

        return this;
    }

    /** 
     * Фильтрация
    */
    public where(sCol:string, op:OpT,  val:string): QueyrBuilderSys {
        this.aaString.push(['where', sCol, op, val]);

        return this;
    }

    /** 
     * ограничение на количество данных в результате
    */
    public limit(iLimit?:number): QueyrBuilderSys {
        this.aaString.push(['limit', String(iLimit)]);

        return this;
    }

    /** 
     * Количество записей
    */
    public count(sCol?:string): QueyrBuilderSys {
        this.aaString.push(['count', sCol || '*']);

        return this;
    }

    // /** 
    //  * Группировка по колонке
    // */
    // public group(sCol?:string): QueyrBuilderSys {
    //     this.aaString.push(['count', sCol || '*']);

    //     return this;
    // }

    // /** 
    //  * выборка колонок
    // */
    //  public select(sCol?:string): QueyrBuilderSys {
    //     this.aaString.push(['count', sCol || '*']);

    //     return this;
    // }



}