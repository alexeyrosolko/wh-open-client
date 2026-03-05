import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCommonDto } from '../model/response-common-dto';
import { SupplyTransitionDto } from '../model/supply-transition-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class SupplyTransitionService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Выполнить операцию разнесения в приходе
     * Выполнить операцию разнесения в приходе
     * @endpoint post /api/warehouse/{warehouseCode}/transition/supply/{supplyCode}
     * @param warehouseCode
     * @param supplyCode
     * @param supplyTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    execSupplyTransition(warehouseCode: string, supplyCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    execSupplyTransition(warehouseCode: string, supplyCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    execSupplyTransition(warehouseCode: string, supplyCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Откатить последнее разнесение выполненное текущим пользователем
     * Откатить последнее разнесение выполненное текущим пользователем
     * @endpoint put /api/warehouse/{warehouseCode}/transition/supply/{supplyCode}/rollback
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    rollbackSupplyTransition(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    rollbackSupplyTransition(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    rollbackSupplyTransition(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<SupplyTransitionService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SupplyTransitionService>;
}
