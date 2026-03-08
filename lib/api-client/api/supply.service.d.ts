import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListSupplyAbsendArticleDto } from '../model/response-list-supply-absend-article-dto';
import { ResponseListSupplyDto } from '../model/response-list-supply-dto';
import { ResponseListSupplyRecordDto } from '../model/response-list-supply-record-dto';
import { ResponseSupplyDto } from '../model/response-supply-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class SupplyService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Изменить состояние поставки
     * Изменить состояние поставки: выполнить переход из ожидаемого состояния в новое
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/state/from/{expectedState}/to/{newState}
     * @param warehouseCode
     * @param supplyCode
     * @param expectedState
     * @param newState
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    changeSupplyState(warehouseCode: string, supplyCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseSupplyDto>;
    changeSupplyState(warehouseCode: string, supplyCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseSupplyDto>>;
    changeSupplyState(warehouseCode: string, supplyCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseSupplyDto>>;
    /**
     * Очистить записи разнесения
     * Удалить все записи разнесения в поставке
     * @endpoint delete /api/warehouse/{warehouseCode}/supply/{supplyCode}/record
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    clearSupplyRecords(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    clearSupplyRecords(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    clearSupplyRecords(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Получить количество отсутствующих товаров
     * Получить количество отсутствующих товаров в поставке
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/absendsparepart/count
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countAbsentArticlesBySupply(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countAbsentArticlesBySupply(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countAbsentArticlesBySupply(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить количество отсутствующих товаров
     * Получить количество отсутствующих товаров в поставке
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/absentsarticle/count
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countAbsentArticlesBySupply1(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countAbsentArticlesBySupply1(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countAbsentArticlesBySupply1(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Посчитать поставки по коду
     * Вернуть количество поставок, соответствующих шаблону кода
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/search/count
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить количество записей разнесения
     * Получить общее количество записей разнесения в поставке
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/record/count
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countSupplyRecords(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSupplyRecords(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSupplyRecords(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Удалить поставку
     * Удалить поставку по коду склада и коду поставки
     * @endpoint delete /api/warehouse/{warehouseCode}/supply/{supplyCode}
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    deleteSupply(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    deleteSupply(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    deleteSupply(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Скачать записи разнесения в CSV формате
     * Экспортировать данные записей разнесения в CSV файл
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/record/csv
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadSupplyRecordsCsv(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadSupplyRecordsCsv(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadSupplyRecordsCsv(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить отсутствующие товары в поставке
     * Получить список отсутствующих товаров в конкретной поставке с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/absendsparepart
     * @param warehouseCode
     * @param supplyCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getAbsentArticlesBySupply(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListSupplyAbsendArticleDto>;
    getAbsentArticlesBySupply(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListSupplyAbsendArticleDto>>;
    getAbsentArticlesBySupply(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListSupplyAbsendArticleDto>>;
    /**
     * Получить отсутствующие товары в поставке
     * Получить список отсутствующих товаров в конкретной поставке с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/absentsarticle
     * @param warehouseCode
     * @param supplyCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getAbsentArticlesBySupply1(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListSupplyAbsendArticleDto>;
    getAbsentArticlesBySupply1(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListSupplyAbsendArticleDto>>;
    getAbsentArticlesBySupply1(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListSupplyAbsendArticleDto>>;
    /**
     * Получить поставку по коду
     * Вернуть информацию о поставке по коду склада и коду поставки
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseSupplyDto>;
    getSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseSupplyDto>>;
    getSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseSupplyDto>>;
    /**
     * Получить записи разнесения поставки
     * Получить список записей разнесения (с учётом цены) для конкретной поставки с пагинацией
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/record
     * @param warehouseCode
     * @param supplyCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getSupplyRecords(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListSupplyRecordDto>;
    getSupplyRecords(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListSupplyRecordDto>>;
    getSupplyRecords(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListSupplyRecordDto>>;
    /**
     * Переместить отсутствующие товары в запчасти
     * Переместить все отсутствующие товары в статус активных запчастей
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/absendsparepart/movetospareparts
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    moveAbsentArticlesToSpareParts(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    moveAbsentArticlesToSpareParts(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    moveAbsentArticlesToSpareParts(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Переместить отсутствующие товары в запчасти
     * Переместить все отсутствующие товары в статус активных запчастей
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/absentsarticle/movetospareparts
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    moveAbsentArticlesToSpareParts1(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    moveAbsentArticlesToSpareParts1(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    moveAbsentArticlesToSpareParts1(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Поиск поставок
     * Найти список поставок по коду склада и шаблону кода поставки
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/search
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    searchSupplies(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListSupplyDto>;
    searchSupplies(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListSupplyDto>>;
    searchSupplies(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListSupplyDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<SupplyService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SupplyService>;
}
