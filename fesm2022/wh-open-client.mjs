import * as i0 from '@angular/core';
import { InjectionToken, Injectable, Optional, Inject, NgModule, SkipSelf, makeEnvironmentProviders } from '@angular/core';
import * as i1 from '@angular/common/http';
import { HttpParams, HttpHeaders, HttpContext } from '@angular/common/http';

const BASE_PATH = new InjectionToken('basePath');
const COLLECTION_FORMATS = {
    'csv': ',',
    'tsv': '   ',
    'ssv': ' ',
    'pipes': '|'
};

/**
 * Custom HttpParameterCodec
 * Workaround for https://github.com/angular/angular/issues/18261
 */
class CustomHttpParameterCodec {
    encodeKey(k) {
        return encodeURIComponent(k);
    }
    encodeValue(v) {
        return encodeURIComponent(v);
    }
    decodeKey(k) {
        return decodeURIComponent(k);
    }
    decodeValue(v) {
        return decodeURIComponent(v);
    }
}
class IdentityHttpParameterCodec {
    encodeKey(k) {
        return k;
    }
    encodeValue(v) {
        return v;
    }
    decodeKey(k) {
        return k;
    }
    decodeValue(v) {
        return v;
    }
}

class Configuration {
    /**
     *  @deprecated Since 5.0. Use credentials instead
     */
    apiKeys;
    username;
    password;
    /**
     *  @deprecated Since 5.0. Use credentials instead
     */
    accessToken;
    basePath;
    withCredentials;
    /**
     * Takes care of encoding query- and form-parameters.
     */
    encoder;
    /**
     * Encoding of various path parameter
     * <a href="https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.0.md#style-values">styles</a>.
     * <p>
     * See {@link README.md} for more details
     * </p>
     */
    encodeParam;
    /**
     * The keys are the names in the securitySchemes section of the OpenAPI
     * document. They should map to the value used for authentication
     * minus any standard prefixes such as 'Basic' or 'Bearer'.
     */
    credentials;
    constructor({ accessToken, apiKeys, basePath, credentials, encodeParam, encoder, password, username, withCredentials } = {}) {
        if (apiKeys) {
            this.apiKeys = apiKeys;
        }
        if (username !== undefined) {
            this.username = username;
        }
        if (password !== undefined) {
            this.password = password;
        }
        if (accessToken !== undefined) {
            this.accessToken = accessToken;
        }
        if (basePath !== undefined) {
            this.basePath = basePath;
        }
        if (withCredentials !== undefined) {
            this.withCredentials = withCredentials;
        }
        if (encoder) {
            this.encoder = encoder;
        }
        this.encodeParam = encodeParam ?? (param => this.defaultEncodeParam(param));
        this.credentials = credentials ?? {};
        // init default bearerAuth credential
        if (!this.credentials['bearerAuth']) {
            this.credentials['bearerAuth'] = () => {
                return typeof this.accessToken === 'function'
                    ? this.accessToken()
                    : this.accessToken;
            };
        }
    }
    /**
     * Select the correct content-type to use for a request.
     * Uses {@link Configuration#isJsonMime} to determine the correct content-type.
     * If no content type is found return the first found type if the contentTypes is not empty
     * @param contentTypes - the array of content types that are available for selection
     * @returns the selected content-type or <code>undefined</code> if no selection could be made.
     */
    selectHeaderContentType(contentTypes) {
        if (contentTypes.length === 0) {
            return undefined;
        }
        const type = contentTypes.find((x) => this.isJsonMime(x));
        if (type === undefined) {
            return contentTypes[0];
        }
        return type;
    }
    /**
     * Select the correct accept content-type to use for a request.
     * Uses {@link Configuration#isJsonMime} to determine the correct accept content-type.
     * If no content type is found return the first found type if the contentTypes is not empty
     * @param accepts - the array of content types that are available for selection.
     * @returns the selected content-type or <code>undefined</code> if no selection could be made.
     */
    selectHeaderAccept(accepts) {
        if (accepts.length === 0) {
            return undefined;
        }
        const type = accepts.find((x) => this.isJsonMime(x));
        if (type === undefined) {
            return accepts[0];
        }
        return type;
    }
    /**
     * Check if the given MIME is a JSON MIME.
     * JSON MIME examples:
     *   application/json
     *   application/json; charset=UTF8
     *   APPLICATION/JSON
     *   application/vnd.company+json
     * @param mime - MIME (Multipurpose Internet Mail Extensions)
     * @return True if the given MIME is JSON, false otherwise.
     */
    isJsonMime(mime) {
        const jsonMime = new RegExp('^(application\/json|[^;/ \t]+\/[^;/ \t]+[+]json)[ \t]*(;.*)?$', 'i');
        return mime !== null && (jsonMime.test(mime) || mime.toLowerCase() === 'application/json-patch+json');
    }
    lookupCredential(key) {
        const value = this.credentials[key];
        return typeof value === 'function'
            ? value()
            : value;
    }
    addCredentialToHeaders(credentialKey, headerName, headers, prefix) {
        const value = this.lookupCredential(credentialKey);
        return value
            ? headers.set(headerName, (prefix ?? '') + value)
            : headers;
    }
    addCredentialToQuery(credentialKey, paramName, query) {
        const value = this.lookupCredential(credentialKey);
        return value
            ? query.set(paramName, value)
            : query;
    }
    defaultEncodeParam(param) {
        // This implementation exists as fallback for missing configuration
        // and for backwards compatibility to older typescript-angular generator versions.
        // It only works for the 'simple' parameter style.
        // Date-handling only works for the 'date-time' format.
        // All other styles and Date-formats are probably handled incorrectly.
        //
        // But: if that's all you need (i.e.: the most common use-case): no need for customization!
        const value = param.dataFormat === 'date-time' && param.value instanceof Date
            ? param.value.toISOString()
            : param.value;
        return encodeURIComponent(String(value));
    }
}

