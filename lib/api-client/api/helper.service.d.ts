import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class HelperService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Возвращает HttpHeaders.AUTHORIZATION
     * Возвращает HttpHeaders.AUTHORIZATION
     * @endpoint get /api/admin/AUTHORIZATION
     * @param authorization
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getAuthorization(authorization: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    getAuthorization(authorization: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    getAuthorization(authorization: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    /**
     * helloWorld
     * helloWorld
     * @endpoint get /api/admin
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    helloWorld(observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<string>;
    helloWorld(observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<string>>;
    helloWorld(observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'text/plain';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<string>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<HelperService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<HelperService>;
}
