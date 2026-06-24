import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseInventoryProcessDto } from '../model/response-inventory-process-dto';
import { ResponseListInventoryProcessDto } from '../model/response-list-inventory-process-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class InventoryProcessService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Изменить состояние процесса инвентаризации
     * @endpoint post /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/state/from/{expectedState}/to/{newState}
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param expectedState
     * @param newState
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    changeInventoryProcessState(warehouseCode: string, inventoryProcessCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseInventoryProcessDto>;
    changeInventoryProcessState(warehouseCode: string, inventoryProcessCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseInventoryProcessDto>>;
    changeInventoryProcessState(warehouseCode: string, inventoryProcessCode: string, expectedState: 'UPLOADING' | 'CLOSED', newState: 'UPLOADING' | 'CLOSED', observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseInventoryProcessDto>>;
    /**
     * Посчитать процессы по коду
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/search/count
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countInventoryProcessByCode(warehouseCode: string, inventoryProcessCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countInventoryProcessByCode(warehouseCode: string, inventoryProcessCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countInventoryProcessByCode(warehouseCode: string, inventoryProcessCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить процесс инвентаризации по коду
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getInventoryProcessByCode(warehouseCode: string, inventoryProcessCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseInventoryProcessDto>;
    getInventoryProcessByCode(warehouseCode: string, inventoryProcessCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseInventoryProcessDto>>;
    getInventoryProcessByCode(warehouseCode: string, inventoryProcessCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseInventoryProcessDto>>;
    /**
     * Поиск процессов инвентаризации
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/search
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchInventoryProcesses(warehouseCode: string, inventoryProcessCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListInventoryProcessDto>;
    searchInventoryProcesses(warehouseCode: string, inventoryProcessCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListInventoryProcessDto>>;
    searchInventoryProcesses(warehouseCode: string, inventoryProcessCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListInventoryProcessDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<InventoryProcessService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<InventoryProcessService>;
}
