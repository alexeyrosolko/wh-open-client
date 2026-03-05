import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseCommonDto } from '../model/response-common-dto';
import { ResponsePrintTaskDto } from '../model/response-print-task-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class PrintAgentService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Удалить задание агента
     * Удалить задание агента по id
     * @endpoint delete /api/print/agent/tenant/{tenantCode}/printer/{printerCode}
     * @param taskId
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    deleteAgentTask(taskId: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    deleteAgentTask(taskId: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    deleteAgentTask(taskId: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    /**
     * Получить задание для агента печати и удалить его
     * Получить первое доступное задание для указанного принтера и тенанта и удалить его
     * @endpoint get /api/print/agent/tenant/{tenantCode}/printer/{printerCode}/image/delete
     * @param tenantCode
     * @param printerCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getImageAndDeleteImageTaskForPrinter(tenantCode: string, printerCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    getImageAndDeleteImageTaskForPrinter(tenantCode: string, printerCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    getImageAndDeleteImageTaskForPrinter(tenantCode: string, printerCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить задание для агента печати
     * Получить первое доступное задание для указанного принтера и тенанта
     * @endpoint get /api/print/agent/tenant/{tenantCode}/printer/{printerCode}/image
     * @param tenantCode
     * @param printerCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getImageForPrinter(tenantCode: string, printerCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    getImageForPrinter(tenantCode: string, printerCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    getImageForPrinter(tenantCode: string, printerCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'image/png';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * Получить задание для агента печати
     * Получить первое доступное задание для указанного принтера и тенанта
     * @endpoint get /api/print/agent/tenant/{tenantCode}/printer/{printerCode}
     * @param tenantCode
     * @param printerCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getImageTask(tenantCode: string, printerCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponsePrintTaskDto>;
    getImageTask(tenantCode: string, printerCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponsePrintTaskDto>>;
    getImageTask(tenantCode: string, printerCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponsePrintTaskDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<PrintAgentService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<PrintAgentService>;
}
