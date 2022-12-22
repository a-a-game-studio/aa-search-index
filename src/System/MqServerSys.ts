
import ip from 'ip'
import { db } from './DBConnect';
import { v4 as uuidv4 } from 'uuid';
import { mFormatDateTime } from '../Helper/DateTimeH';
import _, { now, NumericDictionaryIterateeCustom } from 'lodash';
import { MsgContextI } from '../interface/CommonI';
import * as conf from '../Config/MainConfig'
import { Knex } from 'knex';
import { setInterval } from 'timers';



/** информация по сообщению в БД*/
export interface DBQueueInfoI{
    queue:string;
    ip:string;
    count_no_work:number;
    count_send:number;
    count_ask:number;
    count_work:number;
    speed_send:number;
    speed_ask:number;
    speed_work:number;
}

/** информация по сообщению в БД*/
export interface DBMsgInfoI{
    id?:number;
    uid:string;
    queue:string;
    server_app:string; // имя серврера держатель сообщение
    server_ip:string;
    data:string;

    send_time:string;
    send_app?:string, // имя приложения которое отправило сообщение
    send_ip:string;

    ask_time:string;
    ask_app?:string, // имя приложения которое запросило сообщение
    ask_ip:string;

    work_time:string;
    work_app?:number, // имя приложения которое отработало сообщение
    work_ip:string;
}

/** информация по сообщению */
export interface MsgInfoI{
    uid:string; // Уникальны идентификатор
    send_time?:number,
    send_app?:string, // имя приложения которое отправило сообщение
    send_ip?:string,

    ask_time?:number,
    ask_app?:string, // имя приложения которое запросило сообщение
    ask_ip?:string,

    work_time?:number,
    work_app?:number, // имя приложения которое отработало сообщение
    work_ip?:string
}

/** информация по сообщению */
export interface QueueInfoI{
    count:number, // Количество необработанных сообщений в очереди
    ip:string, // IP 
    ask_speed:number, // скорость в секунду
    work_speed:number, // скорость в секунду
    send_speed:number, // скорость в секунду
}

/** Компонент Очередь */
export class MqQueueC {
    ixMsg:Record<number, any> = {};
    ixInfo:Record<number, MsgInfoI> = {};
    ixAskComplete:Record<number, string> = {}; // Пеметить в БД как запрошенные
    ixWorkComplete:Record<number, string> = {}; // Пеметить в БД как отработанные

    // Учет скорости
    ixSpeedSend:Record<number, number> = {};
    ixSpeedAsk:Record<number, number> = {};
    ixSpeedWork:Record<number, number> = {};
    iSpeedTimeCleer:number = 0;

    // Курсор очереди
    ip:''; // IP адрес очереди
    iQueDel = 0; // Курсон удаленных сообщений
    iQueStartDb = 0; // Курсор сообщений перенесенных в БД
    iQueStart = 0; // Курсор необработанных сообщений(cntAsk)
    iQueEnd = 0; // Курсор конца сообщений(cntSend)

    cntWork = 0; // Счетчик окончания работы
    

    /** Получить значение из очереди */
    public get(msg:MsgContextI){
        let iQueStart = 0;
        if(this.iQueEnd > this.iQueStart){
            iQueStart = ++this.iQueStart;
        } else {
            return null;
        }

        // console.log(iQueStart,this.ixMsg[iQueStart])

        const data = this.ixMsg[iQueStart];
        
 
        const vMsgInfo = this.ixInfo[iQueStart]

        const iAskTime = Date.now();
        
        vMsgInfo.ask_time = iAskTime;
        vMsgInfo.ask_app = msg.app;
        vMsgInfo.ask_ip = msg.ip;

        this.ixAskComplete[iQueStart] = vMsgInfo.uid;

        // console.log(Math.floor(iAskTime / 1000 % 100));
        const iSpeedTimePos = Math.floor(iAskTime/1000);
        if(!this.ixSpeedAsk[iSpeedTimePos]){
            this.ixSpeedAsk[iSpeedTimePos] = 0;
        }
        this.ixSpeedAsk[iSpeedTimePos]++; 
        
        return data;
    
    }

