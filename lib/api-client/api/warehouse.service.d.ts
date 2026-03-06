import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListWarehouseDto } from '../model/response-list-warehouse-dto';
import { ResponseWarehouseDto } from '../model/response-warehouse-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class WarehouseService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Изменить статус склада
     * Изменить статус склада с проверкой ожидаемого статуса
     * @endpoint post /api/warehouse/{warehouseCode}/state/from/{expectedState}/to/{newState}
     * @param warehouseCode
     * @param expectedState
     * @param newState
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    changeWarehouseState(warehouseCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE', observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseWarehouseDto>;
    changeWarehouseState(warehouseCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE', observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseWarehouseDto>>;
    changeWarehouseState(warehouseCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE', observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseWarehouseDto>>;
    /**
     * Получить количество найденных складов
     * Получить количество складов по результатам поиска
     * @endpoint get /api/warehouse/{warehouseCode}/search/count
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countSearchWarehouse(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSearchWarehouse(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSearchWarehouse(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Удалить склад
     * Удалить склад по коду
     * @endpoint delete /api/warehouse/{warehouseCode}
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    deleteWarehouse(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    deleteWarehouse(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    deleteWarehouse(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Получить склад по коду
     * Получить информацию о складе по коду
     * @endpoint get /api/warehouse/{warehouseCode}
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getWarehouse(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseWarehouseDto>;
    getWarehouse(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseWarehouseDto>>;
    getWarehouse(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseWarehouseDto>>;
    /**
     * Поиск склада по коду
     * Выполнить поиск склада по коду (частичное совпадение)
     * @endpoint get /api/warehouse/{warehouseCode}/search
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchWarehouse(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListWarehouseDto>;
    searchWarehouse(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListWarehouseDto>>;
    searchWarehouse(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListWarehouseDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<WarehouseService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<WarehouseService>;
}
