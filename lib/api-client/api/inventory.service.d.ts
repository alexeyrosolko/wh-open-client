import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseInventoryDto } from '../model/response-inventory-dto';
import { ResponseListInventoryDto } from '../model/response-list-inventory-dto';
import { ResponseListInventoryShelvedRecordDto } from '../model/response-list-inventory-shelved-record-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class InventoryService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Изменить состояние инвентаризации
     * @endpoint post /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}/state/from/{expectedState}/to/{newState}
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param expectedState
     * @param newState
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    changeInventoryState(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseInventoryDto>;
    changeInventoryState(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseInventoryDto>>;
    changeInventoryState(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseInventoryDto>>;
    /**
     * Очистить записи инвентаризации
     * @endpoint delete /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}/record
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    clearInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    clearInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    clearInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Посчитать инвентаризации по коду
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}/search/count
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countInventoryByCode(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countInventoryByCode(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countInventoryByCode(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Количество записей инвентаризации
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}/record/count
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Скачать записи инвентаризации в CSV
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}/record/csv
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadInventoryShelvedRecordsCsv(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadInventoryShelvedRecordsCsv(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadInventoryShelvedRecordsCsv(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить инвентаризацию по коду
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getInventoryByCode(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseInventoryDto>;
    getInventoryByCode(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseInventoryDto>>;
    getInventoryByCode(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseInventoryDto>>;
    /**
     * Получить записи инвентаризации
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}/record
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListInventoryShelvedRecordDto>;
    getInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListInventoryShelvedRecordDto>>;
    getInventoryShelvedRecords(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListInventoryShelvedRecordDto>>;
    /**
     * Поиск инвентаризаций
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/{inventoryCode}/search
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchInventories(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListInventoryDto>;
    searchInventories(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListInventoryDto>>;
    searchInventories(warehouseCode: string, inventoryProcessCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListInventoryDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<InventoryService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<InventoryService>;
}
