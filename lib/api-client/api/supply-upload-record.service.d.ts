import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseBooleanDto } from '../model/response-boolean-dto';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListSupplyUploadRecordDto } from '../model/response-list-supply-upload-record-dto';
import { ResponseSupplyUploadRecordDto } from '../model/response-supply-upload-record-dto';
import { SupplyUploadRecordDto } from '../model/supply-upload-record-dto';
import { UploadSupplyUploadRecordsCsvRequest } from '../model/upload-supply-upload-records-csv-request';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class SupplyUploadRecordService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Добавить запись поставки
     * Добавить одну запись в журнал загрузок поставки
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord
     * @param warehouseCode
     * @param supplyCode
     * @param supplyUploadRecordDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addSupplyUploadRecord(warehouseCode: string, supplyCode: string, supplyUploadRecordDto: SupplyUploadRecordDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseSupplyUploadRecordDto>;
    addSupplyUploadRecord(warehouseCode: string, supplyCode: string, supplyUploadRecordDto: SupplyUploadRecordDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseSupplyUploadRecordDto>>;
    addSupplyUploadRecord(warehouseCode: string, supplyCode: string, supplyUploadRecordDto: SupplyUploadRecordDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseSupplyUploadRecordDto>>;
    /**
     * Очистить записи загрузок
     * Удалить все записи загрузок для указанной поставки
     * @endpoint delete /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    clearSupplyUploadRecords(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    clearSupplyUploadRecords(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    clearSupplyUploadRecords(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Скопировать записи загрузок в буфер обмена
     * Скопировать записи загрузок в буфер обмена
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord/csv/clipboard
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    copySupplyUploadRecordsToClipboard(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    copySupplyUploadRecordsToClipboard(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    copySupplyUploadRecordsToClipboard(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Посчитать записи загрузок
     * Вернуть количество записей загрузок, соответствующих поставке
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord/count
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countSupplyUploadRecords(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSupplyUploadRecords(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSupplyUploadRecords(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Скачать CSV записей загрузок
     * Скачать CSV с записями загрузок для указанной поставки
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord/csv
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    downloadSupplyUploadRecordsCsv(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    downloadSupplyUploadRecordsCsv(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    downloadSupplyUploadRecordsCsv(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить записи загрузок поставки
     * Вернуть список записей загрузок для указанной поставки
     * @endpoint get /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord
     * @param warehouseCode
     * @param supplyCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getSupplyUploadRecords(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListSupplyUploadRecordDto>;
    getSupplyUploadRecords(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListSupplyUploadRecordDto>>;
    getSupplyUploadRecords(warehouseCode: string, supplyCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListSupplyUploadRecordDto>>;
    /**
     * Подготовить отсутствующие позиции
     * Выполнить проверку/подготовку отсутствующих позиций перед загрузкой или проверкой
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord/checking
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    prepareAbsentArticlesForUpload(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseBooleanDto>;
    prepareAbsentArticlesForUpload(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseBooleanDto>>;
    prepareAbsentArticlesForUpload(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseBooleanDto>>;
    /**
     * Загрузить записи поставки из CSV
     * Загрузить список записей поставки из CSV-файла и сохранить их для указанной поставки
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord/csv
     * @param warehouseCode
     * @param supplyCode
     * @param uploadSupplyUploadRecordsCsvRequest
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadSupplyUploadRecordsCsv(warehouseCode: string, supplyCode: string, uploadSupplyUploadRecordsCsvRequest?: UploadSupplyUploadRecordsCsvRequest, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadSupplyUploadRecordsCsv(warehouseCode: string, supplyCode: string, uploadSupplyUploadRecordsCsvRequest?: UploadSupplyUploadRecordsCsvRequest, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadSupplyUploadRecordsCsv(warehouseCode: string, supplyCode: string, uploadSupplyUploadRecordsCsvRequest?: UploadSupplyUploadRecordsCsvRequest, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Загрузить записи поставки из буфера обмена
     * Загрузить записи поставки из буфера обмена
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadrecord/csv/clipboard
     * @param warehouseCode
     * @param supplyCode
     * @param body
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadSupplyUploadRecordsFromClipboard(warehouseCode: string, supplyCode: string, body: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadSupplyUploadRecordsFromClipboard(warehouseCode: string, supplyCode: string, body: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadSupplyUploadRecordsFromClipboard(warehouseCode: string, supplyCode: string, body: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<SupplyUploadRecordService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SupplyUploadRecordService>;
}
