import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderDto } from '../model/order-dto';
import { OrderUploadRecordDto } from '../model/order-upload-record-dto';
import { Pageable } from '../model/pageable';
import { ResponseBooleanDto } from '../model/response-boolean-dto';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListOrderRecordDto } from '../model/response-list-order-record-dto';
import { ResponseListOrderUploadRecordDto } from '../model/response-list-order-upload-record-dto';
import { ResponseOrderDto } from '../model/response-order-dto';
import { ResponseOrderRecordDto } from '../model/response-order-record-dto';
import { ResponseOrderUploadRecordDto } from '../model/response-order-upload-record-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class OrderService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Добавить запись загрузки заказа
     * Добавить запись загрузки заказа
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/uploadrecord
     * @param warehouseCode
     * @param orderCode
     * @param orderUploadRecordDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addOrderUploadRecord(warehouseCode: string, orderCode: string, orderUploadRecordDto: OrderUploadRecordDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderUploadRecordDto>;
    addOrderUploadRecord(warehouseCode: string, orderCode: string, orderUploadRecordDto: OrderUploadRecordDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderUploadRecordDto>>;
    addOrderUploadRecord(warehouseCode: string, orderCode: string, orderUploadRecordDto: OrderUploadRecordDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderUploadRecordDto>>;
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
     * Проверить отсутствующие запчасти
     * Проверить отсутствующие запчасти для заказа
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/uploadrecord/checking
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    checkOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseBooleanDto>;
    checkOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseBooleanDto>>;
    checkOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseBooleanDto>>;
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
     * Очистить записи загрузки заказа
     * Удалить все записи загрузки заказа
     * @endpoint delete /api/warehouse/{warehouseCode}/order/{orderCode}/uploadrecord
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    clearOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    clearOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    clearOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
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
     * Получить количество записей загрузки
     * Получить количество записей загрузки заказа
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/uploadrecord/count
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countOrderUploadRecords(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
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
     * Скачать записи загрузки заказа в CSV
     * Экспортировать записи загрузки заказа в CSV
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/uploadrecord/csv
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadOrderUploadRecordsCsv(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadOrderUploadRecordsCsv(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadOrderUploadRecordsCsv(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
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
     * Получить запись заказа по запчасти
     * Получить запись заказа по коду запчасти
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/record/sparepart/{articleCode}
     * @param warehouseCode
     * @param orderCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOrderRecordByArticle(warehouseCode: string, orderCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderRecordDto>;
    getOrderRecordByArticle(warehouseCode: string, orderCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderRecordDto>>;
    getOrderRecordByArticle(warehouseCode: string, orderCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderRecordDto>>;
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
     * Получить записи загрузки заказа
     * Получить список записей загрузки заказа
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/uploadrecord
     * @param warehouseCode
     * @param orderCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOrderUploadRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListOrderUploadRecordDto>;
    getOrderUploadRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListOrderUploadRecordDto>>;
    getOrderUploadRecords(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListOrderUploadRecordDto>>;
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
    /**
     * Загрузить записи заказа из CSV
     * Загрузить данные записей заказа из CSV файла
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/uploadrecord/csv
     * @param warehouseCode
     * @param orderCode
     * @param file
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadOrderRecordsCsv(warehouseCode: string, orderCode: string, file: Blob, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadOrderRecordsCsv(warehouseCode: string, orderCode: string, file: Blob, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadOrderRecordsCsv(warehouseCode: string, orderCode: string, file: Blob, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Загрузить записи заказа из CSV
     * Загрузить данные записей заказа из CSV файла
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/record/part/csv
     * @param warehouseCode
     * @param orderCode
     * @param file
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadOrderRecordsCsv1(warehouseCode: string, orderCode: string, file: Blob, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadOrderRecordsCsv1(warehouseCode: string, orderCode: string, file: Blob, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadOrderRecordsCsv1(warehouseCode: string, orderCode: string, file: Blob, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderService>;
}
