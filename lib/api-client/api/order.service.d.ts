import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderDto } from '../model/order-dto';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListOrderRecordDto } from '../model/response-list-order-record-dto';
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
     * Очистить записи заказа
     * Удалить все записи заказа
     * @endpoint delete /api/warehouse/{warehouseCode}/order/{orderCode}/record
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    clearOrderRecords(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    clearOrderRecords(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    clearOrderRecords(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Количество записей заказа
     * Получить количество записей заказа
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/record/count
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
     * Скачать записи заказа в CSV
     * Экспортировать записи заказа в CSV
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/record/part/csv
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadOrderRecordsCsv(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadOrderRecordsCsv(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadOrderRecordsCsv(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
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
    /**
     * Получить записи заказа
     * Получить список записей заказа с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/record
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
    }): Observable<ResponseListOrderRecordDto>;
    getOrderRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListOrderRecordDto>>;
    getOrderRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListOrderRecordDto>>;
    /**
     * Обновить состояние заказа
     * Обновить состояние существующего заказа
     * @endpoint put /api/warehouse/{warehouseCode}/order/{orderCode}/state
     * @param warehouseCode
     * @param orderCode
     * @param orderDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    updateOrderState(warehouseCode: string, orderCode: string, orderDto: OrderDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderDto>;
    updateOrderState(warehouseCode: string, orderCode: string, orderDto: OrderDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderDto>>;
    updateOrderState(warehouseCode: string, orderCode: string, orderDto: OrderDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderService>;
}
