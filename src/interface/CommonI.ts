
export enum QueryT {
    connect = '/connect', // Сообщение о соединении
    check = '/check', // Проверка соединения
    insert = '/insert', // Отправить сообщение
    select = '/select', // Получить сообщение
    count = '/count', // Количество сообщений
    info = '/info' // Информация по очереди
}

export enum CmdT {
    match = 'match', // Полнотекстовый поиск
    where = 'where', // Условие
    in = 'in', // Совпадение из диапазона
    select = 'select', // Получить данные (если разрешено)
    count = 'count', // Количество записей по группировке
    group = 'group', // группировка
    limit = 'limit' // ограничение выборки
}

export interface QueryContextI {
    uid?:string; // Уникальный идентификатор запроса
    app:string; // Наименование приложения
    ip:string; // Входной IP адрес
    index?:string; // Индекс к которому идет обращение
    query?:string[]; // Запрос
    data?:any[]; // Данные
    time?:number; // Время отправки для механизмов очистки
}
