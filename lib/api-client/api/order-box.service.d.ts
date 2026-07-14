import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderBoxDto } from '../model/order-box-dto';
import { ResponseListOrderBoxDto } from '../model/response-list-order-box-dto';
import { ResponseOrderBoxDto } from '../model/response-order-box-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class OrderBoxService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Закрыть коробку
     * Закрыть текущую открытую коробку заказа
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/box/close
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    closeCurrentOrderBox(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderBoxDto>;
    closeCurrentOrderBox(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderBoxDto>>;
    closeCurrentOrderBox(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderBoxDto>>;
    /**
     * Получить открытую коробку
     * Вернуть текущую открытую коробку заказа
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/box/open
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOpenOrderBox(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderBoxDto>;
    getOpenOrderBox(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderBoxDto>>;
    getOpenOrderBox(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderBoxDto>>;
    /**
     * Получить коробку по коду
     * Вернуть коробку заказа по коду коробки
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/box/code/{boxCode}
     * @param warehouseCode
     * @param orderCode
     * @param boxCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOrderBoxByCode(warehouseCode: string, orderCode: string, boxCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderBoxDto>;
    getOrderBoxByCode(warehouseCode: string, orderCode: string, boxCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderBoxDto>>;
    getOrderBoxByCode(warehouseCode: string, orderCode: string, boxCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderBoxDto>>;
    /**
     * Получить коробки заказа
     * Вернуть список коробок для выбытия указанного заказа
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/box
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOrderBoxesByOrderCode(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListOrderBoxDto>;
    getOrderBoxesByOrderCode(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListOrderBoxDto>>;
    getOrderBoxesByOrderCode(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListOrderBoxDto>>;
    /**
     * Следующая коробка
     * Закрыть текущую открытую коробку заказа (если есть) и открыть новую
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/box/next
     * @param warehouseCode
     * @param orderCode
     * @param orderBoxDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    nextOrderBox(warehouseCode: string, orderCode: string, orderBoxDto: OrderBoxDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderBoxDto>;
    nextOrderBox(warehouseCode: string, orderCode: string, orderBoxDto: OrderBoxDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderBoxDto>>;
    nextOrderBox(warehouseCode: string, orderCode: string, orderBoxDto: OrderBoxDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderBoxDto>>;
    /**
     * Открыть коробку
     * Открыть новую коробку для выбытия заказа
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/box
     * @param warehouseCode
     * @param orderCode
     * @param orderBoxDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    openOrderBox(warehouseCode: string, orderCode: string, orderBoxDto: OrderBoxDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseOrderBoxDto>;
    openOrderBox(warehouseCode: string, orderCode: string, orderBoxDto: OrderBoxDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseOrderBoxDto>>;
    openOrderBox(warehouseCode: string, orderCode: string, orderBoxDto: OrderBoxDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseOrderBoxDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderBoxService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderBoxService>;
}
