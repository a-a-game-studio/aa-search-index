

import { mWait } from "../Helper/WaitH";
import { MqClientSys } from "../System/MqClientSys";

const mqClientSys = new MqClientSys({
    baseURL: 'ws://127.0.0.1:8080',
    nameApp: 'test_client'
})

async function run(){

    /** Инициализация страницы */

    let count = 0;
    await mqClientSys.watchWork('test', 10, async (data:any) => {
        console.log('чтение очереди:',count++,  data);
        await mWait(1000);
    })

    await mWait(1000);


    console.log('=========================');
    console.log('END');
    console.log('=========================');
    process.exit(0)
}

run().catch((error) => {
    console.log('>>>ERROR>>>',error);
    process.exit(1)
});