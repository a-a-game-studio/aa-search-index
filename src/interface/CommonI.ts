
export enum MsgT {
    connect = '/connect', // Сообщение о соединении
    check = '/check', // Проверка соединения
    send = '/send', // Отправить сообщение
    ask = '/ask', // Получить сообщение
    work = '/work', // Получить сообщение
    count = '/count', // Количество сообщений
    info = '/info' // Информация по очереди 
}

export interface MsgContextI {
    // n?:string; // Номер сообщения (когда оно уже зарегистрированно)
    uid?:string; // Уникальный идентификатор сообщения
	queue: string; // Очередь
    app:string; // Наименование приложения
    ip:string; // Входной IP адрес
    data?:any; // Данные
    time?:number; // Время отправки для механизмов очистки
}
