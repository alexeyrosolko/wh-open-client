import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListOrderAbsentArticleDto } from '../model/response-list-order-absent-article-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class OrderAbsendSparePartControllerService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/absendsparepart/count
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getCount1(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    getCount1(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    getCount1(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/absendsparepart
     * @param warehouseCode
     * @param orderCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getSupplyRecords2(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListOrderAbsentArticleDto>;
    getSupplyRecords2(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListOrderAbsentArticleDto>>;
    getSupplyRecords2(warehouseCode: string, orderCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListOrderAbsentArticleDto>>;
    /**
     * @endpoint post /api/warehouse/{warehouseCode}/order/{orderCode}/absendsparepart/movetospareparts
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    moveToSpareParts(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    moveToSpareParts(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    moveToSpareParts(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderAbsendSparePartControllerService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderAbsendSparePartControllerService>;
}
