import { HttpClient, HttpResponse, HttpEvent, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginDto } from '../model/login-dto';
import { ResponseCommonDto } from '../model/response-common-dto';
import { Configuration } from '../configuration';
import { BaseService } from '../api.base.service';
import * as i0 from "@angular/core";
export declare class LoginService extends BaseService {
    protected httpClient: HttpClient;
    constructor(httpClient: HttpClient, basePath: string | string[], configuration?: Configuration);
    /**
     * Аутентификация пользователя
     * Аутентифицирует пользователя по логину и паролю, возвращает ответ с заголовком авторизации
     * @endpoint post /api/login
     * @param loginDto
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param options additional options
     */
    login(loginDto: LoginDto, observe?: 'body', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<ResponseCommonDto>;
    login(loginDto: LoginDto, observe?: 'response', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpResponse<ResponseCommonDto>>;
    login(loginDto: LoginDto, observe?: 'events', reportProgress?: boolean, options?: {
        httpHeaderAccept?: '*/*' | 'application/json';
        context?: HttpContext;
        transferCache?: boolean;
    }): Observable<HttpEvent<ResponseCommonDto>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<LoginService, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<LoginService>;
}
