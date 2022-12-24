import { QuerySys } from "@a-a-game-studio/aa-front";
import { resolve } from "dns";
import e from "express";

import { v4 as uuidv4 } from 'uuid';

import ip from 'ip'
import { reject } from "lodash";
import { mWait } from "../Helper/WaitH";
import { QueryContextI, QueryT } from "../interface/CommonI";


export class IxClientSys {

    conf:{
        baseURL: string, // 'ws://127.0.0.1:8080',
        nameApp: string, // Наименование приложения
    } = null;

    ixSendMsg:Record<string, QueryContextI> = {}; // Сообщения для отправки

    private querySys:QuerySys = null;
    iSend:number = 0;
    iSendComplete:number = 0;
    iSendErr:number = 0;
    

    // Работа с буфером
    iLastTimeSend = Date.now();
    ixSendBuffer:Record<string, QueryContextI[]> = {};
    iSendBufferCount = 0;

    // Установка количество рабочик в воркере
    // iWorkerMax = 0;
    // iWorker = 0;
    ixWorker:Record<string, {
        max?:number;
        count?:number;
        interval?:any;
    }> = {}

    

    /** init */
    constructor(conf:{
        baseURL: string, // 'ws://127.0.0.1:8080',
        nameApp: string, // Наименование приложения
    }){
        this.querySys = new QuerySys()
        this.querySys.fConfigWs(conf);
        this.conf = conf;
    }

    /** установка/переопределение опций для очереди */
    public option(option:{
        nameApp: string, // Наименование приложения
    }){
        this.conf.nameApp = option.nameApp;
    }


    /**
	 * Отправить сообщение в очередь
	 * @param sQueue
	 * @param msg
	 */
	public insert(sIndex: string, data: any[]) {
        return new Promise((resolve, reject) => {

            for (let i = 0; i < data.length; i++) {
                if(!data[i]?.id){
                    reject(new Error('Отсутствует id'));
                };
                
            }

            const uidMsg = uuidv4();
            const vMsg = <QueryContextI>{
                uid:uidMsg,
                app:this.conf.nameApp,
                ip:ip.address(),
                index:sIndex,
                data:data,
                time:Date.now()
            }
            this.ixSendMsg[uidMsg] = vMsg;

            this.querySys.fInit();
            this.querySys.fActionOk((data: string[]) => {
                resolve(data)
            });
            this.querySys.fActionErr((err:any) => {
                reject(err);
            });
            this.querySys.fSend(QueryT.insert, vMsg);
            this.iSend++;

        });
	}

    /** Запросить из очереди 
     * cb(data)
    */
    public select(sIndex:string, cmd:string[]) {
        return new Promise((resolve, reject) => {
            this.querySys.fInit();
            this.querySys.fActionOk((data:number[]) => {
                resolve(data);
            });
            this.querySys.fActionErr((err:any) => {
                reject(err)
            });
            this.querySys.fSend(QueryT.select, <QueryContextI>{
                app:this.conf.nameApp,
                ip:ip.address(),
                index:sIndex,
                query:cmd
            });
        })
    }

    /** 
     * Количество сообщений в очереди
    */
    public count(sQueue:string, cb:Function): void {
        this.querySys.fInit();
        this.querySys.fActionOk(cb);
        this.querySys.fActionErr((err:any) => {
            console.error(err);
        });
        this.querySys.fSend(QueryT.count, {
            app:this.conf.nameApp,
            ip:ip.address(),
            queue:sQueue
        });
    }

    /** 
     * Информация об очереди
    */
    public info(sQueue:string, cb:Function): void {
        this.querySys.fInit();
        this.querySys.fActionOk(cb);
        this.querySys.fActionErr((err:any) => {
            console.error(err);
        });
        this.querySys.fSend(QueryT.info, {
            app:this.conf.nameApp,
            ip:ip.address(),
            queue:sQueue
        });
    }



}