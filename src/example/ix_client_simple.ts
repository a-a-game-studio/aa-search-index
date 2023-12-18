
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

    // Установить схему
    await ixClientSys.schema('user', {
        'username':SchemaT.ix_string,
        'user_fullname':SchemaT.ix_string,
        'user_mobile':SchemaT.ix_string,
        'consumer_rating':SchemaT.int,
        'login':SchemaT.ix_enum,
        'user_id':SchemaT.ix_enum,
    });


    console.log('INSERT START');
    console.time('tInsert')
    await ixClientSys.insert('user', [{
        'id':'54',
        'username':'Ольга',
        'user_fullname':'Ольга Викторовна Петрович',
        'user_mobile':'79998887766',
        'consumer_rating':'2',
        'login':'Ольга',
        'user_id':'54',
    }]);
    console.timeEnd('tInsert')

    console.time('tSelectString')
    // const aidSelect = await ixClientSys.select('user', ixClientSys.query()
    //     .match('username', 'ольга')
    //     .match('username', 'света')
    //     // .match('id', '26096')
    //     .in('id', ['156','26096','62634','58448'])
    //     .where('consumer_rating', '=', String(3))
    //     // .where('id', '=', '26096')
    //     .limit(10)
    // );
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

