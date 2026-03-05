import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseArticleDto } from '../model/response-article-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class ArticleService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Получить запчасть/товар по коду
     * Получить информацию о конкретной запчасти/товара по коду
     * @endpoint get /api/sparepart/{articleCode}
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getArticleByCode(articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseArticleDto>;
    getArticleByCode(articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseArticleDto>>;
    getArticleByCode(articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseArticleDto>>;
    /**
     * Получить запчасть/товар по коду
     * Получить информацию о конкретной запчасти/товара по коду
     * @endpoint get /api/warehouse/{warehouseCode}/sparepart/{articleCode}
     * @param warehouseCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getArticleByCode1(warehouseCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseArticleDto>;
    getArticleByCode1(warehouseCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseArticleDto>>;
    getArticleByCode1(warehouseCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseArticleDto>>;
    /**
     * Получить запчасть/товар по коду
     * Получить информацию о конкретной запчасти/товара по коду
     * @endpoint get /api/article/{articleCode}
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getArticleByCode2(articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseArticleDto>;
    getArticleByCode2(articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseArticleDto>>;
    getArticleByCode2(articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseArticleDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ArticleService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ArticleService>;
}
