import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ToStockTransitionDto } from '../model/to-stock-transition-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class ToStockTransitionService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Добавить переход на склад (to-stock)
     * Создать операцию перехода на склад и добавить соответствующие действия по приёму
     * @endpoint post /warehouse/{warehouseCode}/transition/to
     * @param warehouseCode
     * @param toStockTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addToStockTransition(warehouseCode: string, toStockTransitionDto: ToStockTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    addToStockTransition(warehouseCode: string, toStockTransitionDto: ToStockTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    addToStockTransition(warehouseCode: string, toStockTransitionDto: ToStockTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Добавить переход на склад (to-stock)
     * Создать операцию перехода на склад и добавить соответствующие действия по приёму
     * @endpoint post /api/warehouse/{warehouseCode}/transition/to
     * @param warehouseCode
     * @param toStockTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addToStockTransition1(warehouseCode: string, toStockTransitionDto: ToStockTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    addToStockTransition1(warehouseCode: string, toStockTransitionDto: ToStockTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    addToStockTransition1(warehouseCode: string, toStockTransitionDto: ToStockTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ToStockTransitionService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ToStockTransitionService>;
}
