
import { db } from "../System/DBConnect";
import { v4 as uuid4 } from 'uuid';
import { mRandomInteger } from "../Helper/NumberH";



import { mWait } from "../Helper/WaitH";
import { IxClientSys } from "../System/IxClientSys";

// CORE API
const mqClientSys = new IxClientSys({
    baseURL: 'ws://127.0.0.1:8080',
    nameApp: 'test_client'
})

async function run(){

    // for (let i = 0; i < 10000; i++) {
    //     const sMsg = '['+i+'] СообщениЕ ['+i+']';

    //     mqClientSys.send('test', {text:sMsg});

    //     if(i % 1000 == 0){
    //         process.stdout.write('.');
    //     }
        
    // }
    
    // await mqClientSys.waitSend();

    //===========================================

    // const aUser = await db('phpbb_users').select({id:'user_id'}, 'username', 'user_fullname', 'user_mobile')
    //         .limit(1000)
    //         .orderBy('user_id', 'asc');

    
    // console.time('tInsert')
    // await mqClientSys.insert('user', aUser);
    // console.timeEnd('tInsert')

    // console.time('tSelect')
    // await mqClientSys.select('user', [
    //     'match username Ольга',
    //     'limit 100'
    // ]);

    const iPack = 100000;
    const iOffset = 500000000;


    for (let i = 0; i < 1000; i++) {
        const aItem = await db('item').select({id:'item_id'}, 'item_name', 'item_desc')
            .where('item_id', '>', iOffset+ i * iPack)
            .where('item_id', '<', iOffset+ (i+1) * iPack)
            .orderBy('item_id', 'asc');

        console.log('====>', 'pos',iOffset+ i*iPack,aItem.length)
        console.time('tInsert')
        await mqClientSys.insert('user', aItem);
        console.timeEnd('tInsert')
        
    }
    

    
    
   
    console.time('tSelect')
    // await mqClientSys.select('user', [
    //     'match username Ольга',
    //     'limit 100'
    // ]);

    await mWait(1000);


    console.log('=========================');
    console.log('END');
    console.log('=========================');
    process.exit(0)
}
// for (let i = 0; i < 20; i++) {
run().catch((error) => {
    console.log('>>>ERROR>>>',error);
    process.exit(1)
});

// }

