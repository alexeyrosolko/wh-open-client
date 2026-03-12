import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListStockDto } from '../model/response-list-stock-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class StockService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Очистить товар на складе
     * Удалить все товары со склада
     * @endpoint delete /api/warehouse/{warehouseCode}/stock
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    clearStock(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    clearStock(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    clearStock(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Отчет по складу. Получить общее количество товара
     * Отчет по складу. Получить общее количество товара на складе
     * @endpoint get /api/warehouse/{warehouseCode}/stock/count
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countAllStock(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countAllStock(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countAllStock(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Отчет по складу. Получить количество товара по коду полки
     * Отчет по складу. Получить общее количество товара на конкретной полке
     * @endpoint get /api/warehouse/{warehouseCode}/stock/shelf/{shelfCode}/count
     * @param warehouseCode
     * @param shelfCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countStockByShelfCode(warehouseCode: string, shelfCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countStockByShelfCode(warehouseCode: string, shelfCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countStockByShelfCode(warehouseCode: string, shelfCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Отчет по складу. Получить количество товара по коду товара
     * Отчет по складу. Получить общее количество товара по коду товара на складе
     * @endpoint get /api/warehouse/{warehouseCode}/stock/sparepart/{articleCode}/count
     * @param warehouseCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countStockBySparePartCode(warehouseCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countStockBySparePartCode(warehouseCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countStockBySparePartCode(warehouseCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Отчет по складу. Получить количество товара по коду товара
     * Отчет по складу. Получить общее количество товара по коду товара на складе
     * @endpoint get /api/warehouse/{warehouseCode}/stock/article/{articleCode}/count
     * @param warehouseCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countStockBySparePartCode1(warehouseCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countStockBySparePartCode1(warehouseCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countStockBySparePartCode1(warehouseCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Отчет по складу. Получить товары по коду полки в CSV
     * Отчет по складу. Получить товары по коду полки в CSV
     * @endpoint get /api/warehouse/{warehouseCode}/stock/shelf/{shelfCode}/csv
     * @param warehouseCode
     * @param shelfCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadStockByShelfCode(warehouseCode: string, shelfCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadStockByShelfCode(warehouseCode: string, shelfCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadStockByShelfCode(warehouseCode: string, shelfCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Отчет по складу. Получить товары по коду товара в CSV
     * Отчет по складу. Получить товары по коду товара в CSV
     * @endpoint get /api/warehouse/{warehouseCode}/stock/sparepart/{articleCode}/csv
     * @param warehouseCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadStockBySparePartCode(warehouseCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadStockBySparePartCode(warehouseCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadStockBySparePartCode(warehouseCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Отчет по складу. Получить товары по коду товара в CSV
     * Отчет по складу. Получить товары по коду товара в CSV
     * @endpoint get /api/warehouse/{warehouseCode}/stock/article/{articleCode}/csv
     * @param warehouseCode
     * @param articleCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadStockBySparePartCode1(warehouseCode: string, articleCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadStockBySparePartCode1(warehouseCode: string, articleCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadStockBySparePartCode1(warehouseCode: string, articleCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Отчет по складу. Скачать товар в CSV формате
     * Отчет по складу. Экспортировать данные товара со склада в CSV файл
     * @endpoint get /api/warehouse/{warehouseCode}/stock/csv
     * @param warehouseCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadStockCsv(warehouseCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadStockCsv(warehouseCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadStockCsv(warehouseCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Отчет по складу. Получить весь товар на складе
     * Отчет по складу. Получить список всего товара на складе с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/stock
     * @param warehouseCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getAllStock(warehouseCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListStockDto>;
    getAllStock(warehouseCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListStockDto>>;
    getAllStock(warehouseCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListStockDto>>;
    /**
     * Отчет по складу. Получить товар по коду полки
     * Отчет по складу. Получить список товара на конкретной полке склада с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/stock/shelf/{shelfCode}
     * @param warehouseCode
     * @param shelfCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getStockByShelfCode(warehouseCode: string, shelfCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListStockDto>;
    getStockByShelfCode(warehouseCode: string, shelfCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListStockDto>>;
    getStockByShelfCode(warehouseCode: string, shelfCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListStockDto>>;
    /**
     * Отчет по складу. Получить товар по коду товара
     * Отчет по складу. Получить список товаров на всех полках склада по коду товара с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/stock/article/{articleCode}
     * @param warehouseCode
     * @param articleCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getStockBySparePartCode(warehouseCode: string, articleCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListStockDto>;
    getStockBySparePartCode(warehouseCode: string, articleCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListStockDto>>;
    getStockBySparePartCode(warehouseCode: string, articleCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListStockDto>>;
    /**
     * Отчет по складу. Получить товар по коду товара
     * Отчет по складу. Получить список товаров на всех полках склада по коду товара с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/stock/sparepart/{articleCode}
     * @param warehouseCode
     * @param articleCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getStockBySparePartCode1(warehouseCode: string, articleCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListStockDto>;
    getStockBySparePartCode1(warehouseCode: string, articleCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListStockDto>>;
    getStockBySparePartCode1(warehouseCode: string, articleCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListStockDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<StockService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<StockService>;
}
