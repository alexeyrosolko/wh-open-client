import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCommonDto } from '../model/response-common-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class AbsentArticlesService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Переместить отсутствующие товары в товары
     * Переместить все отсутствующие товары/запчасти в основной список товаров
     * @endpoint post /api/sparepart/absentarticles/movetoarticles
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    moveAbsentArticlesToArticles(observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    moveAbsentArticlesToArticles(observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    moveAbsentArticlesToArticles(observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Переместить отсутствующие товары в товары
     * Переместить все отсутствующие товары/запчасти в основной список товаров
     * @endpoint post /api/warehouse/{warehouseCode}/sparepart/absentarticles/movetoarticles
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    moveAbsentArticlesToArticles1(observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    moveAbsentArticlesToArticles1(observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    moveAbsentArticlesToArticles1(observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<AbsentArticlesService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<AbsentArticlesService>;
}
