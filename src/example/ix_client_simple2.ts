
// import { db } from "../System/DBConnect";
// import { v4 as uuid4 } from 'uuid';
// import { mRandomInteger } from "../Helper/NumberH";



// import { mWait } from "../Helper/WaitH";
// import { IxClientSys } from "../System/IxClientSys";
// import { SchemaT } from "../interface/CommonI";

// // CORE API
// const ixClientSys = new IxClientSys({
//     baseURL: 'ws://127.0.0.1:8088',
//     nameApp: 'test_client'
// })

// async function run(){

//         // Установить схему
//         await ixClientSys.schema('user', {
//             'login': SchemaT.ix_string,
//         });
        
//         // индексация
//         await ixClientSys.insert('user', [{
//             id: 1,
//             login: 'петя',
//         }]);
//         await ixClientSys.insert('user', [{
//             id: 2,
//             login: 'петя',
//         }]);

//         // смена логина
//         await ixClientSys.insert('user', [{
//             id: 2,
//             login: 'вася',
//         }]);
//         await ixClientSys.insert('user', [{
//             id: 2,
//             login: 'петя',
//         }]);
//         await ixClientSys.insert('user', [{
//             id: 2,
//             login: 'петруша',
//         }]);
//         await ixClientSys.insert('user', [{
//             id: 2,
//             login: 'петергов',
//         }]);
//         await ixClientSys.insert('user', [{
//             id: 2,
//             login: 'пятерка',
//         }]);
//         await ixClientSys.insert('user', [{
//             id: 2,
//             login: 'петя',
//         }]);
    
//         // находит 1 по 'петя'
//         // const aidSelect1 = await ixClientSys.select('user', ixClientSys.query()
//         //     .match('login', 'петя')
//         //     .match('login', 'вася')
//         //     .limit(10)
//         // );
//         // console.log('aidSelect1',aidSelect1);
    
//         // находит 1 по 'вася'
//         const aidSelect2 = await ixClientSys.select('user', ixClientSys.query()
//             .match('login', 'петя')
//             .limit(10)
//         );
//         console.log('aidSelect2',aidSelect2);
    


    

    
    
//     await mWait(1000);


//     console.log('=========================');
//     console.log('END');
//     console.log('=========================');
//     process.exit(0)
// }
// // for (let i = 0; i < 20; i++) {
// run().catch((error) => {
//     console.log('>>>ERROR>>>',error);
//     process.exit(1)
// });

// // }

