import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCommonDto } from '../model/response-common-dto';
import { SupplyTransitionDto } from '../model/supply-transition-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class SuppliesTransitionService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Добавить переход поставок
     * Создать переход для набора поставок и выполнить проверку состояния с добавлением в склад
     * @endpoint post /warehouse/{warehouseCode}/transition/supply
     * @param warehouseCode
     * @param supplyTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addSuppliesTransition(warehouseCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    addSuppliesTransition(warehouseCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    addSuppliesTransition(warehouseCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Добавить переход поставок
     * Создать переход для набора поставок и выполнить проверку состояния с добавлением в склад
     * @endpoint post /api/warehouse/{warehouseCode}/transition/supply
     * @param warehouseCode
     * @param supplyTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addSuppliesTransition1(warehouseCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    addSuppliesTransition1(warehouseCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    addSuppliesTransition1(warehouseCode: string, supplyTransitionDto: SupplyTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<SuppliesTransitionService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SuppliesTransitionService>;
}
