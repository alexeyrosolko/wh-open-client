import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pageable } from '../model/pageable';
import { ResponseCountDto } from '../model/response-count-dto';
import { ResponseListTransitionHistoryDto } from '../model/response-list-transition-history-dto';
import { TransitionFilterDto } from '../model/transition-filter-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class HistoryService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Получить историю переходов
     * Получить список всех переходов со статусами и фильтрацией
     * @endpoint post /api/transition/history
     * @param pageable
     * @param transitionFilterDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getTransitionHistory(pageable: Pageable, transitionFilterDto: TransitionFilterDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseListTransitionHistoryDto>;
    getTransitionHistory(pageable: Pageable, transitionFilterDto: TransitionFilterDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseListTransitionHistoryDto>>;
    getTransitionHistory(pageable: Pageable, transitionFilterDto: TransitionFilterDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseListTransitionHistoryDto>>;
    /**
     * Получить количество записей истории переходов
     * Получить количество записей истории переходов с применением фильтров
     * @endpoint post /api/transition/history/count
     * @param transitionFilterDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    getTransitionHistoryCount(transitionFilterDto: TransitionFilterDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCountDto>;
    getTransitionHistoryCount(transitionFilterDto: TransitionFilterDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCountDto>>;
    getTransitionHistoryCount(transitionFilterDto: TransitionFilterDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCountDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<HistoryService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<HistoryService>;
}
