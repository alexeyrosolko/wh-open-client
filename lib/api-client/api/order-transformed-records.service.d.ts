import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListOrderTransformedRecordDto } from '../model/response-list-order-transformed-record-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class OrderTransformedRecordsService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Количество записей заказа
     * Получить количество записей заказа
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/transformed/count
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countOrderRecords(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countOrderRecords(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countOrderRecords(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить записи заказа
     * Получить список записей заказа с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/transformed
     * @param warehouseCode
     * @param orderCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOrderRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListOrderTransformedRecordDto>;
    getOrderRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListOrderTransformedRecordDto>>;
    getOrderRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListOrderTransformedRecordDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderTransformedRecordsService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderTransformedRecordsService>;
}
