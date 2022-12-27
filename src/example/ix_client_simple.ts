
import { db } from "../System/DBConnect";
import { v4 as uuid4 } from 'uuid';
import { mRandomInteger } from "../Helper/NumberH";



import { mWait } from "../Helper/WaitH";
import { IxClientSys } from "../System/IxClientSys";
import { SchemaT } from "../interface/CommonI";

// CORE API
const mqClientSys = new IxClientSys({
    baseURL: 'ws://127.0.0.1:8080',
    nameApp: 'test_client'
})

async function run(){

    // Установить схему
    await mqClientSys.schema('user', {
        'username':SchemaT.ix_string,
        'user_fullname':SchemaT.ix_string,
        'user_mobile':SchemaT.ix_string,
        'consumer_rating':SchemaT.int,
        'login':SchemaT.ix_enum,
    });

    const aUser = await db('phpbb_users')
        .limit(10000)
        .orderBy('user_id', 'asc')
        .select(
            {id:'user_id'}, 
            'username', 
            {login:'username'}, 
            'user_fullname', 
            'user_mobile', 
            'consumer_rating'
        );

    
    console.time('tInsert')
    await mqClientSys.insert('user', aUser);
    console.timeEnd('tInsert')

    console.time('tSelectString')
    const aidSelect = await mqClientSys.select('user', [
        'match username ольга',
        'match username света',
        'where consumer_rating = 3',
        'limit 10'
    ]);
    console.timeEnd('tSelectString')

    console.log('aidSelect',aidSelect);

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

