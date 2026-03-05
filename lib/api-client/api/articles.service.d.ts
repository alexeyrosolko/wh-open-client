import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArticleDto } from '../model/article-dto';
import { Pageable } from '../model/pageable';
import { ResponseArticleDto } from '../model/response-article-dto';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListArticleDto } from '../model/response-list-article-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class ArticlesService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Добавить запчасть/товар
     * Добавить новую запчасть/товар в тенант
     * @endpoint post /api/warehouse/{warehouseCode}/sparepart
     * @param warehouseCode
     * @param articleDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addArticle(warehouseCode: string, articleDto: ArticleDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseArticleDto>;
    addArticle(warehouseCode: string, articleDto: ArticleDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseArticleDto>>;
    addArticle(warehouseCode: string, articleDto: ArticleDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseArticleDto>>;
    /**
     * Добавить запчасть/товар
     * Добавить новую запчасть/товар в тенант
     * @endpoint post /api/sparepart
     * @param articleDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addArticle1(articleDto: ArticleDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseArticleDto>;
    addArticle1(articleDto: ArticleDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseArticleDto>>;
    addArticle1(articleDto: ArticleDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseArticleDto>>;
    /**
     * Получить количество запчастей/товаров
     * Получить общее количество запчастей/товаров в складе
     * @endpoint get /api/sparepart/count
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countArticles(observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countArticles(observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countArticles(observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить количество запчастей/товаров
     * Получить общее количество запчастей/товаров в складе
     * @endpoint get /api/warehouse/{warehouseCode}/sparepart/count
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countArticles1(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countArticles1(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countArticles1(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить количество найденных запчастей/товаров
     * Получить количество запчастей/товаров по результатам поиска
     * @endpoint get /api/sparepart/{articleCode}/search/count
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countSearchArticles(articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSearchArticles(articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSearchArticles(articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить количество найденных запчастей/товаров
     * Получить количество запчастей/товаров по результатам поиска
     * @endpoint get /api/warehouse/{warehouseCode}/sparepart/{articleCode}/search/count
     * @param warehouseCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countSearchArticles1(warehouseCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSearchArticles1(warehouseCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSearchArticles1(warehouseCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Скачать запчасти/товары в CSV
     * Скачать список всех запчастей/товаров в формате CSV
     * @endpoint get /api/sparepart/csv
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadArticlesCsv(observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadArticlesCsv(observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadArticlesCsv(observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Скачать запчасти/товары в CSV
     * Скачать список всех запчастей/товаров в формате CSV
     * @endpoint get /api/warehouse/{warehouseCode}/sparepart/csv
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadArticlesCsv1(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadArticlesCsv1(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadArticlesCsv1(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить все запчасти/товары склада
     * Получить список всех запчастей/товаров для указанного склада с поддержкой пагинации
     * @endpoint get /api/warehouse/{warehouseCode}/sparepart
     * @param warehouseCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getArticlesByWarehouse(warehouseCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListArticleDto>;
    getArticlesByWarehouse(warehouseCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListArticleDto>>;
    getArticlesByWarehouse(warehouseCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListArticleDto>>;
    /**
     * Получить все запчасти/товары склада
     * Получить список всех запчастей/товаров для указанного склада с поддержкой пагинации
     * @endpoint get /api/sparepart
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getArticlesByWarehouse1(pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListArticleDto>;
    getArticlesByWarehouse1(pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListArticleDto>>;
    getArticlesByWarehouse1(pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListArticleDto>>;
    /**
     * Поиск запчастей/товаров по коду
     * Выполнить поиск запчастей/товаров по коду (частичное совпадение)
     * @endpoint get /api/warehouse/{warehouseCode}/sparepart/{articleCode}/search
     * @param warehouseCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchArticles(warehouseCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListArticleDto>;
    searchArticles(warehouseCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListArticleDto>>;
    searchArticles(warehouseCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListArticleDto>>;
    /**
     * Поиск запчастей/товаров по коду
     * Выполнить поиск запчастей/товаров по коду (частичное совпадение)
     * @endpoint get /api/sparepart/{articleCode}/search
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchArticles1(articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListArticleDto>;
    searchArticles1(articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListArticleDto>>;
    searchArticles1(articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListArticleDto>>;
    /**
     * Загрузить запчасти/товары из CSV
     * Загрузить список запчастей/товаров из CSV файла
     * @endpoint post /api/sparepart/csv
     * @param file
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadArticlesCsv(file: Blob, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadArticlesCsv(file: Blob, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadArticlesCsv(file: Blob, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Загрузить запчасти/товары из CSV
     * Загрузить список запчастей/товаров из CSV файла
     * @endpoint post /api/warehouse/{warehouseCode}/sparepart/csv
     * @param warehouseCode
     * @param file
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadArticlesCsv1(warehouseCode: string, file: Blob, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadArticlesCsv1(warehouseCode: string, file: Blob, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadArticlesCsv1(warehouseCode: string, file: Blob, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ArticlesService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ArticlesService>;
}
