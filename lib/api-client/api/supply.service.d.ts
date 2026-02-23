import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FieldMapsDto } from '../model/field-maps-dto';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListSupplyDto } from '../model/response-list-supply-dto';
import { ResponseSupplyDto } from '../model/response-supply-dto';
import { ResponseUploadedFileDto } from '../model/response-uploaded-file-dto';
import { UploadSupplyUploadRecordsCsvRequest } from '../model/upload-supply-upload-records-csv-request';
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
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseSupplyDto>;
    changeSupplyState(warehouseCode: string, supplyCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseSupplyDto>>;
    changeSupplyState(warehouseCode: string, supplyCode: string, expectedState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', newState: 'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED', observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseSupplyDto>>;
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
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
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
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    deleteSupply(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    deleteSupply(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
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
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseSupplyDto>;
    getSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseSupplyDto>>;
    getSupplyByCode(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseSupplyDto>>;
    /**
     * Получить предзагруженный файл
     * Получить предзагруженный файл
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/uploadedfile
     * @param warehouseCode
     * @param supplyCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getSupplyUploadedFile(warehouseCode: string, supplyCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseUploadedFileDto>;
    getSupplyUploadedFile(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseUploadedFileDto>>;
    getSupplyUploadedFile(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseUploadedFileDto>>;
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
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListSupplyDto>;
    searchSupplies(warehouseCode: string, supplyCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListSupplyDto>>;
    searchSupplies(warehouseCode: string, supplyCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListSupplyDto>>;
    /**
     * Загрузить данные через загруженного файла
     * Загрузить данные через загруженного файла
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/record/uploadedfile/csv
     * @param warehouseCode
     * @param supplyCode
     * @param uploadSupplyUploadRecordsCsvRequest
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadFromUploadedFile(warehouseCode: string, supplyCode: string, uploadSupplyUploadRecordsCsvRequest?: UploadSupplyUploadRecordsCsvRequest, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadFromUploadedFile(warehouseCode: string, supplyCode: string, uploadSupplyUploadRecordsCsvRequest?: UploadSupplyUploadRecordsCsvRequest, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadFromUploadedFile(warehouseCode: string, supplyCode: string, uploadSupplyUploadRecordsCsvRequest?: UploadSupplyUploadRecordsCsvRequest, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Загрузить данные поставки из загруженного файла
     * Выполнить загрузку данных в указанную поставку из ранее загруженного файла
     * @endpoint post /api/warehouse/{warehouseCode}/supply/{supplyCode}/record/uploadedfile/convert
     * @param warehouseCode
     * @param supplyCode
     * @param fields
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    uploadFromUploadedFile1(warehouseCode: string, supplyCode: string, fields: FieldMapsDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    uploadFromUploadedFile1(warehouseCode: string, supplyCode: string, fields: FieldMapsDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    uploadFromUploadedFile1(warehouseCode: string, supplyCode: string, fields: FieldMapsDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<SupplyService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SupplyService>;
}
