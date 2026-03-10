import * as i0 from '@angular/core';
import { InjectionToken, Optional, Inject, Injectable, SkipSelf, NgModule, makeEnvironmentProviders } from '@angular/core';
import * as i1 from '@angular/common/http';
import { HttpParams, HttpHeaders, HttpContext } from '@angular/common/http';

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

const BASE_PATH = new InjectionToken('basePath');
const COLLECTION_FORMATS = {
    'csv': ',',
    'tsv': '   ',
    'ssv': ' ',
    'pipes': '|'
};

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
class AbsentArticlesService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addWarehouseAbsentArticles(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addWarehouseAbsentArticles.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/article/absentarticles/move`;
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
    countWarehouseAbsentArticles(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countWarehouseAbsentArticles.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/article/absentarticles/count`;
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
    getWarehouseAbsentArticles(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getWarehouseAbsentArticles.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getWarehouseAbsentArticles.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'warehouseCode', warehouseCode, QueryParamStyle.Form, true);
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
        let localVarPath = `/api/warehouse//article/absentarticles`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AbsentArticlesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AbsentArticlesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AbsentArticlesService, decorators: [{
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
class AbsentShelfService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addWarehouseAbsentShelves(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addWarehouseAbsentShelves.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/absentshelves/move`;
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
    countWarehouseAbsentShelves(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countWarehouseAbsentShelves.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/absentshelves/count`;
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
    getWarehouseAbsentShelves(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getWarehouseAbsentShelves.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getWarehouseAbsentShelves.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'warehouseCode', warehouseCode, QueryParamStyle.Form, true);
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
        let localVarPath = `/api/warehouse//shelf/absentshelves`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AbsentShelfService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AbsentShelfService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AbsentShelfService, decorators: [{
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
    truncateAllTables(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/admin/delete`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AdminService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AdminService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: AdminService, decorators: [{
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
class ArticleService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getArticleByCode(articleCode, observe = 'body', reportProgress = false, options) {
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getArticleByCode.');
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
        let localVarPath = `/api/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getArticleByCode1(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getArticleByCode1.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getArticleByCode1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getArticleByCode2(articleCode, observe = 'body', reportProgress = false, options) {
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getArticleByCode2.');
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
        let localVarPath = `/api/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ArticleService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ArticleService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ArticleService, decorators: [{
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
class ArticlesService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addArticle(warehouseCode, articleDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addArticle.');
        }
        if (articleDto === null || articleDto === undefined) {
            throw new Error('Required parameter articleDto was null or undefined when calling addArticle.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: articleDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    addArticle1(articleDto, observe = 'body', reportProgress = false, options) {
        if (articleDto === null || articleDto === undefined) {
            throw new Error('Required parameter articleDto was null or undefined when calling addArticle1.');
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
        let localVarPath = `/api/sparepart`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: articleDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countArticles(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/sparepart/count`;
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
    countArticles1(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countArticles1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart/count`;
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
    countSearchArticles(articleCode, observe = 'body', reportProgress = false, options) {
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling countSearchArticles.');
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
        let localVarPath = `/api/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    countSearchArticles1(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countSearchArticles1.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling countSearchArticles1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    downloadArticlesCsv(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/sparepart/csv`;
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
    downloadArticlesCsv1(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadArticlesCsv1.');
        }
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart/csv`;
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
    getArticlesByWarehouse(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getArticlesByWarehouse.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getArticlesByWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart`;
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
    getArticlesByWarehouse1(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getArticlesByWarehouse1.');
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
        let localVarPath = `/api/sparepart`;
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
    searchArticles(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchArticles.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling searchArticles.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    searchArticles1(articleCode, observe = 'body', reportProgress = false, options) {
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling searchArticles1.');
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
        let localVarPath = `/api/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    uploadArticlesCsv(file, observe = 'body', reportProgress = false, options) {
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadArticlesCsv.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
        let localVarPath = `/api/sparepart/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadArticlesCsv1(warehouseCode, file, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadArticlesCsv1.');
        }
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadArticlesCsv1.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/sparepart/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ArticlesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ArticlesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ArticlesService, decorators: [{
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
class HelloWorldService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getHelloWorld(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/helloworld`;
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
    getHelloWorld1(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/hello`;
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
    getHelloWorld2(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/helloworld`;
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
    getHelloWorld3(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/hello`;
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
    getHelloWorldIds(ids, observe = 'body', reportProgress = false, options) {
        if (ids === null || ids === undefined) {
            throw new Error('Required parameter ids was null or undefined when calling getHelloWorldIds.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'ids', ids, QueryParamStyle.Form, true);
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
        let localVarPath = `/hello/ids`;
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
    getHelloWorldIds1(ids, observe = 'body', reportProgress = false, options) {
        if (ids === null || ids === undefined) {
            throw new Error('Required parameter ids was null or undefined when calling getHelloWorldIds1.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'ids', ids, QueryParamStyle.Form, true);
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
        let localVarPath = `/api/helloworld/ids`;
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
    getHelloWorldIds2(ids, observe = 'body', reportProgress = false, options) {
        if (ids === null || ids === undefined) {
            throw new Error('Required parameter ids was null or undefined when calling getHelloWorldIds2.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'ids', ids, QueryParamStyle.Form, true);
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
        let localVarPath = `/api/hello/ids`;
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
    getHelloWorldIds3(ids, observe = 'body', reportProgress = false, options) {
        if (ids === null || ids === undefined) {
            throw new Error('Required parameter ids was null or undefined when calling getHelloWorldIds3.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'ids', ids, QueryParamStyle.Form, true);
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
        let localVarPath = `/helloworld/ids`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HelloWorldService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HelloWorldService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HelloWorldService, decorators: [{
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
class HelperService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getAuthorization(authorization, observe = 'body', reportProgress = false, options) {
        if (authorization === null || authorization === undefined) {
            throw new Error('Required parameter authorization was null or undefined when calling getAuthorization.');
        }
        let localVarHeaders = this.defaultHeaders;
        if (authorization !== undefined && authorization !== null) {
            localVarHeaders = localVarHeaders.set('Authorization', String(authorization));
        }
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
        let localVarPath = `/api/admin/AUTHORIZATION`;
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
    helloWorld(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/admin`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HelperService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HelperService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HelperService, decorators: [{
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
    getTransitionHistoryFlat(pageable, transitionFilterFlatDto, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getTransitionHistoryFlat.');
        }
        if (transitionFilterFlatDto === null || transitionFilterFlatDto === undefined) {
            throw new Error('Required parameter transitionFilterFlatDto was null or undefined when calling getTransitionHistoryFlat.');
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
        let localVarPath = `/api/transition/history/flat`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: transitionFilterFlatDto,
            params: localVarQueryParameters.toHttpParams(),
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    getTransitionHistoryFlatCount(transitionFilterFlatDto, observe = 'body', reportProgress = false, options) {
        if (transitionFilterFlatDto === null || transitionFilterFlatDto === undefined) {
            throw new Error('Required parameter transitionFilterFlatDto was null or undefined when calling getTransitionHistoryFlatCount.');
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
        let localVarPath = `/api/transition/history/flat/count`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: transitionFilterFlatDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HistoryService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HistoryService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: HistoryService, decorators: [{
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
class ImageService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getBarImage(printNameBarCountPayloadPrintSringPayload, observe = 'body', reportProgress = false, options) {
        if (printNameBarCountPayloadPrintSringPayload === null || printNameBarCountPayloadPrintSringPayload === undefined) {
            throw new Error('Required parameter printNameBarCountPayloadPrintSringPayload was null or undefined when calling getBarImage.');
        }
        let localVarHeaders = this.defaultHeaders;
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'image/png'
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
        let localVarPath = `/api/barcode`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: printNameBarCountPayloadPrintSringPayload,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ImageService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ImageService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ImageService, decorators: [{
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
class LoginService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    login(loginDto, observe = 'body', reportProgress = false, options) {
        if (loginDto === null || loginDto === undefined) {
            throw new Error('Required parameter loginDto was null or undefined when calling login.');
        }
        let localVarHeaders = this.defaultHeaders;
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
        let localVarPath = `/api/login`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: loginDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: LoginService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: LoginService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: LoginService, decorators: [{
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
class ManagersService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    createManager(managerDto, observe = 'body', reportProgress = false, options) {
        if (managerDto === null || managerDto === undefined) {
            throw new Error('Required parameter managerDto was null or undefined when calling createManager.');
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
        let localVarPath = `/api/manager`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: managerDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    createManager1(managerDto, observe = 'body', reportProgress = false, options) {
        if (managerDto === null || managerDto === undefined) {
            throw new Error('Required parameter managerDto was null or undefined when calling createManager1.');
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
        let localVarPath = `/api/managers`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: managerDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ManagersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ManagersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ManagersService, decorators: [{
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
    addOrderUploadRecord(warehouseCode, orderCode, orderUploadRecordDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addOrderUploadRecord.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling addOrderUploadRecord.');
        }
        if (orderUploadRecordDto === null || orderUploadRecordDto === undefined) {
            throw new Error('Required parameter orderUploadRecordDto was null or undefined when calling addOrderUploadRecord.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderUploadRecordDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state/from/${this.configuration.encodeParam({ name: "expectedState", value: expectedState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED'", dataFormat: undefined })}/to/${this.configuration.encodeParam({ name: "newState", value: newState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSFORMED' | 'CALCULATED_SUCCEDED' | 'CALCULATED_FAILED' | 'BLOCKED_SUCCEDED' | 'BLOCKED_FAILED' | 'TRANSITIONING' | 'TRANSITIONED' | 'CLOSED'", dataFormat: undefined })}`;
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
    checkOrderUploadRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling checkOrderUploadRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling checkOrderUploadRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/checking`;
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
    clearOrderRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling clearOrderRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling clearOrderRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record`;
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
    clearOrderUploadRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling clearOrderUploadRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling clearOrderUploadRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
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
    countOrderRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrderRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrderRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/count`;
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
    countOrderUploadRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrderUploadRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrderUploadRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/count`;
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
    downloadOrderRecordsCsv(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadOrderRecordsCsv.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling downloadOrderRecordsCsv.');
        }
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/part/csv`;
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
    downloadOrderUploadRecordsCsv(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadOrderUploadRecordsCsv.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling downloadOrderUploadRecordsCsv.');
        }
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv`;
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
    getOrderRecordByArticle(warehouseCode, orderCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderRecordByArticle.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderRecordByArticle.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getOrderRecordByArticle.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getOrderRecords(warehouseCode, orderCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrderRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record`;
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
    getOrderUploadRecords(warehouseCode, orderCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderUploadRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderUploadRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrderUploadRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
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
    uploadOrderRecordsCsv(warehouseCode, orderCode, file, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadOrderRecordsCsv.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling uploadOrderRecordsCsv.');
        }
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadOrderRecordsCsv.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadOrderRecordsCsv1(warehouseCode, orderCode, file, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadOrderRecordsCsv1.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling uploadOrderRecordsCsv1.');
        }
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadOrderRecordsCsv1.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/part/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrderService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrderService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrderService, decorators: [{
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
class OrderAbsendSparePartControllerService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getCount1(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getCount1.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getCount1.');
        }
        let localVarHeaders = this.defaultHeaders;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendsparepart/count`;
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
    getSupplyRecords2(warehouseCode, orderCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyRecords2.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getSupplyRecords2.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplyRecords2.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'pageable', pageable, QueryParamStyle.Form, true);
        let localVarHeaders = this.defaultHeaders;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendsparepart`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrderAbsendSparePartControllerService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrderAbsendSparePartControllerService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrderAbsendSparePartControllerService, decorators: [{
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
    downloadOrdersCsv(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadOrdersCsv.');
        }
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
    uploadOrdersCsv(warehouseCode, file, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadOrdersCsv.');
        }
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadOrdersCsv.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrdersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrdersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrdersService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrdersControllerService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrdersControllerService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: OrdersControllerService, decorators: [{
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
class PersonService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    createPerson(personDto, observe = 'body', reportProgress = false, options) {
        if (personDto === null || personDto === undefined) {
            throw new Error('Required parameter personDto was null or undefined when calling createPerson.');
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
        let localVarPath = `/api/persons`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: personDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    createPerson1(personDto, observe = 'body', reportProgress = false, options) {
        if (personDto === null || personDto === undefined) {
            throw new Error('Required parameter personDto was null or undefined when calling createPerson1.');
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
        let localVarPath = `/api/person`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: personDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deletePerson(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling deletePerson.');
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
        let localVarPath = `/api/person/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getAllPersons(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/persons`;
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
    getAllPersons1(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/person`;
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
    getPersonByLogin(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling getPersonByLogin.');
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
        let localVarPath = `/api/person/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getPersonsByCurrentTenant(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getPersonsByCurrentTenant.');
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
        let localVarPath = `/api/persons/tenant`;
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
    getPersonsByCurrentTenant1(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getPersonsByCurrentTenant1.');
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
        let localVarPath = `/api/person/tenant`;
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
    getPersonsCount(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/person/count`;
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
    getPersonsCount1(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/persons/count`;
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
    getPersonsCountByLogin(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling getPersonsCountByLogin.');
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
        let localVarPath = `/api/persons/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    getPersonsCountByLogin1(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling getPersonsCountByLogin1.');
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
        let localVarPath = `/api/person/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    searchPersonsByLogin(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling searchPersonsByLogin.');
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
        let localVarPath = `/api/persons/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    searchPersonsByLogin1(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling searchPersonsByLogin1.');
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
        let localVarPath = `/api/person/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    updatePerson(login, personDto, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling updatePerson.');
        }
        if (personDto === null || personDto === undefined) {
            throw new Error('Required parameter personDto was null or undefined when calling updatePerson.');
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
        let localVarPath = `/api/person/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('put', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: personDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PersonService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PersonService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PersonService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintService, decorators: [{
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
class PrintAgentService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    deleteAgentTask(taskId, observe = 'body', reportProgress = false, options) {
        if (taskId === null || taskId === undefined) {
            throw new Error('Required parameter taskId was null or undefined when calling deleteAgentTask.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'taskId', taskId, QueryParamStyle.Form, true);
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
        let localVarPath = `/api/print/agent/tenant//printer/`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
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
    getImageAndDeleteImageTaskForPrinter(tenantCode, printerCode, observe = 'body', reportProgress = false, options) {
        if (tenantCode === null || tenantCode === undefined) {
            throw new Error('Required parameter tenantCode was null or undefined when calling getImageAndDeleteImageTaskForPrinter.');
        }
        if (printerCode === null || printerCode === undefined) {
            throw new Error('Required parameter printerCode was null or undefined when calling getImageAndDeleteImageTaskForPrinter.');
        }
        let localVarHeaders = this.defaultHeaders;
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'image/png'
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
        let localVarPath = `/api/print/agent/tenant/${this.configuration.encodeParam({ name: "tenantCode", value: tenantCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/printer/${this.configuration.encodeParam({ name: "printerCode", value: printerCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/image/delete`;
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
    getImageForPrinter(tenantCode, printerCode, observe = 'body', reportProgress = false, options) {
        if (tenantCode === null || tenantCode === undefined) {
            throw new Error('Required parameter tenantCode was null or undefined when calling getImageForPrinter.');
        }
        if (printerCode === null || printerCode === undefined) {
            throw new Error('Required parameter printerCode was null or undefined when calling getImageForPrinter.');
        }
        let localVarHeaders = this.defaultHeaders;
        const localVarHttpHeaderAcceptSelected = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*',
            'image/png'
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
        let localVarPath = `/api/print/agent/tenant/${this.configuration.encodeParam({ name: "tenantCode", value: tenantCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/printer/${this.configuration.encodeParam({ name: "printerCode", value: printerCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/image`;
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
    getImageTask(tenantCode, printerCode, observe = 'body', reportProgress = false, options) {
        if (tenantCode === null || tenantCode === undefined) {
            throw new Error('Required parameter tenantCode was null or undefined when calling getImageTask.');
        }
        if (printerCode === null || printerCode === undefined) {
            throw new Error('Required parameter printerCode was null or undefined when calling getImageTask.');
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
        let localVarPath = `/api/print/agent/tenant/${this.configuration.encodeParam({ name: "tenantCode", value: tenantCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/printer/${this.configuration.encodeParam({ name: "printerCode", value: printerCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintAgentService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintAgentService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintAgentService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: PrintersService, decorators: [{
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
class ShelfService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addShelf(warehouseCode, shelfDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addShelf.');
        }
        if (shelfDto === null || shelfDto === undefined) {
            throw new Error('Required parameter shelfDto was null or undefined when calling addShelf.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: shelfDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countAllShelves(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countAllShelves.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/count`;
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
    countSearchShelvesByCode(warehouseCode, shelfCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countSearchShelvesByCode.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling countSearchShelvesByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/${this.configuration.encodeParam({ name: "shelfCode", value: shelfCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    downloadShelvesCsv(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadShelvesCsv.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/csv`;
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
    getAllShelvesByWarehouse(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getAllShelvesByWarehouse.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getAllShelvesByWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf`;
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
    getShelfByCode(warehouseCode, shelfCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getShelfByCode.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling getShelfByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/${this.configuration.encodeParam({ name: "shelfCode", value: shelfCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    searchShelvesByCode(warehouseCode, shelfCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchShelvesByCode.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling searchShelvesByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/${this.configuration.encodeParam({ name: "shelfCode", value: shelfCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    uploadShelvesCsv(warehouseCode, file, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadShelvesCsv.');
        }
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadShelvesCsv.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    uploadShelvesCsvFromClipboard(warehouseCode, body, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadShelvesCsvFromClipboard.');
        }
        if (body === null || body === undefined) {
            throw new Error('Required parameter body was null or undefined when calling uploadShelvesCsvFromClipboard.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/csv/clipboard`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ShelfService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ShelfService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ShelfService, decorators: [{
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
class StockService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    clearStock(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling clearStock.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock`;
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
    countAllStock(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countAllStock.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/count`;
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
    countStockByShelfCode(warehouseCode, shelfCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countStockByShelfCode.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling countStockByShelfCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/shelf/${this.configuration.encodeParam({ name: "shelfCode", value: shelfCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/count`;
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
    countStockBySparePartCode(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countStockBySparePartCode.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling countStockBySparePartCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/count`;
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
    countStockBySparePartCode1(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countStockBySparePartCode1.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling countStockBySparePartCode1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/count`;
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
    downloadStockCsv(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadStockCsv.');
        }
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/csv`;
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
    getAllStock(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getAllStock.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getAllStock.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock`;
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
    getStockByShelfCode(warehouseCode, shelfCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getStockByShelfCode.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling getStockByShelfCode.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getStockByShelfCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/shelf/${this.configuration.encodeParam({ name: "shelfCode", value: shelfCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getStockBySparePartCode(warehouseCode, articleCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getStockBySparePartCode.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getStockBySparePartCode.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getStockBySparePartCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getStockBySparePartCode1(warehouseCode, articleCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getStockBySparePartCode1.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getStockBySparePartCode1.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getStockBySparePartCode1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/sparepart/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: StockService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: StockService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: StockService, decorators: [{
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
class SuppliesService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addSupply(warehouseCode, supplyDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addSupply.');
        }
        if (supplyDto === null || supplyDto === undefined) {
            throw new Error('Required parameter supplyDto was null or undefined when calling addSupply.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: supplyDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countAllSupplies(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countAllSupplies.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/count`;
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
    downloadSuppliesCsv(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadSuppliesCsv.');
        }
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/csv`;
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
    getSupplies(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplies.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplies.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply`;
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
    getSuppliesByState(warehouseCode, state, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSuppliesByState.');
        }
        if (state === null || state === undefined) {
            throw new Error('Required parameter state was null or undefined when calling getSuppliesByState.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/state/${this.configuration.encodeParam({ name: "state", value: state, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'TRANSITION' | 'TRANSITIONED' | 'CLOSED'", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SuppliesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SuppliesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SuppliesService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SuppliesTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SuppliesTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SuppliesTransitionService, decorators: [{
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
    clearSupplyRecords(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling clearSupplyRecords.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling clearSupplyRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record`;
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
    countAbsentArticlesBySupply(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countAbsentArticlesBySupply.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling countAbsentArticlesBySupply.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendsparepart/count`;
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
    countAbsentArticlesBySupply1(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countAbsentArticlesBySupply1.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling countAbsentArticlesBySupply1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absentsarticle/count`;
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
    countSupplyRecords(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countSupplyRecords.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling countSupplyRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/count`;
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
    downloadSupplyRecordsCsv(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadSupplyRecordsCsv.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling downloadSupplyRecordsCsv.');
        }
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/csv`;
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
    getAbsentArticlesBySupply(warehouseCode, supplyCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getAbsentArticlesBySupply.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getAbsentArticlesBySupply.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getAbsentArticlesBySupply.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendsparepart`;
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
    getAbsentArticlesBySupply1(warehouseCode, supplyCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getAbsentArticlesBySupply1.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getAbsentArticlesBySupply1.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getAbsentArticlesBySupply1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absentsarticle`;
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
    getSupplyRecords(warehouseCode, supplyCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyRecords.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getSupplyRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplyRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record`;
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
    moveAbsentArticlesToSpareParts(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling moveAbsentArticlesToSpareParts.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling moveAbsentArticlesToSpareParts.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendsparepart/movetospareparts`;
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
    moveAbsentArticlesToSpareParts1(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling moveAbsentArticlesToSpareParts1.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling moveAbsentArticlesToSpareParts1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absentsarticle/movetospareparts`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTaskService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTaskService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTaskService, decorators: [{
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
class SupplyTasksService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getByWarehouse(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getByWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task`;
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
    getSupplyTasks(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/task/login`;
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
    getSupplyTasksByLogin(warehouseCode, login, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyTasksByLogin.');
        }
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling getSupplyTasksByLogin.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task/login/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getSupplyTasksByWarehouse(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyTasksByWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task/login`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTasksService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTasksService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTasksService, decorators: [{
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
    execSupplyTransition(warehouseCode, supplyCode, supplyTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling execSupplyTransition.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling execSupplyTransition.');
        }
        if (supplyTransitionDto === null || supplyTransitionDto === undefined) {
            throw new Error('Required parameter supplyTransitionDto was null or undefined when calling execSupplyTransition.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyTransitionService, decorators: [{
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
    uploadSupplyUploadRecordsCsv(warehouseCode, supplyCode, file, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadSupplyUploadRecordsCsv.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling uploadSupplyUploadRecordsCsv.');
        }
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadSupplyUploadRecordsCsv.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
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
            'text/plain'
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyUploadRecordService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyUploadRecordService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SupplyUploadRecordService, decorators: [{
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
class SystemService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getSystemSettings(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
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
        let localVarPath = `/api/system/settings`;
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
    getSystemSettings1(observe = 'body', reportProgress = false, options) {
        let localVarHeaders = this.defaultHeaders;
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
        let localVarPath = `/system/settings`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SystemService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SystemService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: SystemService, decorators: [{
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
class TaskService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addTask(warehouseCode, taskDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addTask.');
        }
        if (taskDto === null || taskDto === undefined) {
            throw new Error('Required parameter taskDto was null or undefined when calling addTask.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: taskDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deleteTask(warehouseCode, taskDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling deleteTask.');
        }
        if (taskDto === null || taskDto === undefined) {
            throw new Error('Required parameter taskDto was null or undefined when calling deleteTask.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('delete', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: taskDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TaskService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TaskService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TaskService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TenantService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TenantService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TenantService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TenantsService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TenantsService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TenantsService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ToStockTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ToStockTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ToStockTransitionService, decorators: [{
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
class TransitionService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addOutStockTransition(warehouseCode, outStockTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addOutStockTransition.');
        }
        if (outStockTransitionDto === null || outStockTransitionDto === undefined) {
            throw new Error('Required parameter outStockTransitionDto was null or undefined when calling addOutStockTransition.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/out`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: outStockTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    createInsideStockTransition(warehouseCode, insideStockTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling createInsideStockTransition.');
        }
        if (insideStockTransitionDto === null || insideStockTransitionDto === undefined) {
            throw new Error('Required parameter insideStockTransitionDto was null or undefined when calling createInsideStockTransition.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/inside`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: insideStockTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    createInsideStockTransition1(warehouseCode, insideStockTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling createInsideStockTransition1.');
        }
        if (insideStockTransitionDto === null || insideStockTransitionDto === undefined) {
            throw new Error('Required parameter insideStockTransitionDto was null or undefined when calling createInsideStockTransition1.');
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
        let localVarPath = `/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/inside`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: insideStockTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: TransitionService, decorators: [{
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
class WarehouseService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    changeWarehouseState(warehouseCode, expectedState, newState, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling changeWarehouseState.');
        }
        if (expectedState === null || expectedState === undefined) {
            throw new Error('Required parameter expectedState was null or undefined when calling changeWarehouseState.');
        }
        if (newState === null || newState === undefined) {
            throw new Error('Required parameter newState was null or undefined when calling changeWarehouseState.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state/from/${this.configuration.encodeParam({ name: "expectedState", value: expectedState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE'", dataFormat: undefined })}/to/${this.configuration.encodeParam({ name: "newState", value: newState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CHECKED_SUCCEDED' | 'CHECKED_FAILED' | 'ACTIVE'", dataFormat: undefined })}`;
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
    countAllWarehouses(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/warehouse/count`;
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
    countSearchWarehouse(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countSearchWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    createWarehouse(warehouseDto, observe = 'body', reportProgress = false, options) {
        if (warehouseDto === null || warehouseDto === undefined) {
            throw new Error('Required parameter warehouseDto was null or undefined when calling createWarehouse.');
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
        let localVarPath = `/api/warehouse`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: warehouseDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    deleteWarehouse(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling deleteWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    downloadWarehousesCsv(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/warehouse/csv`;
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
    getAllWarehouses(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getAllWarehouses.');
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
        let localVarPath = `/api/warehouse`;
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
    getWarehouse(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    searchWarehouse(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    uploadWarehousesCsv(file, observe = 'body', reportProgress = false, options) {
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadWarehousesCsv.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
        let localVarPath = `/api/warehouse/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: WarehouseService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: WarehouseService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: WarehouseService, decorators: [{
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
class WarehouseUploadService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    countWarehouseRecords(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countWarehouseRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/count`;
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
    deleteWarehouseRecords(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling deleteWarehouseRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
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
    getWarehouseRecords(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getWarehouseRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getWarehouseRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord`;
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
    uploadWarehouseRecordsCSV(warehouseCode, file, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadWarehouseRecordsCSV.');
        }
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling uploadWarehouseRecordsCSV.');
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
            'multipart/form-data'
        ];
        const canConsumeForm = this.canConsumeForm(consumes);
        let localVarFormParams;
        let localVarUseForm = false;
        let localVarConvertFormParamsToString = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        // see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
        localVarUseForm = canConsumeForm;
        if (localVarUseForm) {
            localVarFormParams = new FormData();
        }
        else {
            localVarFormParams = new HttpParams({ encoder: this.encoder });
        }
        if (file !== undefined) {
            localVarFormParams = localVarFormParams.append('file', file) || localVarFormParams;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: WarehouseUploadService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: WarehouseUploadService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: WarehouseUploadService, decorators: [{
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

const APIS = [AbsentArticlesService, AbsentShelfService, AdminService, ArticleService, ArticlesService, HelloWorldService, HelperService, HistoryService, ImageService, LoginService, ManagersService, OrderService, OrderAbsendSparePartControllerService, OrdersService, OrdersControllerService, PersonService, PrintService, PrintAgentService, PrintersService, ShelfService, StockService, SuppliesService, SuppliesTransitionService, SupplyService, SupplyTaskService, SupplyTasksService, SupplyTransitionService, SupplyUploadRecordService, SystemService, TaskService, TenantService, TenantsService, ToStockTransitionService, TransitionService, WarehouseService, WarehouseUploadService];

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
        BlockedSucceded: 'BLOCKED_SUCCEDED',
        BlockedFailed: 'BLOCKED_FAILED',
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ApiModule, deps: [{ token: ApiModule, optional: true, skipSelf: true }, { token: i1.HttpClient, optional: true }], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "19.2.19", ngImport: i0, type: ApiModule });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ApiModule });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.19", ngImport: i0, type: ApiModule, decorators: [{
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

export { APIS, AbsentArticlesService, AbsentShelfService, AdminService, ApiModule, ArticleService, ArticlesService, BASE_PATH, COLLECTION_FORMATS, Configuration, HelloWorldService, HelperService, HistoryService, ImageService, LoginService, ManagersService, OrderAbsendSparePartControllerService, OrderDto, OrderService, OrdersControllerService, OrdersService, PersonDto, PersonService, PrintAgentService, PrintService, PrintersService, ShelfService, StockService, SuppliesService, SuppliesTransitionService, SupplyDto, SupplyService, SupplyTaskService, SupplyTasksService, SupplyTransitionService, SupplyUploadRecordService, SystemService, TaskService, TenantService, TenantsService, ToStockTransitionService, TransitionService, WarehouseService, WarehouseUploadService, provideApi };
//# sourceMappingURL=wh-open-client.mjs.map
