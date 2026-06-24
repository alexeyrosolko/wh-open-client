import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryDto } from '../model/inventory-dto';
import { Pageable } from '../model/pageable';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseInventoryDto } from '../model/response-inventory-dto';
import { ResponseListInventoryDto } from '../model/response-list-inventory-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class InventoriesService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Создать инвентаризацию
     * @endpoint post /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param inventoryDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    addInventory(warehouseCode: string, inventoryProcessCode: string, inventoryDto: InventoryDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseInventoryDto>;
    addInventory(warehouseCode: string, inventoryProcessCode: string, inventoryDto: InventoryDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseInventoryDto>>;
    addInventory(warehouseCode: string, inventoryProcessCode: string, inventoryDto: InventoryDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseInventoryDto>>;
    /**
     * Получить количество инвентаризаций
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory/count
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    countAllInventories(warehouseCode: string, inventoryProcessCode: string, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    countAllInventories(warehouseCode: string, inventoryProcessCode: string, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    countAllInventories(warehouseCode: string, inventoryProcessCode: string, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    /**
     * Получить все инвентаризации
     * @endpoint get /api/warehouse/{warehouseCode}/inventoryprocess/{inventoryProcessCode}/inventory
     * @param warehouseCode
     * @param inventoryProcessCode
     * @param pageable
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getInventories(warehouseCode: string, inventoryProcessCode: string, pageable: Pageable, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListInventoryDto>;
    getInventories(warehouseCode: string, inventoryProcessCode: string, pageable: Pageable, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListInventoryDto>>;
    getInventories(warehouseCode: string, inventoryProcessCode: string, pageable: Pageable, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListInventoryDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<InventoriesService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<InventoriesService>;
}
