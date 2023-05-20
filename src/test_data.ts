

import { v4 as uuid4 } from 'uuid';
import { mWait } from './Helper/WaitH';

var os = require('os');



async function run(){

    // const ix:Record<number, number> = {}
    // for (let i = 0; i < 100000000; i++) {
    //     ix[i] = i;
        
    // }
    
    const aa:Uint32Array[] = [];
    let aTestData = new Uint32Array(1000000);

    for (let j = 0; j < 1; j++) {
       
        
    
        aTestData = new Uint32Array(1000000);

        aTestData[0] = 100000;
        for (let i = 1; i < 100000; i++) {
            // const i1 = Number(i|i+1|i+2|i+3);
            aTestData[i] = i;
        }

        aa.push(aTestData)
    }

    // const aTestData2 = [];
    // for (let i = 0; i < 1000000; i++) {
    //     // const i1 = Number(i|i+1|i+2|i+3);
    //     aTestData[i] = i;
    // }


    // const buf4 = Buffer.from(aTestData);
    const a32 = new Uint32Array(aTestData, 0, aTestData.length*2);
    
    const a32New = new Uint32Array(aTestData)
    console.time('t1')
    for (const iterator of a32) {
        // console.log(iterator)
        a32New[iterator] = iterator;
    }
    console.timeEnd('t1')
    console.time('t2')
    for (let i = 0; i < aTestData[0]; i++) {

        const i1 = a32[i];
        a32New[i1] = i1;
        console.log(i1);
    }
    console.timeEnd('t2')
    await mWait(2000);


    const memoryData = process.memoryUsage();

    const formatMemoryUsage = (data:any) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
    console.log(`${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`),
    console.log(`${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`),
    console.log(`${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`),
    console.log(`${formatMemoryUsage(memoryData.external)} -> V8 external memory`);
    // console.log(os.totalmem());
    console.log('wait...')
    await mWait(5000);
}

run();