import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrintNameBarCountPayload } from '../model/print-name-bar-count-payload';
import { PrintSringPayload } from '../model/print-sring-payload';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class ImageService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Получить изображение штрих-кода
     * Получить изображение штрих-кода в формате PNG по коду
     * @endpoint post /api/barcode
     * @param printNameBarCountPayloadPrintSringPayload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getBarImage(printNameBarCountPayloadPrintSringPayload: PrintNameBarCountPayload | PrintSringPayload, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    getBarImage(printNameBarCountPayloadPrintSringPayload: PrintNameBarCountPayload | PrintSringPayload, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    getBarImage(printNameBarCountPayloadPrintSringPayload: PrintNameBarCountPayload | PrintSringPayload, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ImageService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ImageService>;
}
