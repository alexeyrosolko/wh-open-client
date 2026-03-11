import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderTransitionDto } from '../model/order-transition-dto';
import { ResponseCommonDto } from '../model/response-common-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class OrderTransitionService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Выполнить операцию разнесения в заказе
     * Выполнить операцию разнесения в заказе
     * @endpoint post /api/warehouse/{warehouseCode}/transition/order/{orderCode}
     * @param warehouseCode
     * @param orderCode
     * @param orderTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    execOrderTransition(warehouseCode: string, orderCode: string, orderTransitionDto: OrderTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    execOrderTransition(warehouseCode: string, orderCode: string, orderTransitionDto: OrderTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    execOrderTransition(warehouseCode: string, orderCode: string, orderTransitionDto: OrderTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Откатить последнее разнесение выполненное текущим пользователем
     * Откатить последнее разнесение выполненное текущим пользователем
     * @endpoint put /api/warehouse/{warehouseCode}/transition/order/{orderCode}/rollback
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    rollbackOrderTransition(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    rollbackOrderTransition(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    rollbackOrderTransition(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderTransitionService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderTransitionService>;
}
