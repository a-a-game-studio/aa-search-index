import { truncate } from "lodash";

export enum QueryT {
    connect = '/connect', // Сообщение о соединении
    check = '/check', // Проверка соединения
    schema = '/schema', // Сообщение о соединении
    insert = '/insert', // Отправить сообщение
    select = '/select', // Получить сообщение
    count = '/count', // Количество сообщений
    info = '/info', // Информация по очереди
    truncate = '/truncate', // Количество сообщений
}

export enum CmdT {
    match = 'match', // Полнотекстовый поиск
    where = 'where', // Условие
    in = 'in', // Совпадение из диапазона
    select = 'select', // Получить данные (если разрешено)
    count = 'count', // Количество записей по группировке
    sum = 'sum', // Количество записей по группировке
    group = 'group', // группировка
    limit = 'limit' // ограничение выборки
}

export enum SchemaT {
    ix_string = 'ix_string', // 256 символов
    ix_text = 'ix_text', // > 256 символов индексирует словами >= 3 символов
    ix_enum = 'ix_enum', // точное сопоставление в нижнем регистре
    enum = 'enum', // атрибут точное сопоставление в нижнем регистре
    text = 'text', // атрибут ищет через indexOf 
    int = 'int', // атрибут целые числа - ишет перебором
    num = 'num', // атрибут дробные -  ишет перебором
}

export interface QueryContextI {
    uid?:string; // Уникальный идентификатор запроса
    app:string; // Наименование приложения
    ip:string; // Входной IP адрес
    index?:string; // Индекс к которому идет обращение
    query?:string[][]; // Запрос
    data?:any[]; // Данные
    time?:number; // Время отправки для механизмов очистки
}
