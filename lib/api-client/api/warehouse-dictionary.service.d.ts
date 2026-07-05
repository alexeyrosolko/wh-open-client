import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseListDictionaryRecordDto } from '../model/response-list-dictionary-record-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class WarehouseDictionaryService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Получить справочник склада по коду
     * Возвращает список записей справочника склада по его коду
     * @endpoint get /api/warehouse/{warehouseCode}/dictionary/{code}
     * @param warehouseCode
     * @param code
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getWarehouseDictionaryItemsByCode(warehouseCode: string, code: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListDictionaryRecordDto>;
    getWarehouseDictionaryItemsByCode(warehouseCode: string, code: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListDictionaryRecordDto>>;
    getWarehouseDictionaryItemsByCode(warehouseCode: string, code: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListDictionaryRecordDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<WarehouseDictionaryService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<WarehouseDictionaryService>;
}
