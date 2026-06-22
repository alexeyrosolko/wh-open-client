import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseInventoryDto } from '../model/response-inventory-dto';
import { ResponseListInventoryDto } from '../model/response-list-inventory-dto';
import { ResponseListInventoryRecordDto } from '../model/response-list-inventory-record-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class InventoryService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Изменить состояние инвентаризации
     * Изменить состояние инвентаризации: выполнить переход из ожидаемого состояния в новое
     * @endpoint post /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/state/from/{expectedState}/to/{newState}
     * @param warehouseCode
     * @param inventoryCode
     * @param expectedState
     * @param newState
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    changeInventoryState(warehouseCode: string, inventoryCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseInventoryDto>;
    changeInventoryState(warehouseCode: string, inventoryCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseInventoryDto>>;
    changeInventoryState(warehouseCode: string, inventoryCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseInventoryDto>>;
    /**
     * Очистить записи инвентаризации
     * Удалить все записи инвентаризации
     * @endpoint delete /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/record
     * @param warehouseCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    clearInventoryRecords(warehouseCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    clearInventoryRecords(warehouseCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    clearInventoryRecords(warehouseCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Посчитать инвентаризации по коду
     * Вернуть количество инвентаризаций, соответствующих шаблону кода
     * @endpoint get /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/search/count
     * @param warehouseCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countInventoryByCode(warehouseCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countInventoryByCode(warehouseCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countInventoryByCode(warehouseCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить количество записей инвентаризации
     * Получить общее количество записей в инвентаризации
     * @endpoint get /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/record/count
     * @param warehouseCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countInventoryRecords(warehouseCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countInventoryRecords(warehouseCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countInventoryRecords(warehouseCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Скачать записи инвентаризации в CSV
     * Экспортировать записи инвентаризации в CSV файл
     * @endpoint get /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/record/csv
     * @param warehouseCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadInventoryRecordsCsv(warehouseCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadInventoryRecordsCsv(warehouseCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadInventoryRecordsCsv(warehouseCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить инвентаризацию по коду
     * Вернуть информацию об инвентаризации по коду склада и коду инвентаризации
     * @endpoint get /api/warehouse/{warehouseCode}/inventory/{inventoryCode}
     * @param warehouseCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getInventoryByCode(warehouseCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseInventoryDto>;
    getInventoryByCode(warehouseCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseInventoryDto>>;
    getInventoryByCode(warehouseCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseInventoryDto>>;
    /**
     * Получить записи инвентаризации
     * Получить список записей инвентаризации с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/record
     * @param warehouseCode
     * @param inventoryCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getInventoryRecords(warehouseCode: string, inventoryCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListInventoryRecordDto>;
    getInventoryRecords(warehouseCode: string, inventoryCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListInventoryRecordDto>>;
    getInventoryRecords(warehouseCode: string, inventoryCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListInventoryRecordDto>>;
    /**
     * Поиск инвентаризаций
     * Найти список инвентаризаций по коду склада и шаблону кода инвентаризации
     * @endpoint get /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/search
     * @param warehouseCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchInventories(warehouseCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListInventoryDto>;
    searchInventories(warehouseCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListInventoryDto>>;
    searchInventories(warehouseCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListInventoryDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<InventoryService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<InventoryService>;
}
