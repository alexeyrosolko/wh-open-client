import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListShelfDto } from '../model/response-list-shelf-dto';
import { ResponseShelfDto } from '../model/response-shelf-dto';
import { ShelfDto } from '../model/shelf-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class ShelfService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Создать новую полку на складе
     * Создать новую полку на складе
     * @endpoint post /api/warehouse/{warehouseCode}/shelf
     * @param warehouseCode
     * @param shelfDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addShelf(warehouseCode: string, shelfDto: ShelfDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseShelfDto>;
    addShelf(warehouseCode: string, shelfDto: ShelfDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseShelfDto>>;
    addShelf(warehouseCode: string, shelfDto: ShelfDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseShelfDto>>;
    /**
     * Получить общее количество полок
     * Получить общее количество полок на складе
     * @endpoint get /api/warehouse/{warehouseCode}/shelf/count
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countAllShelves(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countAllShelves(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countAllShelves(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить количество найденных полок
     * Получить количество полок по результатам поиска
     * @endpoint get /api/warehouse/{warehouseCode}/shelf/{shelfCode}/search/count
     * @param warehouseCode
     * @param shelfCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countSearchShelvesByCode(warehouseCode: string, shelfCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSearchShelvesByCode(warehouseCode: string, shelfCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSearchShelvesByCode(warehouseCode: string, shelfCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Скачать полки в CSV формате
     * Экспортировать данные полок со склада в CSV файл
     * @endpoint get /api/warehouse/{warehouseCode}/shelf/csv
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadShelvesCsv(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadShelvesCsv(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadShelvesCsv(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить все полки склада
     * Получить список всех полок склада с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/shelf
     * @param warehouseCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getAllShelvesByWarehouse(warehouseCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListShelfDto>;
    getAllShelvesByWarehouse(warehouseCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListShelfDto>>;
    getAllShelvesByWarehouse(warehouseCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListShelfDto>>;
    /**
     * Получить полку по коду
     * Получить информацию о конкретной полке по коду
     * @endpoint get /api/warehouse/{warehouseCode}/shelf/{shelfCode}
     * @param warehouseCode
     * @param shelfCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getShelfByCode(warehouseCode: string, shelfCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseShelfDto>;
    getShelfByCode(warehouseCode: string, shelfCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseShelfDto>>;
    getShelfByCode(warehouseCode: string, shelfCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseShelfDto>>;
    /**
     * Переместить отсутствующие полки в активные
     * Переместить все отсутствующие полки в активный статус для конкретного склада
     * @endpoint post /api/warehouse/{warehouseCode}/shelf/absentshelves/movetoshelves
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    moveAbsentShelvesToShelves(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    moveAbsentShelvesToShelves(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    moveAbsentShelvesToShelves(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Поиск полок по коду
     * Выполнить поиск полок по коду (частичное совпадение)
     * @endpoint get /api/warehouse/{warehouseCode}/shelf/{shelfCode}/search
     * @param warehouseCode
     * @param shelfCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchShelvesByCode(warehouseCode: string, shelfCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListShelfDto>;
    searchShelvesByCode(warehouseCode: string, shelfCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListShelfDto>>;
    searchShelvesByCode(warehouseCode: string, shelfCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListShelfDto>>;
    /**
     * Загрузить полки из CSV файла
     * Загрузить данные полок со склада из CSV файла
     * @endpoint post /api/warehouse/{warehouseCode}/shelf/csv
     * @param warehouseCode
     * @param file
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadShelvesCsv(warehouseCode: string, file: Blob, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadShelvesCsv(warehouseCode: string, file: Blob, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadShelvesCsv(warehouseCode: string, file: Blob, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Загрузить полки из буфера обмена
     * Загрузить данные полок со склада из строки в буфере обмена
     * @endpoint post /api/warehouse/{warehouseCode}/shelf/csv/clipboard
     * @param warehouseCode
     * @param body
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadShelvesCsvFromClipboard(warehouseCode: string, body: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadShelvesCsvFromClipboard(warehouseCode: string, body: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadShelvesCsvFromClipboard(warehouseCode: string, body: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ShelfService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ShelfService>;
}