    /** Поместить значение в очередь */
    public set(msg:MsgContextI){
        const iQueEnd = ++this.iQueEnd;
    
        this.ixMsg[iQueEnd] = msg.data;

        const iSendTime = Date.now();

        this.ixInfo[iQueEnd] = {
            uid:msg.uid,
            send_time: Date.now(),
            send_app: msg.app,
            send_ip: msg.ip
        }

        // console.log(_.round(iSendTime/1000 % 100));
        const iSpeedTimePos = Math.floor(iSendTime/1000);
        if(!this.ixSpeedSend[iSpeedTimePos]){
            this.ixSpeedSend[iSpeedTimePos] = 0;
        }
        this.ixSpeedSend[iSpeedTimePos]++;
    }

    /** Поместить значение в очередь */
    public count(){
        return this.iQueEnd - this.iQueStart;
    }

    /** Получить информацию по очереди */
    public info(): QueueInfoI{

        const vQueueInfo:QueueInfoI = <any>{};
        vQueueInfo.count = this.iQueEnd - this.iQueStart;
        vQueueInfo.ip = ip.address();
        vQueueInfo.ask_speed = 0; // Скорость в секунду
        vQueueInfo.work_speed = 0; // скорость в секунду
        vQueueInfo.send_speed = 0; // скорость в секунду

        return vQueueInfo;
    }
}

/** Система очередей */
export class MqServerSys {
    public ixQueue:Record<string, MqQueueC> = {};
    public ixMsgSend:Record<string, number> = {}; // Проверка отправленных сообщений

    /** Получить из очереди */
    public get(msg:MsgContextI){
        
        if(!this.ixQueue[msg.queue]){
            this.ixQueue[msg.queue] = new MqQueueC();
        }

        const vMqQueueC = this.ixQueue[msg.queue];
        
        return vMqQueueC.get(msg);
        
    }
    
    /** Поместить значение в очередь */
    public set(msg:MsgContextI){
        if(!this.ixQueue[msg.queue]){
            this.ixQueue[msg.queue] = new MqQueueC();
        }

        process.stdout.write('.')

        const vMqQueueC = this.ixQueue[msg.queue];

        vMqQueueC.set(msg)
    }

    /** Получить количество сообщений в очереди */
    public count(sQue:string){
        if(!this.ixQueue[sQue]){
            this.ixQueue[sQue] = new MqQueueC();
        }

        const vMqQueueC = this.ixQueue[sQue];

        return vMqQueueC.count();
    }

    /** Получить информацию по очереди */
    public info(sQue:string): QueueInfoI{

        if(!this.ixQueue[sQue]){
            this.ixQueue[sQue] = new MqQueueC();
        }

        const vMqQueueC = this.ixQueue[sQue];

        return vMqQueueC.info();
    }

