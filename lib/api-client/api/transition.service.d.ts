import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InsideStockTransitionDto } from '../model/inside-stock-transition-dto';
import { OutStockTransitionDto } from '../model/out-stock-transition-dto';
import { ResponseCommonDto } from '../model/response-common-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class TransitionService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Добавить выходящий переход товара
     * Добавить выходящий переход товара (отпуск) и обновить в тенант
     * @endpoint post /api/warehouse/{warehouseCode}/transition/out
     * @param warehouseCode
     * @param outStockTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addOutStockTransition(warehouseCode: string, outStockTransitionDto: OutStockTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    addOutStockTransition(warehouseCode: string, outStockTransitionDto: OutStockTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    addOutStockTransition(warehouseCode: string, outStockTransitionDto: OutStockTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Создать внутреннее перемещение товара
     * Создать запись о перемещении товара между полками в пределах одного склада с добавлением в товаром остаток и печатью
     * @endpoint post /api/warehouse/{warehouseCode}/transition/inside
     * @param warehouseCode
     * @param insideStockTransitionDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    createInsideStockTransition(warehouseCode: string, insideStockTransitionDto: InsideStockTransitionDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    createInsideStockTransition(warehouseCode: string, insideStockTransitionDto: InsideStockTransitionDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    createInsideStockTransition(warehouseCode: string, insideStockTransitionDto: InsideStockTransitionDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<TransitionService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<TransitionService>;
}
