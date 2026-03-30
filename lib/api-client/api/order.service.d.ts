import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseOrderDto } from '../model/response-order-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class OrderService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Изменить статус заказа
     * Изменить состояние указанного заказа
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/state/from/{expectedState}/to/{newState}
     * @param warehouseCode
     * @param orderCode
     * @param expectedState
     * @param newState
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    changeOrderState(warehouseCode: string, orderCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED', observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderDto>;
    changeOrderState(warehouseCode: string, orderCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED', observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderDto>>;
    changeOrderState(warehouseCode: string, orderCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED', observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderDto>>;
    /**
     * Удалить заказ
     * Удалить заказ по коду склада и коду заказа
     * @endpoint delete /api/warehouse/{warehouseCode}/order/{orderCode}
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    deleteOrder(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    deleteOrder(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    deleteOrder(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Получить заказ по коду
     * Вернуть заказ по коду склада и коду заказа
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOrderByCode(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderDto>;
    getOrderByCode(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderDto>>;
    getOrderByCode(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderService>;
}