var QueryParamStyle;
(function (QueryParamStyle) {
    QueryParamStyle[QueryParamStyle["Json"] = 0] = "Json";
    QueryParamStyle[QueryParamStyle["Form"] = 1] = "Form";
    QueryParamStyle[QueryParamStyle["DeepObject"] = 2] = "DeepObject";
    QueryParamStyle[QueryParamStyle["SpaceDelimited"] = 3] = "SpaceDelimited";
    QueryParamStyle[QueryParamStyle["PipeDelimited"] = 4] = "PipeDelimited";
})(QueryParamStyle || (QueryParamStyle = {}));
class OpenApiHttpParams {
    params = new Map();
    defaults;
    encoder;
    /**
     * @param encoder  Parameter serializer
     * @param defaults Global defaults used when a specific parameter has no explicit options.
     *                 By OpenAPI default, explode is true for query params with style=form.
     */
    constructor(encoder, defaults) {
        this.encoder = encoder || new CustomHttpParameterCodec();
        this.defaults = {
            explode: defaults?.explode ?? true,
            delimiter: defaults?.delimiter ?? ",",
        };
    }
    resolveOptions(local) {
        return {
            explode: local?.explode ?? this.defaults.explode,
            delimiter: local?.delimiter ?? this.defaults.delimiter,
        };
    }
    /**
     * Replace the parameter's values and (optionally) its options.
     * Options are stored per-parameter (not global).
     */
    set(key, values, options) {
        const arr = Array.isArray(values) ? values.slice() : [values];
        const opts = this.resolveOptions(options);
        this.params.set(key, { values: arr, options: opts });
        return this;
    }
    /**
     * Append a single value to the parameter. If the parameter didn't exist it will be created
     * and use resolved options (global defaults merged with any provided options).
     */
    append(key, value, options) {
        const entry = this.params.get(key);
        if (entry) {
            // If new options provided, override the stored options for subsequent serialization
            if (options) {
                entry.options = this.resolveOptions({ ...entry.options, ...options });
            }
            entry.values.push(value);
        }
        else {
            this.set(key, [value], options);
        }
        return this;
    }
    /**
     * Serialize to a query string according to per-parameter OpenAPI options.
     * - If explode=true for that parameter → repeated key=value pairs (each value encoded).
     * - If explode=false for that parameter → single key=value where values are individually encoded
     *   and joined using the configured delimiter. The delimiter character is inserted AS-IS
     *   (not percent-encoded).
     */
    toString() {
        const records = this.toRecord();
        const parts = [];
        for (const key in records) {
            parts.push(`${key}=${records[key]}`);
        }
        return parts.join("&");
    }
    /**
     * Return parameters as a plain record.
     * - If a parameter has exactly one value, returns that value directly.
     * - If a parameter has multiple values, returns a readonly array of values.
     */
    toRecord() {
        const parts = {};
        for (const [key, entry] of this.params.entries()) {
            const encodedKey = this.encoder.encodeKey(key);
            if (entry.options.explode) {
                parts[encodedKey] = entry.values.map((v) => this.encoder.encodeValue(v));
            }
            else {
                const encodedValues = entry.values.map((v) => this.encoder.encodeValue(v));
                // join with the delimiter *unencoded*
                parts[encodedKey] = encodedValues.join(entry.options.delimiter);
            }
        }
        return parts;
    }
    /**
     * Return an Angular's HttpParams with an identity parameter codec as the parameters are already encoded.
     */
    toHttpParams() {
        const records = this.toRecord();
        let httpParams = new HttpParams({ encoder: new IdentityHttpParameterCodec() });
        return httpParams.appendAll(records);
    }
}
function concatHttpParamsObject(httpParams, key, item, delimiter) {
    let keyAndValues = [];
    for (const k in item) {
        keyAndValues.push(k);
        const value = item[k];
        if (Array.isArray(value)) {
            keyAndValues.push(...value.map(convertToString));
        }
        else {
            keyAndValues.push(convertToString(value));
        }
    }
    return httpParams.set(key, keyAndValues, { explode: false, delimiter: delimiter });
}
function convertToString(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    else {
        return value.toString();
    }
}

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
class BaseService {
    basePath = 'http://localhost:8080';
    defaultHeaders = new HttpHeaders();
    configuration;
    encoder;
    constructor(basePath, configuration) {
        this.configuration = configuration || new Configuration();
        if (typeof this.configuration.basePath !== 'string') {
            const firstBasePath = Array.isArray(basePath) ? basePath[0] : undefined;
            if (firstBasePath != undefined) {
                basePath = firstBasePath;
            }
            if (typeof basePath !== 'string') {
                basePath = this.basePath;
            }
            this.configuration.basePath = basePath;
        }
        this.encoder = this.configuration.encoder || new CustomHttpParameterCodec();
    }
    canConsumeForm(consumes) {
        return consumes.indexOf('multipart/form-data') !== -1;
    }
    addToHttpParams(httpParams, key, value, paramStyle, explode) {
        if (value === null || value === undefined) {
            return httpParams;
        }
        if (paramStyle === QueryParamStyle.DeepObject) {
            if (typeof value !== 'object') {
                throw Error(`An object must be provided for key ${key} as it is a deep object`);
            }
            return Object.keys(value).reduce((hp, k) => hp.append(`${key}[${k}]`, value[k]), httpParams);
        }
        else if (paramStyle === QueryParamStyle.Json) {
            return httpParams.append(key, JSON.stringify(value));
        }
        else {
            // Form-style, SpaceDelimited or PipeDelimited
            if (Object(value) !== value) {
                // If it is a primitive type, add its string representation
                return httpParams.append(key, value.toString());
            }
            else if (value instanceof Date) {
                return httpParams.append(key, value.toISOString());
            }
            else if (Array.isArray(value)) {
                // Otherwise, if it's an array, add each element.
                if (paramStyle === QueryParamStyle.Form) {
                    return httpParams.set(key, value, { explode: explode, delimiter: ',' });
                }
                else if (paramStyle === QueryParamStyle.SpaceDelimited) {
                    return httpParams.set(key, value, { explode: explode, delimiter: ' ' });
                }
                else {
                    // PipeDelimited
                    return httpParams.set(key, value, { explode: explode, delimiter: '|' });
                }
            }
            else {
                // Otherwise, if it's an object, add each field.
                if (paramStyle === QueryParamStyle.Form) {
                    if (explode) {
                        Object.keys(value).forEach(k => {
                            httpParams = this.addToHttpParams(httpParams, k, value[k], paramStyle, explode);
                        });
                        return httpParams;
                    }
                    else {
                        return concatHttpParamsObject(httpParams, key, value, ',');
                    }
                }
                else if (paramStyle === QueryParamStyle.SpaceDelimited) {
                    return concatHttpParamsObject(httpParams, key, value, ' ');
                }
                else {
                    // PipeDelimited
                    return concatHttpParamsObject(httpParams, key, value, '|');
                }
            }
        }
    }
}

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class AdminService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addAdmin(whAdminDto, observe = 'body', reportProgress = false, options) {
        if (whAdminDto === null || whAdminDto === undefined) {
            throw new Error('Required parameter whAdminDto was null or undefined when calling addAdmin.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/admin/whadmin`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: whAdminDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deleteAdmin(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/admin/whadmin`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getAdmin(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/admin/whadmin`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getToken(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling getToken.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/admin/whadmin/token/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    isAdminPresent(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/admin/whadmin/ifpresent`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: AdminService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: AdminService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: AdminService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class HistoryService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getTransitionHistory(pageable, transitionFilterDto, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getTransitionHistory.');
        }
        if (transitionFilterDto === null || transitionFilterDto === undefined) {
            throw new Error('Required parameter transitionFilterDto was null or undefined when calling getTransitionHistory.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'pageable', pageable, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/transition/history`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: transitionFilterDto,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getTransitionHistoryCount(transitionFilterDto, observe = 'body', reportProgress = false, options) {
        if (transitionFilterDto === null || transitionFilterDto === undefined) {
            throw new Error('Required parameter transitionFilterDto was null or undefined when calling getTransitionHistoryCount.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/transition/history/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: transitionFilterDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: HistoryService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: HistoryService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: HistoryService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class OrderService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    changeOrderState(warehouseCode, orderCode, expectedState, newState, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling changeOrderState.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling changeOrderState.');
        }
        if (expectedState === null || expectedState === undefined) {
            throw new Error('Required parameter expectedState was null or undefined when calling changeOrderState.');
        }
        if (newState === null || newState === undefined) {
            throw new Error('Required parameter newState was null or undefined when calling changeOrderState.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state/from/${this.configuration.encodeParam({ name: "expectedState", value: expectedState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'TO_TRANSITIONING_SUCCEDED' | 'TO_TRANSITIONING_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED'", dataFormat: undefined })}/to/${this.configuration.encodeParam({ name: "newState", value: newState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'TO_TRANSITIONING_SUCCEDED' | 'TO_TRANSITIONING_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED'", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrderService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrderService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrderService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class OrdersService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addOrder(warehouseCode, orderDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addOrder.');
        }
        if (orderDto === null || orderDto === undefined) {
            throw new Error('Required parameter orderDto was null or undefined when calling addOrder.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    addOrder1(warehouseCode, orderDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addOrder1.');
        }
        if (orderDto === null || orderDto === undefined) {
            throw new Error('Required parameter orderDto was null or undefined when calling addOrder1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countOrdersByCode(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrdersByCode.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrdersByCode.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countOrdersByCode1(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrdersByCode1.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrdersByCode1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deleteOrder(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling deleteOrder.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling deleteOrder.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deleteOrder1(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling deleteOrder1.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling deleteOrder1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    downloadOrdersCsv(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadOrdersCsv.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    downloadOrdersCsv1(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadOrdersCsv1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getOrderByCode(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderByCode.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderByCode.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getOrderByCode1(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderByCode1.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderByCode1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getOrdersByWarehouse(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrdersByWarehouse.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrdersByWarehouse.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'pageable', pageable, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getOrdersByWarehouse1(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrdersByWarehouse1.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrdersByWarehouse1.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'pageable', pageable, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    searchOrdersByCode(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchOrdersByCode.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling searchOrdersByCode.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    searchOrdersByCode1(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchOrdersByCode1.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling searchOrdersByCode1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    updateOrderState(warehouseCode, orderCode, orderDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling updateOrderState.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling updateOrderState.');
        }
        if (orderDto === null || orderDto === undefined) {
            throw new Error('Required parameter orderDto was null or undefined when calling updateOrderState.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('put', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    updateOrderState1(warehouseCode, orderCode, orderDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling updateOrderState1.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling updateOrderState1.');
        }
        if (orderDto === null || orderDto === undefined) {
            throw new Error('Required parameter orderDto was null or undefined when calling updateOrderState1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('put', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadOrdersCsv(warehouseCode, uploadSupplyUploadRecordsCsvRequest, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadOrdersCsv.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: uploadSupplyUploadRecordsCsvRequest,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadOrdersCsv1(warehouseCode, uploadSupplyUploadRecordsCsvRequest, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadOrdersCsv1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: uploadSupplyUploadRecordsCsvRequest,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrdersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrdersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrdersService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class OrdersControllerService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getCount2(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getCount2.');
        }
        let localVarHeaders = this.defaultHeaders;
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getCount3(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getCount3.');
        }
        let localVarHeaders = this.defaultHeaders;
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrdersControllerService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrdersControllerService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: OrdersControllerService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class PrintService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addPrintTask(printTaskDto, observe = 'body', reportProgress = false, options) {
        if (printTaskDto === null || printTaskDto === undefined) {
            throw new Error('Required parameter printTaskDto was null or undefined when calling addPrintTask.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/print`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: printTaskDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: PrintService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: PrintService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: PrintService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class PrintersService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    createPrinter(printerDto, observe = 'body', reportProgress = false, options) {
        if (printerDto === null || printerDto === undefined) {
            throw new Error('Required parameter printerDto was null or undefined when calling createPrinter.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/printer`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: printerDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getPrinters(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getPrinters.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'pageable', pageable, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/printer`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getPrintersCount(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/printer/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: PrintersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: PrintersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: PrintersService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class SuppliesTransitionService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addSuppliesTransition(warehouseCode, supplyTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addSuppliesTransition.');
        }
        if (supplyTransitionDto === null || supplyTransitionDto === undefined) {
            throw new Error('Required parameter supplyTransitionDto was null or undefined when calling addSuppliesTransition.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/supply`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: supplyTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    addSuppliesTransition1(warehouseCode, supplyTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addSuppliesTransition1.');
        }
        if (supplyTransitionDto === null || supplyTransitionDto === undefined) {
            throw new Error('Required parameter supplyTransitionDto was null or undefined when calling addSuppliesTransition1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/supply`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: supplyTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SuppliesTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SuppliesTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SuppliesTransitionService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class SupplyService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    changeSupplyState(warehouseCode, supplyCode, expectedState, newState, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling changeSupplyState.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling changeSupplyState.');
        }
        if (expectedState === null || expectedState === undefined) {
            throw new Error('Required parameter expectedState was null or undefined when calling changeSupplyState.');
        }
        if (newState === null || newState === undefined) {
            throw new Error('Required parameter newState was null or undefined when calling changeSupplyState.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state/from/${this.configuration.encodeParam({ name: "expectedState", value: expectedState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED'", dataFormat: undefined })}/to/${this.configuration.encodeParam({ name: "newState", value: newState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED'", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countSupplyByCode(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countSupplyByCode.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling countSupplyByCode.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deleteSupply(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling deleteSupply.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling deleteSupply.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getSupplyByCode(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyByCode.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getSupplyByCode.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getSupplyUploadedFile(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyUploadedFile.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getSupplyUploadedFile.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadedfile`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    searchSupplies(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchSupplies.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling searchSupplies.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadFromUploadedFile(warehouseCode, supplyCode, uploadSupplyUploadRecordsCsvRequest, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadFromUploadedFile.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling uploadFromUploadedFile.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/uploadedfile/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: uploadSupplyUploadRecordsCsvRequest,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadFromUploadedFile1(warehouseCode, supplyCode, fields, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadFromUploadedFile1.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling uploadFromUploadedFile1.');
        }
        if (fields === null || fields === undefined) {
            throw new Error('Required parameter fields was null or undefined when calling uploadFromUploadedFile1.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'warehouseCode', warehouseCode, QueryParamStyle.Form, true);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'supplyCode', supplyCode, QueryParamStyle.Form, true);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'fields', fields, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse//supply//record/uploadedfile/convert`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class SupplyTaskService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getSupplyTasksBySupplyCode(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyTasksBySupplyCode.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getSupplyTasksBySupplyCode.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyTaskService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyTaskService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyTaskService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class SupplyTransitionService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    rollbackSupplyTransition(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling rollbackSupplyTransition.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling rollbackSupplyTransition.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/rollback`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('put', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyTransitionService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class SupplyUploadRecordService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addSupplyUploadRecord(warehouseCode, supplyCode, supplyUploadRecordDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addSupplyUploadRecord.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling addSupplyUploadRecord.');
        }
        if (supplyUploadRecordDto === null || supplyUploadRecordDto === undefined) {
            throw new Error('Required parameter supplyUploadRecordDto was null or undefined when calling addSupplyUploadRecord.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: supplyUploadRecordDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    clearSupplyUploadRecords(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling clearSupplyUploadRecords.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling clearSupplyUploadRecords.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    copySupplyUploadRecordsToClipboard(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling copySupplyUploadRecordsToClipboard.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling copySupplyUploadRecordsToClipboard.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv/clipboard`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countSupplyUploadRecords(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countSupplyUploadRecords.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling countSupplyUploadRecords.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    downloadSupplyUploadRecordsCsv(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadSupplyUploadRecordsCsv.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling downloadSupplyUploadRecordsCsv.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getSupplyUploadRecords(warehouseCode, supplyCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyUploadRecords.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getSupplyUploadRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplyUploadRecords.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'pageable', pageable, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    prepareAbsentArticlesForUpload(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling prepareAbsentArticlesForUpload.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling prepareAbsentArticlesForUpload.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/checking`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadSupplyUploadRecordsCsv(warehouseCode, supplyCode, uploadSupplyUploadRecordsCsvRequest, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadSupplyUploadRecordsCsv.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling uploadSupplyUploadRecordsCsv.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: uploadSupplyUploadRecordsCsvRequest,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadSupplyUploadRecordsFromClipboard(warehouseCode, supplyCode, body, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadSupplyUploadRecordsFromClipboard.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling uploadSupplyUploadRecordsFromClipboard.');
        }
        if (body === null || body === undefined) {
            throw new Error('Required parameter body was null or undefined when calling uploadSupplyUploadRecordsFromClipboard.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv/clipboard`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: body,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyUploadRecordService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyUploadRecordService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: SupplyUploadRecordService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class TenantService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    countTenantByCode(tenantCode, observe = 'body', reportProgress = false, options) {
        if (tenantCode === null || tenantCode === undefined) {
            throw new Error('Required parameter tenantCode was null or undefined when calling countTenantByCode.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant/${this.configuration.encodeParam({ name: "tenantCode", value: tenantCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deleteTenant(tenantCode, observe = 'body', reportProgress = false, options) {
        if (tenantCode === null || tenantCode === undefined) {
            throw new Error('Required parameter tenantCode was null or undefined when calling deleteTenant.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant/${this.configuration.encodeParam({ name: "tenantCode", value: tenantCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getTenant(tenantCode, observe = 'body', reportProgress = false, options) {
        if (tenantCode === null || tenantCode === undefined) {
            throw new Error('Required parameter tenantCode was null or undefined when calling getTenant.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant/${this.configuration.encodeParam({ name: "tenantCode", value: tenantCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    searchTenant(tenantCode, observe = 'body', reportProgress = false, options) {
        if (tenantCode === null || tenantCode === undefined) {
            throw new Error('Required parameter tenantCode was null or undefined when calling searchTenant.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant/${this.configuration.encodeParam({ name: "tenantCode", value: tenantCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TenantService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TenantService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TenantService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class TenantsService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    createTenant(tenantDto, observe = 'body', reportProgress = false, options) {
        if (tenantDto === null || tenantDto === undefined) {
            throw new Error('Required parameter tenantDto was null or undefined when calling createTenant.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: tenantDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    downloadTenantsCsv(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'text/plain'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getTenants(page, size, sort, observe = 'body', reportProgress = false, options) {
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'page', page, QueryParamStyle.Form, true);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'size', size, QueryParamStyle.Form, true);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'sort', sort, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getTenantsCount(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/tenant/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('get', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TenantsService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TenantsService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: TenantsService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */
class ToStockTransitionService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addToStockTransition(warehouseCode, toStockTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addToStockTransition.');
        }
        if (toStockTransitionDto === null || toStockTransitionDto === undefined) {
            throw new Error('Required parameter toStockTransitionDto was null or undefined when calling addToStockTransition.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/to`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: toStockTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    addToStockTransition1(warehouseCode, toStockTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addToStockTransition1.');
        }
        if (toStockTransitionDto === null || toStockTransitionDto === undefined) {
            throw new Error('Required parameter toStockTransitionDto was null or undefined when calling addToStockTransition1.');
        }
        let localVarHeaders = this.defaultHeaders;
        // authentication (bearerAuth) required
        localVarHeaders = this.configuration.addCredentialToHeaders('bearerAuth', 'Authorization', localVarHeaders, 'Bearer ');
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }
        const localVarHttpContext = options?.context ?? new HttpContext();
        const localVarTransferCache = options?.transferCache ?? true;
        // to determine the Content-Type header
        const consumes = [
            'application/json'
        ];
        const httpContentTypeSelected = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }
        let responseType_ = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            }
            else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            }
            else {
                responseType_ = 'blob';
            }
        }
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/to`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: toStockTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ToStockTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ToStockTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ToStockTransitionService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [BASE_PATH]
                }] }, { type: Configuration, decorators: [{
                    type: Optional
                }] }] });

const APIS = [AdminService, HistoryService, OrderService, OrdersService, OrdersControllerService, PrintService, PrintersService, SuppliesTransitionService, SupplyService, SupplyTaskService, SupplyTransitionService, SupplyUploadRecordService, TenantService, TenantsService, ToStockTransitionService];

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var OrderDto;
(function (OrderDto) {
    OrderDto.StateEnum = {
        Uploading: 'UPLOADING',
        CheckedSucceded: 'CHECKED_SUCCEDED',
        CheckedFailed: 'CHECKED_FAILED',
        Transformed: 'TRANSFORMED',
        CalculatedSucceded: 'CALCULATED_SUCCEDED',
        CalculatedFailed: 'CALCULATED_FAILED',
        ToTransitioningSucceded: 'TO_TRANSITIONING_SUCCEDED',
        ToTransitioningFailed: 'TO_TRANSITIONING_FAILED',
        Transitioning: 'TRANSITIONING',
        Transitioned: 'TRANSITIONED',
        Closed: 'CLOSED'
    };
    OrderDto.FillTypeEnum = {
        Manual: 'MANUAL',
        File: 'FILE'
    };
})(OrderDto || (OrderDto = {}));

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var PersonDto;
(function (PersonDto) {
    PersonDto.RoleEnum = {
        Admin: 'ADMIN',
        Manager: 'MANAGER',
        Employee: 'EMPLOYEE'
    };
})(PersonDto || (PersonDto = {}));

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var SupplyDto;
(function (SupplyDto) {
    SupplyDto.StateEnum = {
        Uploading: 'UPLOADING',
        CheckedSucceded: 'CHECKED_SUCCEDED',
        CheckedFailed: 'CHECKED_FAILED',
        Transition: 'TRANSITION',
        Transitioned: 'TRANSITIONED',
        Closed: 'CLOSED'
    };
    SupplyDto.FillTypeEnum = {
        Manual: 'MANUAL',
        File: 'FILE'
    };
})(SupplyDto || (SupplyDto = {}));

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

class ApiModule {
    static forRoot(configurationFactory) {
        return {
            ngModule: ApiModule,
            providers: [{ provide: Configuration, useFactory: configurationFactory }]
        };
    }
    constructor(parentModule, http) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
                'See also https://github.com/angular/angular/issues/20575');
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ApiModule, deps: [{ token: ApiModule, optional: true, skipSelf: true }, { token: i1.HttpClient, optional: true }], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.2.14", ngImport: i0, type: ApiModule });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ApiModule });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.14", ngImport: i0, type: ApiModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [],
                    declarations: [],
                    exports: [],
                    providers: []
                }]
        }], ctorParameters: () => [{ type: ApiModule, decorators: [{
                    type: Optional
                }, {
                    type: SkipSelf
                }] }, { type: i1.HttpClient, decorators: [{
                    type: Optional
                }] }] });

// Returns the service class providers, to be used in the [ApplicationConfig](https://angular.dev/api/core/ApplicationConfig).
function provideApi(configOrBasePath) {
    return makeEnvironmentProviders([
        typeof configOrBasePath === "string"
            ? { provide: BASE_PATH, useValue: configOrBasePath }
            : {
                provide: Configuration,
                useValue: new Configuration({ ...configOrBasePath }),
            },
    ]);
}

/*
 * Public API Surface of whui-client
 */

/**
 * Generated bundle index. Do not edit.
 */

export { APIS, AdminService, ApiModule, BASE_PATH, COLLECTION_FORMATS, Configuration, HistoryService, OrderDto, OrderService, OrdersControllerService, OrdersService, PersonDto, PrintService, PrintersService, SuppliesTransitionService, SupplyDto, SupplyService, SupplyTaskService, SupplyTransitionService, SupplyUploadRecordService, TenantService, TenantsService, ToStockTransitionService, provideApi };
//# sourceMappingURL=wh-open-client.mjs.map
