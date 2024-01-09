
import { AAContext, AARoute, AAServer } from '@a-a-game-studio/aa-server';


import { faSendRouter as faSend } from './System/ResponseSys';

import { QueryContextI, QueryT } from './interface/CommonI';
import { common } from './Config/MainConfig';
import { IxEngineSys } from './System/IxEngineSys';

let cntConnect = 0;

const gIxEngineSys = new IxEngineSys();

// =============================================================
// var remoteSocket = new net.Socket();
let bConnect = false;

const app = new AAServer();
// if (config.common.env === 'dev' || config.common.env === 'test') {
    app.use((ctx: AAContext) => {
        console.log(`>:${ctx.req.url}`);
        ctx.next();
    });
// }

const router = new AARoute();

// app.use(ParseBodyMiddleware);

/**
 * Приход сообщений
 */
router.ws(QueryT.schema, async (ctx: AAContext) => {

    console.log('QueryT.schema');

    try {
        await gIxEngineSys.fSchema(ctx.body.data);
    } catch(e){
        console.log('QueryT.schema>>>', e)
    }

    return faSend(ctx, null);
    
});


/**
 * Приход сообщений
 */
 router.ws(QueryT.insert, async (ctx: AAContext) => {

    const auidMsg:string[] = [];

    try {
        await gIxEngineSys.fIndexation(ctx.body.data);
    } catch(e){
        console.log('QueryT.insert>>>', e)
    }

    return faSend(ctx, auidMsg);
    
});


/**
 * Уход сообщений
 */
 router.ws(QueryT.select, async (ctx: AAContext) => {

    let data:any[] = [];
    try { 
        data = await gIxEngineSys.search(ctx.body);
    } catch(e){
        console.log('QueryT.select>>>', e)
    }
    process.stdout.write('.');
    // console.log('select>>>', data);

    // if(data){

        return faSend(ctx, data);
    // } else {
    //     return faSendRouter(ctx, {msg:'нет сообщений'});
    // }

});

/**
 * Количество сообщений
 */
 router.ws(QueryT.count, async (ctx: AAContext) => {

    let data:number = 0;
    try {
        data = gIxEngineSys.count(ctx.body.queue);
    } catch(e){
        console.log('QueryT.count>>>',e);
    }
    process.stdout.write('.');

    // if(data){
        return faSend(ctx, data);
    // } else {
    //     return faSendRouter(ctx, {msg:'нет сообщений'});
    // }

});

/**
 * Очистка индекса
 */
router.ws(QueryT.truncate, async (ctx: AAContext) => {

    let bTruncate = false;
    try {
        gIxEngineSys.truncate();
        bTruncate = true;
    } catch(e){
        bTruncate = false;
        console.log('QueryT.truncate>>>',e);
    }
    process.stdout.write('.');
    
    return faSend(ctx, true);

});

/**
 * Количество сообщений
 */
 router.ws(QueryT.connect, async (ctx: AAContext) => {

    console.log('connect>>>',ctx.body);
        return faSend(ctx, true);
});




app.route(router)

// Обработчик ошибок
app.error((AAContext) => {
    console.log('[]>>>ERROR<<<]');
    console.log(AAContext.err.getTraceList());
});

console.log(`

 █████╗ ██████╗ ██╗
██╔══██╗██╔══██╗██║
███████║██████╔╝██║
██╔══██║██╔═══╝ ██║
██║  ██║██║     ██║
╚═╝  ╚═╝╚═╝     ╚═╝

`);

app.listenWs(common.port, common.host, () => {
    console.log(`server start at ${common.host}:${common.port}`);

    return true;
});
