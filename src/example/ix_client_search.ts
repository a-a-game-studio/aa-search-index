
import { db } from "../System/DBConnect";
import { v4 as uuid4 } from 'uuid';
import { mRandomInteger } from "../Helper/NumberH";



import { mWait } from "../Helper/WaitH";
import { IxClientSys } from "../System/IxClientSys";
import { SchemaT } from "../interface/CommonI";

// CORE API
const ixClientSys = new IxClientSys({
    baseURL: 'ws://127.0.0.1:3380',
    nameApp: 'test_client'
})

async function run(){


    console.time('tSelectString')
    const aidSelect = await ixClientSys.select('user', ixClientSys.query()
        .match('item_name', 'Платье')
        // .match('user_fullname', 'яковевна')
        // .match('username', 'света')
        // .match('id', '26096')
        // .in('id', ['156','26096','62634','58448'])
        // .where('consumer_rating', '=', String(1))
        // .where('id', '=', '26096')
        .limit(10)
    );
    console.timeEnd('tSelectString')

    // console.log('aidSelect',aidSelect);/

    // Удаление записей
    // await ixClientSys.truncate('user');

    // console.time('tSelectEnum')
    // await mqClientSys.select('user', [
    //     'match login ольга',
    //     'match username админ',
    //     'where consumer_rating = 3',
    //     'limit 10'
    // ]);
    // console.timeEnd('tSelectEnum')

    // console.time('tSelectWhere')
    // await mqClientSys.select('user', [
    //     'where consumer_rating = 2',
    //     'limit 10'
    // ]);
    // console.timeEnd('tSelectWhere')

    // console.time('tSelectGroup')
    // await mqClientSys.select('user', [
    //     'count login',
    //     'where consumer_rating = 3',
    //     'group consumer_rating',
    //     'limit 10'
    // ]);
    // console.timeEnd('tSelectGroup')

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

