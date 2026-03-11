import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseListTaskDto } from '../model/response-list-task-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class OrderTaskService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * getOrderTasksByOrderCode
     * getOrderTasksByOrderCode
     * @endpoint get /api/warehouse/{warehouseCode}/order/{orderCode}/task
     * @param warehouseCode
     * @param orderCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getOrderTasksByOrderCode(warehouseCode: string, orderCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListTaskDto>;
    getOrderTasksByOrderCode(warehouseCode: string, orderCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListTaskDto>>;
    getOrderTasksByOrderCode(warehouseCode: string, orderCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListTaskDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<OrderTaskService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OrderTaskService>;
}
