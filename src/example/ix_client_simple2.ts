

import { mWait } from "../Helper/WaitH";
import { IxClientSys } from "../System/IxClientSys";
import { SchemaT } from "../interface/CommonI";

// CORE API
const ixClientSys = new IxClientSys({
    baseURL: 'ws://127.0.0.1:8080',
    nameApp: 'test_client'
})

async function run(){

        // Установить схему
        await ixClientSys.schema('user', {
            'login': SchemaT.ix_string,
        });
        
        // индексация
        await ixClientSys.insert('user', [{
            id: 1,
            login: 'петя',
        }]);
        await ixClientSys.insert('user', [{
            id: 2,
            login: 'петя',
        }]);
    
        // смена логина
        await ixClientSys.insert('user', [{
            id: 1,
            login: 'вася',
        }]);
    
        // находит 1 по 'петя'
        const aidSelect1 = await ixClientSys.select('user', ixClientSys.query()
            .match('login', 'петя')
            .match('login', 'вася')
            .limit(10)
        );
        console.log('aidSelect',aidSelect1);
    
        // находит 1 по 'вася'
        const aidSelect2 = await ixClientSys.select('user', ixClientSys.query()
            .match('login', 'вася')
            .limit(10)
        );
        console.log('aidSelect',aidSelect2);
    


    

    
    
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

