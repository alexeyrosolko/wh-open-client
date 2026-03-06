import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListShelfDto } from '../model/response-list-shelf-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class AbsentShelfService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Переместить отсутствующие полки в активные
     * Переместить все отсутствующие полки в активный статус для конкретного склада
     * @endpoint post /api/warehouse/{warehouseCode}/shelf/absentshelves/move
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addWarehouseAbsentShelves(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    addWarehouseAbsentShelves(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    addWarehouseAbsentShelves(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Переместить отсутствующие полки в полки
     * Переместить все отсутствующие полки/запчасти в основной список товаров
     * @endpoint get /api/warehouse/{warehouseCode}/shelf/absentshelves/count
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countWarehouseAbsentShelves(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countWarehouseAbsentShelves(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countWarehouseAbsentShelves(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Переместить отсутствующие полки в полки
     * Переместить все отсутствующие полки/запчасти в основной список товаров
     * @endpoint get /api/warehouse/{warehouseCode}/shelf/absentshelves
     * @param warehouseCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getWarehouseAbsentShelves(warehouseCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListShelfDto>;
    getWarehouseAbsentShelves(warehouseCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListShelfDto>>;
    getWarehouseAbsentShelves(warehouseCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListShelfDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<AbsentShelfService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<AbsentShelfService>;
}
