
export enum QueryT {
    connect = '/connect', // Сообщение о соединении
    check = '/check', // Проверка соединения
    insert = '/insert', // Отправить сообщение
    select = '/select', // Получить сообщение
    count = '/count', // Количество сообщений
    info = '/info' // Информация по очереди
}

export interface MsgContextI {
	
    app:string; // Наименование приложения
    ip:string; // Входной IP адрес
    query?:string[]; // Запрос
    data?:any[]; // Данные
    time?:number; // Время отправки для механизмов очистки
}