    /** Получить информацию по очереди */
    public async dbInit(){

        const bExistMsg = await db.schema.hasTable('msg');
        if(!bExistMsg){
            await db.schema.createTable('msg', (table:any) => {

                table.bigIncrements('id')
                    .comment('ID');

                table.string('uid', 36)
                    .unique('uid')
                    .comment('Уникальный идентификатор');

                table.string('queue', 100)
                    .index('queue')
                    .comment('IP отправки');

                table.string('server_app', 50)
                    .comment('Наименование сервера');

                table.string('server_ip', 20)
                    .comment('IP отправки');

                table.text('data')
                    .comment('Данные');

                table.dateTime('send_time')
                    .nullable()
                    .comment('время отправки');

                table.string('send_app', 50)
                    .comment('Наименование приложения отправки');
        
                table.string('send_ip', 20)
                    .comment('IP отправки');

                table.dateTime('ask_time')
                    .nullable()
                    .comment('время отправки');

                table.string('ask_app', 50)
                    .comment('Наименование приложения запрашивающего рабочего');
        
                table.string('ask_ip', 20)
                    .comment('IP отправки');
                
                table.dateTime('work_time')
                    .nullable()
                    .comment('время отправки');

                table.string('work_app', 50)
                    .comment('Наименование приложения запрашивающего рабочего');
        
                table.string('work_ip', 20)
                    .comment('IP отправки');

                table.dateTime('created_at', null)
                    .index('created_at')
                    .notNullable()
                    .defaultTo(db.raw('CURRENT_TIMESTAMP'))
                    .comment('Время создания записи');

                table.dateTime('updated_at')
                    .index('updated_at')
                    .notNullable()
                    .defaultTo(db.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
                    .comment('Время обновления записи');
                    
            });
        }

        const bExistQueue = await db.schema.hasTable('queue');
        if(!bExistQueue){
            await db.schema.createTable('queue', (table:any) => {
                table.increments('id')
                    .comment('ID');

                table.string('queue', 100)
                    .comment('Наименование очереди');
        
                table.string('ip', 20)
                    .comment('ip очереди');

                table.bigInteger('count_no_work')
                    .defaultTo(0)
                    .comment('Количество необработанных сообщений в очереди');

                table.bigInteger('count_send')
                    .defaultTo(0)
                    .comment('Количество отправленных сообщений');

                table.bigInteger('count_ask')
                    .defaultTo(0)
                    .comment('Количество запрошенных сообщений');

                table.bigInteger('count_work')
                    .defaultTo(0)
                    .comment('Количество обработанных сообщений');

                table.integer('speed_send')
                    .defaultTo(0)
                    .comment('скорость отправки сообщений в секунду');

                table.integer('speed_ask')
                    .defaultTo(0)
                    .comment('скорость запроса сообщений в секунду');

                table.integer('speed_work')
                    .defaultTo(0)
                    .comment('скорость обработки сообщений в секунду');

                table.dateTime('created_at', null)
                    .index('created_at')
                    .notNullable()
                    .defaultTo(db.raw('CURRENT_TIMESTAMP'))
                    .comment('Время создания записи');

                table.dateTime('updated_at')
                    .index('updated_at')
                    .notNullable()
                    .defaultTo(db.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
                    .comment('Время обновления записи');

                table.unique(['queue', 'ip'])
            });
        }

        // заполнение очереди из логов
        const aMsg = await db('msg')
            .whereNull('ask_time')
            .select()

        for (let i = 0; i < aMsg.length; i++) {
            const vMsg:DBMsgInfoI = aMsg[i];

            this.ixMsgSend[vMsg.uid] = Date.now();
            this.set({
                uid:vMsg.uid,
                queue:vMsg.queue,
                data:JSON.parse(vMsg.data),
                app:vMsg.send_app,
                ip:vMsg.send_ip
            });
            
        }

        // Смещение записи логов на вставленные из логов данные
        const akQue = Object.keys(this.ixQueue);
        for (let i = 0; i < akQue.length; i++) {
            const kQue = akQue[i];
            this.ixQueue[kQue].iQueStartDb = this.ixQueue[kQue].iQueEnd;
        }
        
        
    }


    /** Сохранить информацию по очереди */
    public async dbSave(){

        const aMqLog:any[] = []; // Данные для сохранения

        const akQueue = Object.keys(this.ixQueue);
        for (let i = 0; i < akQueue.length; i++) {
            const kQueue = akQueue[i];
            const vMqQueueC = this.ixQueue[kQueue]
            
            const iQueStartDb = vMqQueueC.iQueStartDb;
            const iQueEnd = vMqQueueC.iQueEnd;

            let aiMsgSave:number[] = []; // Обрабатываемые сообщения
            let aiMsgDel:number[] = []; // Удаление отработанных сообщений

            // Сохраняем новые
            for (let c = iQueStartDb + 1, j = 0; c <= iQueEnd && j < 1000; c++, j++) {
                aiMsgSave.push(c);
                vMqQueueC.iQueStartDb++;
            }

            
            // Сохраняем которые запросили
            const aiAllAskComplete = Object.keys(vMqQueueC.ixAskComplete)
            const ixMsgID:Record<number, number> = {}
            if(aiAllAskComplete.length){
                // const ixAskComplete = vMqQueueC.ixAskComplete;
                // vMqQueueC.ixAskComplete = {};

                const aiComplete = aiAllAskComplete.slice(0,1000);

                // console.log('aiComplete:',aiComplete);
                const auidComplete:string[] = [];
                for (let j = 0; j < aiComplete.length; j++) {
                    const iComplete = Number(aiComplete[j]);

                    auidComplete.push(vMqQueueC.ixAskComplete[iComplete]);
                }

                // console.log('auidComplete:',auidComplete);

                // const auidComplete = Object.values(ixAskComplete);

                const aMsgDb = await db('msg').whereIn('uid', auidComplete).select('id', 'uid');

                const ixMsgDb = _.keyBy(aMsgDb, 'uid');

                
                for (let j = 0; j < aiComplete.length; j++) {
                    const iComplete = Number(aiComplete[j]);
                    const uidComplete = vMqQueueC.ixAskComplete[iComplete];

                    aiMsgSave.push(iComplete);
                    delete vMqQueueC.ixAskComplete[iComplete];

                    const vMsgDb = ixMsgDb[uidComplete];

                    if(vMsgDb){
                        ixMsgID[iComplete] = vMsgDb.id;
                    }
                }
            }

            // console.log('aiMsgSave:',aiMsgSave);
            aiMsgSave = _.uniq(aiMsgSave);
            // console.log('aiMsgSave:',aiMsgSave);

            for (let j = 0; j < aiMsgSave.length; j++) {
                const iMsg = aiMsgSave[j];

                const vMsgDb:DBMsgInfoI = <any>{};
                const vMsg = vMqQueueC.ixMsg[iMsg];
                const vMsgInfo = vMqQueueC.ixInfo[iMsg];

                if(vMsg && vMsgInfo){
                
                    if(ixMsgID[iMsg]){
                        vMsgDb.id = Number(ixMsgID[iMsg]);
                    }

                    // TODO тут должен быть vMsgInfo.work_time
                    if(vMsgInfo.ask_time){
                        aiMsgDel.push(iMsg);
                    }

                    vMsgDb.uid = vMsgInfo.uid;
                    vMsgDb.queue = kQueue;
                    vMsgDb.server_app = conf.common.nameApp;
                    vMsgDb.server_ip = ip.address();
                    vMsgDb.data = JSON.stringify(vMsg);

                    vMsgDb.send_time = vMsgInfo.send_time ? mFormatDateTime(vMsgInfo.send_time) : null;
                    vMsgDb.send_app = vMsgInfo.send_app;
                    vMsgDb.send_ip = vMsgInfo.send_ip;

                    vMsgDb.ask_time = vMsgInfo.ask_time ? mFormatDateTime(vMsgInfo.ask_time): null;
                    vMsgDb.ask_app = vMsgInfo.ask_app;
                    vMsgDb.ask_ip = vMsgInfo.ask_ip;

                    vMsgDb.work_time = vMsgInfo.work_time ? mFormatDateTime(vMsgInfo.work_time): null;
                    vMsgDb.work_app = vMsgInfo.work_app;
                    vMsgDb.work_ip = vMsgInfo.work_ip;
                    aMqLog.push(vMsgDb);
                    
                } else {
                    console.log('ERROR>>>',aiMsgSave.length, vMsg, vMsgInfo);
                }

            } // for msg


            // Освобождение памяти от сообщений
            if(aiMsgDel.length){
                for (let j = 0; j < aiMsgDel.length; j++) {
                    const iMsgDel = aiMsgDel[j];
                    delete vMqQueueC.ixMsg[iMsgDel];
                    delete vMqQueueC.ixInfo[iMsgDel];
                }
            }

            // console.log(Object.values(vMqQueueC.ixSpeedSend));

            // Запись информации по очереди
            const iCurrTimeSec = Date.now()/1000;


            // Подсчет в секунду отправки
            const aSpeedSend = Object.entries(vMqQueueC.ixSpeedSend)
            let iCntSpeedSend = 0;
            let iTotSpeedSend = 0;
            for (let j = 0; j < aSpeedSend.length; j++) {
                const [kTime, vCnt] = aSpeedSend[j];

                if(Number(kTime) < iCurrTimeSec - 10){
                    delete vMqQueueC.ixSpeedSend[Number(kTime)];
                } else {
                    iCntSpeedSend += Number(vCnt)
                    iTotSpeedSend++;
                }
            }

            // Подсчет в секунду запросов
            const aSpeedAsk = Object.entries(vMqQueueC.ixSpeedAsk)
            console.log(aSpeedAsk);
            let iCntSpeedAsk = 0;
            let iTotSpeedAsk = 0;
            for (let j = 0; j < aSpeedAsk.length; j++) {
                const [kTime, vCnt] = aSpeedAsk[j];

                if(Number(kTime) < iCurrTimeSec - 10){
                    delete vMqQueueC.ixSpeedAsk[Number(kTime)];
                } else {
                    iCntSpeedAsk += Number(vCnt)
                    iTotSpeedAsk++;
                }
            }

            // Подсчет в секунду отработки
            const aSpeedWork = Object.entries(vMqQueueC.ixSpeedWork)
            let iCntSpeedWork = 0;
            let iTotSpeedWork = 0;
            for (let j = 0; j < aSpeedWork.length; j++) {
                const [kTime, vCnt] = aSpeedWork[j];

                if(Number(kTime) < iCurrTimeSec - 10){
                    delete vMqQueueC.ixSpeedWork[Number(kTime)];
                } else {
                    iCntSpeedWork += Number(vCnt)
                    iTotSpeedWork++;
                }
            }

            const iSpeedSend = Math.floor(iCntSpeedSend/iTotSpeedSend) || 0;
            const iSpeedAsk = Math.floor(iCntSpeedAsk/iTotSpeedAsk) || 0;
            const iSpeedWork = Math.floor(iCntSpeedWork/iTotSpeedWork) || 0;
            const cntSend = vMqQueueC.iQueEnd;
            const cntAsk = vMqQueueC.iQueStart;
            const cntWork = vMqQueueC.cntWork;
            const contNoWork = cntSend - cntWork;
            

            try {
                const ifExist = (await db('queue')
                    .where({queue:kQueue,ip:ip.address()})
                    .first('id'))?.id;

                if(ifExist){
                    await db('queue')
                        .where({queue:kQueue,ip:ip.address()})
                        .update({
                            count_no_work:contNoWork,

                            count_send:cntSend,
                            count_ask:cntAsk,
                            count_work:cntWork,

                            speed_send:iSpeedSend,
                            speed_ask:iSpeedAsk,
                            speed_work:iSpeedWork,
                        })
                } else {
                    await db('queue').insert({
                        queue:kQueue,
                        ip:ip.address(),
                        count_no_work:contNoWork,

                        count_send:cntSend,
                        count_ask:cntAsk,
                        count_work:cntWork,

                        speed_send:iSpeedSend,
                        speed_ask:iSpeedAsk,
                        speed_work:iSpeedWork
                    })
                    .onConflict(['queue','ip'])
                    .merge();
                }

            } catch (e) {
                console.log('>>>ERROR>>>', e);
            }
            
        } // for que

        // Запись логов в БД
        if(aMqLog.length){

            const aaChunkMqLog = _.chunk(aMqLog, 1000);
            for (let i = 0; i < aaChunkMqLog.length; i++) {
                const aChunkMqLog = aaChunkMqLog[i];
                
                try {
                    let sql = (db('msg')
                        .insert(aChunkMqLog)
                    ).toString();
                    sql = sql.replace(/^insert/i, 'replace');
    
                    // console.log('sql>>>',sql);
                    await db.raw(sql);
            
                } catch (e) {
                    console.log('>>>ERROR>>>', e);
                }

                console.log('Сохранение данных:', aChunkMqLog.length);
            }
            
        } else {
            process.stdout.write('.');
        }

        // Удаление учета отправленных сообщений
        const aMsgSend = Object.entries(this.ixMsgSend);
        const iTimeNow =  Date.now();
        for (let i = 0; i < aMsgSend.length; i++) {
            const [uidMsg, iTimeSend] = aMsgSend[i];
            
            // Удаляем спустя 10 минут
            if(iTimeSend < iTimeNow - 10*60*1000){
                delete this.ixMsgSend[uidMsg];
            }
        }
        
    }
}