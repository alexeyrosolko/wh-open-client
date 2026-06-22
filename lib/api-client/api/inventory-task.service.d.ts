import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseListTaskDto } from '../model/response-list-task-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class InventoryTaskService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Получить задачи по инвентаризации
     * Получить список задач для указанной инвентаризации на складе
     * @endpoint get /api/warehouse/{warehouseCode}/inventory/{inventoryCode}/task
     * @param warehouseCode
     * @param inventoryCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getInventoryTasksByInventoryCode(warehouseCode: string, inventoryCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListTaskDto>;
    getInventoryTasksByInventoryCode(warehouseCode: string, inventoryCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListTaskDto>>;
    getInventoryTasksByInventoryCode(warehouseCode: string, inventoryCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListTaskDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<InventoryTaskService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<InventoryTaskService>;
}
