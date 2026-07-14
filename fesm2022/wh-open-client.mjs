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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/article/absentarticles`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AbsentArticlesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AbsentArticlesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AbsentArticlesService, decorators: [{
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/absentshelves`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AbsentShelfService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AbsentShelfService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AbsentShelfService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AdminService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AdminService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: AdminService, decorators: [{
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
        let localVarPath = `/api/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    searchArticles(articleCode, observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ArticleService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ArticleService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ArticleService, decorators: [{
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
    addArticle(articleDto, observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/article`;
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
    copyArticlesCsvToClipboard(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/article/csv/clipboard`;
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
        let localVarPath = `/api/article/count`;
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
        let localVarPath = `/api/article/csv`;
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
    getArticles(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getArticles.');
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
        let localVarPath = `/api/article`;
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
        let localVarPath = `/api/article/csv`;
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
    uploadArticlesCsvFromClipboard(body, observe = 'body', reportProgress = false, options) {
        if (body === null || body === undefined) {
            throw new Error('Required parameter body was null or undefined when calling uploadArticlesCsvFromClipboard.');
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
        let localVarPath = `/api/article/csv/clipboard`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ArticlesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ArticlesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ArticlesService, decorators: [{
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
class DictionaryService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getDictionaryItemsByCode(code, observe = 'body', reportProgress = false, options) {
        if (code === null || code === undefined) {
            throw new Error('Required parameter code was null or undefined when calling getDictionaryItemsByCode.');
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
        let localVarPath = `/api/dictionary/${this.configuration.encodeParam({ name: "code", value: code, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: DictionaryService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: DictionaryService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: DictionaryService, decorators: [{
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
class ExampleService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    downloadExampleFile(file, observe = 'body', reportProgress = false, options) {
        if (file === null || file === undefined) {
            throw new Error('Required parameter file was null or undefined when calling downloadExampleFile.');
        }
        let localVarHeaders = this.defaultHeaders;
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
        let localVarPath = `/api/example/${this.configuration.encodeParam({ name: "file", value: file, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ExampleService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ExampleService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ExampleService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HelloWorldService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HelloWorldService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HelloWorldService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HelperService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HelperService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HelperService, decorators: [{
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
    downloadTransitionHistoryFlatCsv(transitionFilterFlatDto, observe = 'body', reportProgress = false, options) {
        if (transitionFilterFlatDto === null || transitionFilterFlatDto === undefined) {
            throw new Error('Required parameter transitionFilterFlatDto was null or undefined when calling downloadTransitionHistoryFlatCsv.');
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
        let localVarPath = `/api/transition/history/flat/csv`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HistoryService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HistoryService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: HistoryService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ImageService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ImageService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ImageService, decorators: [{
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
class InventoriesService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addInventory(warehouseCode, inventoryProcessCode, inventoryDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addInventory.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling addInventory.');
        }
        if (inventoryDto === null || inventoryDto === undefined) {
            throw new Error('Required parameter inventoryDto was null or undefined when calling addInventory.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: inventoryDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countAllInventories(warehouseCode, inventoryProcessCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countAllInventories.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling countAllInventories.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/count`;
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
    getInventories(warehouseCode, inventoryProcessCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getInventories.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling getInventories.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getInventories.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoriesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoriesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoriesService, decorators: [{
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
class InventoryService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    changeInventoryState(warehouseCode, inventoryProcessCode, inventoryCode, expectedState, newState, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling changeInventoryState.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling changeInventoryState.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling changeInventoryState.');
        }
        if (expectedState === null || expectedState === undefined) {
            throw new Error('Required parameter expectedState was null or undefined when calling changeInventoryState.');
        }
        if (newState === null || newState === undefined) {
            throw new Error('Required parameter newState was null or undefined when calling changeInventoryState.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state/from/${this.configuration.encodeParam({ name: "expectedState", value: expectedState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CLOSED'", dataFormat: undefined })}/to/${this.configuration.encodeParam({ name: "newState", value: newState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CLOSED'", dataFormat: undefined })}`;
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
    clearInventoryShelvesRecords(warehouseCode, inventoryProcessCode, inventoryCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling clearInventoryShelvesRecords.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling clearInventoryShelvesRecords.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling clearInventoryShelvesRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record`;
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
    countInventoryByCode(warehouseCode, inventoryProcessCode, inventoryCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countInventoryByCode.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling countInventoryByCode.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling countInventoryByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    countInventoryShelvesRecords(warehouseCode, inventoryProcessCode, inventoryCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countInventoryShelvesRecords.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling countInventoryShelvesRecords.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling countInventoryShelvesRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/count`;
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
    downloadInventoryShelvesRecordsCsv(warehouseCode, inventoryProcessCode, inventoryCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadInventoryShelvesRecordsCsv.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling downloadInventoryShelvesRecordsCsv.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling downloadInventoryShelvesRecordsCsv.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/csv`;
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
    getInventoryByCode(warehouseCode, inventoryProcessCode, inventoryCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getInventoryByCode.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling getInventoryByCode.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling getInventoryByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getInventoryShelvesRecords(warehouseCode, inventoryProcessCode, inventoryCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getInventoryShelvesRecords.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling getInventoryShelvesRecords.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling getInventoryShelvesRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getInventoryShelvesRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record`;
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
    searchInventories(warehouseCode, inventoryProcessCode, inventoryCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchInventories.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling searchInventories.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling searchInventories.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryService, decorators: [{
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
class InventoryProcessService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    changeInventoryProcessState(warehouseCode, inventoryProcessCode, expectedState, newState, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling changeInventoryProcessState.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling changeInventoryProcessState.');
        }
        if (expectedState === null || expectedState === undefined) {
            throw new Error('Required parameter expectedState was null or undefined when calling changeInventoryProcessState.');
        }
        if (newState === null || newState === undefined) {
            throw new Error('Required parameter newState was null or undefined when calling changeInventoryProcessState.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/state/from/${this.configuration.encodeParam({ name: "expectedState", value: expectedState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CLOSED'", dataFormat: undefined })}/to/${this.configuration.encodeParam({ name: "newState", value: newState, in: "path", style: "simple", explode: false, dataType: "'UPLOADING' | 'CLOSED'", dataFormat: undefined })}`;
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
    countInventoryProcessByCode(warehouseCode, inventoryProcessCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countInventoryProcessByCode.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling countInventoryProcessByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search/count`;
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
    getInventoryProcessByCode(warehouseCode, inventoryProcessCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getInventoryProcessByCode.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling getInventoryProcessByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    searchInventoryProcesses(warehouseCode, inventoryProcessCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling searchInventoryProcesses.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling searchInventoryProcesses.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/search`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryProcessService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryProcessService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryProcessService, decorators: [{
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
class InventoryProcessesService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    addInventoryProcess(warehouseCode, inventoryProcessDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addInventoryProcess.');
        }
        if (inventoryProcessDto === null || inventoryProcessDto === undefined) {
            throw new Error('Required parameter inventoryProcessDto was null or undefined when calling addInventoryProcess.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: inventoryProcessDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countAllInventoryProcesses(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countAllInventoryProcesses.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/count`;
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
    getInventoryProcesses(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getInventoryProcesses.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getInventoryProcesses.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryProcessesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryProcessesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryProcessesService, decorators: [{
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
class InventoryTaskService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getInventoryTasksByInventoryCode(warehouseCode, inventoryProcessCode, inventoryCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getInventoryTasksByInventoryCode.');
        }
        if (inventoryProcessCode === null || inventoryProcessCode === undefined) {
            throw new Error('Required parameter inventoryProcessCode was null or undefined when calling getInventoryTasksByInventoryCode.');
        }
        if (inventoryCode === null || inventoryCode === undefined) {
            throw new Error('Required parameter inventoryCode was null or undefined when calling getInventoryTasksByInventoryCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventoryprocess/${this.configuration.encodeParam({ name: "inventoryProcessCode", value: inventoryProcessCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/inventory/${this.configuration.encodeParam({ name: "inventoryCode", value: inventoryCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryTaskService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryTaskService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: InventoryTaskService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: LoginService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: LoginService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: LoginService, decorators: [{
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
class MainBookService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    countMainBook(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countMainBook.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/mainbook/count`;
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
    countMainBookByArticle(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countMainBookByArticle.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling countMainBookByArticle.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/mainbook/count`;
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
    downloadMainBook(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadMainBook.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/mainbook/csv`;
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
    downloadMainBookByArticle(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadMainBookByArticle.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling downloadMainBookByArticle.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/mainbook/csv`;
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
    getMainBook(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getMainBook.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getMainBook.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/mainbook`;
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
    getMainBookByArticle(warehouseCode, articleCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getMainBookByArticle.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getMainBookByArticle.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getMainBookByArticle.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/mainbook`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MainBookService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MainBookService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MainBookService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ManagersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ManagersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ManagersService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderService, decorators: [{
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
class OrderAbsentRecordService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    countOrderAnsentRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrderAnsentRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrderAnsentRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absentrecord/count`;
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
    getOrderAnsentRecords(warehouseCode, orderCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderAnsentRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderAnsentRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrderAnsentRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absentrecord`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderAbsentRecordService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderAbsentRecordService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderAbsentRecordService, decorators: [{
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
class OrderBoxService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    closeCurrentOrderBox(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling closeCurrentOrderBox.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling closeCurrentOrderBox.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/box/close`;
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
    getOpenOrderBox(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOpenOrderBox.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOpenOrderBox.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/box/open`;
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
    getOrderBoxByCode(warehouseCode, orderCode, boxCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderBoxByCode.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderBoxByCode.');
        }
        if (boxCode === null || boxCode === undefined) {
            throw new Error('Required parameter boxCode was null or undefined when calling getOrderBoxByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/box/code/${this.configuration.encodeParam({ name: "boxCode", value: boxCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getOrderBoxesByOrderCode(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderBoxesByOrderCode.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderBoxesByOrderCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/box`;
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
    nextOrderBox(warehouseCode, orderCode, orderBoxDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling nextOrderBox.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling nextOrderBox.');
        }
        if (orderBoxDto === null || orderBoxDto === undefined) {
            throw new Error('Required parameter orderBoxDto was null or undefined when calling nextOrderBox.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/box/next`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderBoxDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    openOrderBox(warehouseCode, orderCode, orderBoxDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling openOrderBox.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling openOrderBox.');
        }
        if (orderBoxDto === null || orderBoxDto === undefined) {
            throw new Error('Required parameter orderBoxDto was null or undefined when calling openOrderBox.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/box`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderBoxDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderBoxService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderBoxService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderBoxService, decorators: [{
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
class OrderRecordsService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
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
    countOrderUntransitionedRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrderUntransitionedRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrderUntransitionedRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/untransitioned/count`;
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
    downloadOrderUntransitionedRecordsCsv(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadOrderUntransitionedRecordsCsv.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling downloadOrderUntransitionedRecordsCsv.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/untransitioned/part/csv`;
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
    getOrderUntransitionedRecords(warehouseCode, orderCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderUntransitionedRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderUntransitionedRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrderUntransitionedRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/untransitioned`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderRecordsService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderRecordsService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderRecordsService, decorators: [{
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
class OrderTaskService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getOrderTasksByOrderCode(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderTasksByOrderCode.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderTasksByOrderCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTaskService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTaskService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTaskService, decorators: [{
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
class OrderTransformedRecordsService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    countOrderTransformedRecords(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrderTransformedRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrderTransformedRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transformed/count`;
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
    getOrderTransformedRecords(warehouseCode, orderCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderTransformedRecords.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderTransformedRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrderTransformedRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transformed`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTransformedRecordsService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTransformedRecordsService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTransformedRecordsService, decorators: [{
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
class OrderTransitionService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    execOrderTransition(warehouseCode, orderCode, orderTransitionDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling execOrderTransition.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling execOrderTransition.');
        }
        if (orderTransitionDto === null || orderTransitionDto === undefined) {
            throw new Error('Required parameter orderTransitionDto was null or undefined when calling execOrderTransition.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: orderTransitionDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    rollbackOrderTransition(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling rollbackOrderTransition.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling rollbackOrderTransition.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/transition/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/rollback`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderTransitionService, decorators: [{
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
class OrderUploadService extends BaseService {
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
    copyOrderUploadRecordsToClipboard(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling copyOrderUploadRecordsToClipboard.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling copyOrderUploadRecordsToClipboard.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv/clipboard`;
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
    uploadOrderRecordsCsvFromClipboard(warehouseCode, orderCode, body, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadOrderRecordsCsvFromClipboard.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling uploadOrderRecordsCsvFromClipboard.');
        }
        if (body === null || body === undefined) {
            throw new Error('Required parameter body was null or undefined when calling uploadOrderRecordsCsvFromClipboard.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv/clipboard`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderUploadService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderUploadService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderUploadService, decorators: [{
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
class OrderUploadAbsentArticleService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    countOrderAbsentArticles(warehouseCode, orderCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrderAbsentArticles.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling countOrderAbsentArticles.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendarticle/count`;
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
    getOrderAbsentArticles(warehouseCode, orderCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrderAbsentArticles.');
        }
        if (orderCode === null || orderCode === undefined) {
            throw new Error('Required parameter orderCode was null or undefined when calling getOrderAbsentArticles.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrderAbsentArticles.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/order/${this.configuration.encodeParam({ name: "orderCode", value: orderCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendarticle`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderUploadAbsentArticleService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderUploadAbsentArticleService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrderUploadAbsentArticleService, decorators: [{
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
    countOrders(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countOrders.');
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
    getOrders(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getOrders.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getOrders.');
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrdersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrdersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: OrdersService, decorators: [{
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
    changePassword(login, personDto, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling changePassword.');
        }
        if (personDto === null || personDto === undefined) {
            throw new Error('Required parameter personDto was null or undefined when calling changePassword.');
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
        let localVarPath = `/api/person/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/password`;
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
    countPersons(observe = 'body', reportProgress = false, options) {
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
    countPersonsByLogin(login, observe = 'body', reportProgress = false, options) {
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling countPersonsByLogin.');
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
    getCurrentPerson(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/person/current`;
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
    getPersons(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getPersons.');
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PersonService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PersonService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PersonService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintAgentService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintAgentService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintAgentService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintersService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintersService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: PrintersService, decorators: [{
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
    addShelves(warehouseCode, shelfDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling addShelves.');
        }
        if (shelfDto === null || shelfDto === undefined) {
            throw new Error('Required parameter shelfDto was null or undefined when calling addShelves.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/list`;
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
    copyShelvesCsvToClipboard(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling copyShelvesCsvToClipboard.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/csv/clipboard`;
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
    getShelfTree(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getShelfTree.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/shelf/tree`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ShelfService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ShelfService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ShelfService, decorators: [{
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
    countStockByArticle(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countStockByArticle.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling countStockByArticle.');
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
    countStockByShelf(warehouseCode, shelfCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countStockByShelf.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling countStockByShelf.');
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
    downloadStockByArticle(warehouseCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadStockByArticle.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling downloadStockByArticle.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/csv`;
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
    downloadStockByShelf(warehouseCode, shelfCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling downloadStockByShelf.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling downloadStockByShelf.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/stock/shelf/${this.configuration.encodeParam({ name: "shelfCode", value: shelfCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/csv`;
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
    getStockByArticle(warehouseCode, articleCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getStockByArticle.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getStockByArticle.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getStockByArticle.');
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
    getStockByShelf(warehouseCode, shelfCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getStockByShelf.');
        }
        if (shelfCode === null || shelfCode === undefined) {
            throw new Error('Required parameter shelfCode was null or undefined when calling getStockByShelf.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getStockByShelf.');
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: StockService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: StockService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: StockService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SuppliesService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SuppliesService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SuppliesService, decorators: [{
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendarticle/count`;
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendarticle`;
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
    moveAbsentArticlesToArticles(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling moveAbsentArticlesToArticles.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling moveAbsentArticlesToArticles.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absentsarticle/movetoarticles`;
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
    moveAbsentArticlesToArticles1(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling moveAbsentArticlesToArticles1.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling moveAbsentArticlesToArticles1.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/absendarticle/movetoarticles`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTaskService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTaskService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTaskService, decorators: [{
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
    countSupplyTasks(observe = 'body', reportProgress = false, options) {
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
        let localVarPath = `/api/task/login/count`;
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
    getByWarehouse(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getByWarehouse.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getByWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task`;
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
    getSupplyTasks(pageable, observe = 'body', reportProgress = false, options) {
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplyTasks.');
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
        let localVarPath = `/api/task/login`;
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
    getSupplyTasksByLogin(warehouseCode, login, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyTasksByLogin.');
        }
        if (login === null || login === undefined) {
            throw new Error('Required parameter login was null or undefined when calling getSupplyTasksByLogin.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplyTasksByLogin.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task/login/${this.configuration.encodeParam({ name: "login", value: login, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    getSupplyTasksByWarehouse(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyTasksByWarehouse.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplyTasksByWarehouse.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/task/task/login`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTasksService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTasksService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTasksService, decorators: [{
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
    countSupplyRecordsWithoutPrice(warehouseCode, supplyCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countSupplyRecordsWithoutPrice.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling countSupplyRecordsWithoutPrice.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/transition/count`;
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
    getSupplyRecordsWithoutPrice(warehouseCode, supplyCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyRecordsWithoutPrice.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getSupplyRecordsWithoutPrice.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getSupplyRecordsWithoutPrice.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/transition`;
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
    getSupplyRecordsWithoutPriceRest(warehouseCode, supplyCode, articleCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getSupplyRecordsWithoutPriceRest.');
        }
        if (supplyCode === null || supplyCode === undefined) {
            throw new Error('Required parameter supplyCode was null or undefined when calling getSupplyRecordsWithoutPriceRest.');
        }
        if (articleCode === null || articleCode === undefined) {
            throw new Error('Required parameter articleCode was null or undefined when calling getSupplyRecordsWithoutPriceRest.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/supply/${this.configuration.encodeParam({ name: "supplyCode", value: supplyCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/record/transition/article/${this.configuration.encodeParam({ name: "articleCode", value: articleCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/rest`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyTransitionService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyUploadRecordService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyUploadRecordService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SupplyUploadRecordService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SystemService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SystemService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: SystemService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TaskService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TaskService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TaskService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TenantService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TenantService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TenantService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TenantsService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TenantsService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TenantsService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ToStockTransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ToStockTransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ToStockTransitionService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TransitionService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TransitionService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TransitionService, decorators: [{
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
class TurnoverService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    calculateTurnover(warehouseCode, turnoverPeriodDto, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling calculateTurnover.');
        }
        if (turnoverPeriodDto === null || turnoverPeriodDto === undefined) {
            throw new Error('Required parameter turnoverPeriodDto was null or undefined when calling calculateTurnover.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/report/turnover/calculate`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request('post', `${basePath}${localVarPath}`, {
            context: localVarHttpContext,
            body: turnoverPeriodDto,
            responseType: responseType_,
            ...(withCredentials ? { withCredentials } : {}),
            headers: localVarHeaders,
            observe: observe,
            ...(localVarTransferCache !== undefined ? { transferCache: localVarTransferCache } : {}),
            reportProgress: reportProgress
        });
    }
    countTurnoverRecords(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling countTurnoverRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/report/turnover/count`;
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
    deleteTurnoverRecords(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling deleteTurnoverRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/report/turnover`;
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
    getTurnoverRecords(warehouseCode, pageable, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getTurnoverRecords.');
        }
        if (pageable === null || pageable === undefined) {
            throw new Error('Required parameter pageable was null or undefined when calling getTurnoverRecords.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/report/turnover`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TurnoverService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TurnoverService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: TurnoverService, decorators: [{
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseService, decorators: [{
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
class WarehouseDictionaryService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    getWarehouseDictionaryItemsByCode(warehouseCode, code, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling getWarehouseDictionaryItemsByCode.');
        }
        if (code === null || code === undefined) {
            throw new Error('Required parameter code was null or undefined when calling getWarehouseDictionaryItemsByCode.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/dictionary/${this.configuration.encodeParam({ name: "code", value: code, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseDictionaryService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseDictionaryService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseDictionaryService, decorators: [{
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
    copyWarehouseRecordsToClipboard(warehouseCode, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling copyWarehouseRecordsToClipboard.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv/clipboard`;
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
    uploadWarehouseRecordsFromClipboard(warehouseCode, body, observe = 'body', reportProgress = false, options) {
        if (warehouseCode === null || warehouseCode === undefined) {
            throw new Error('Required parameter warehouseCode was null or undefined when calling uploadWarehouseRecordsFromClipboard.');
        }
        if (body === null || body === undefined) {
            throw new Error('Required parameter body was null or undefined when calling uploadWarehouseRecordsFromClipboard.');
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
        let localVarPath = `/api/warehouse/${this.configuration.encodeParam({ name: "warehouseCode", value: warehouseCode, in: "path", style: "simple", explode: false, dataType: "string", dataFormat: undefined })}/uploadrecord/csv/clipboard`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseUploadService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseUploadService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: WarehouseUploadService, decorators: [{
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
class YandexService extends BaseService {
    httpClient;
    constructor(httpClient, basePath, configuration) {
        super(basePath, configuration);
        this.httpClient = httpClient;
    }
    yandexOAuthCallback(code, state, cid, observe = 'body', reportProgress = false, options) {
        if (code === null || code === undefined) {
            throw new Error('Required parameter code was null or undefined when calling yandexOAuthCallback.');
        }
        let localVarQueryParameters = new OpenApiHttpParams(this.encoder);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'state', state, QueryParamStyle.Form, true);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'code', code, QueryParamStyle.Form, true);
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, 'cid', cid, QueryParamStyle.Form, true);
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
        let localVarPath = `/auth/callback/callback`;
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: YandexService, deps: [{ token: i1.HttpClient }, { token: BASE_PATH, optional: true }, { token: Configuration, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: YandexService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: YandexService, decorators: [{
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

const APIS = [AbsentArticlesService, AbsentShelfService, AdminService, ArticleService, ArticlesService, DictionaryService, ExampleService, HelloWorldService, HelperService, HistoryService, ImageService, InventoriesService, InventoryService, InventoryProcessService, InventoryProcessesService, InventoryTaskService, LoginService, MainBookService, ManagersService, OrderService, OrderAbsentRecordService, OrderBoxService, OrderRecordsService, OrderTaskService, OrderTransformedRecordsService, OrderTransitionService, OrderUploadService, OrderUploadAbsentArticleService, OrdersService, PersonService, PrintService, PrintAgentService, PrintersService, ShelfService, StockService, SuppliesService, SupplyService, SupplyTaskService, SupplyTasksService, SupplyTransitionService, SupplyUploadRecordService, SystemService, TaskService, TenantService, TenantsService, ToStockTransitionService, TransitionService, TurnoverService, WarehouseService, WarehouseDictionaryService, WarehouseUploadService, YandexService];

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
var InventoryDto;
(function (InventoryDto) {
    InventoryDto.StateEnum = {
        Uploading: 'UPLOADING',
        Closed: 'CLOSED'
    };
})(InventoryDto || (InventoryDto = {}));

/**
 * OpenAPI definition
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var InventoryProcessDto;
(function (InventoryProcessDto) {
    InventoryProcessDto.StateEnum = {
        Uploading: 'UPLOADING',
        Closed: 'CLOSED'
    };
})(InventoryProcessDto || (InventoryProcessDto = {}));

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
var OrderBoxDto;
(function (OrderBoxDto) {
    OrderBoxDto.StateEnum = {
        Open: 'OPEN',
        Closed: 'CLOSED'
    };
})(OrderBoxDto || (OrderBoxDto = {}));

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
    OrderDto.TransitionTypeEnum = {
        Undefined: 'UNDEFINED',
        Full: 'FULL',
        Partial: 'PARTIAL'
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
var TransitionFilterFlatDto;
(function (TransitionFilterFlatDto) {
    TransitionFilterFlatDto.TransitionTypeEnum = {
        ToWarehouseFromOutside: 'TO_WAREHOUSE_FROM_OUTSIDE',
        ToOutsideFromWarehouse: 'TO_OUTSIDE_FROM_WAREHOUSE',
        ToWarehouseFromSupply: 'TO_WAREHOUSE_FROM_SUPPLY',
        ToSupplyFromWarehouse: 'TO_SUPPLY_FROM_WAREHOUSE',
        ToOrderFromWarehouse: 'TO_ORDER_FROM_WAREHOUSE',
        ToOutsideFromOrder: 'TO_OUTSIDE_FROM_ORDER',
        ToOrderFromOutside: 'TO_ORDER_FROM_OUTSIDE',
        ToWarehouseFromOrder: 'TO_WAREHOUSE_FROM_ORDER',
        ToWarehouseFromWarehouse: 'TO_WAREHOUSE_FROM_WAREHOUSE',
        ToOrderboxFromOrder: 'TO_ORDERBOX_FROM_ORDER',
        ToOrderFromOrderbox: 'TO_ORDER_FROM_ORDERBOX'
    };
})(TransitionFilterFlatDto || (TransitionFilterFlatDto = {}));

var TransitionHistoryDto;
(function (TransitionHistoryDto) {
    TransitionHistoryDto.TransitionTypeEnum = {
        ToWarehouseFromOutside: 'TO_WAREHOUSE_FROM_OUTSIDE',
        ToOutsideFromWarehouse: 'TO_OUTSIDE_FROM_WAREHOUSE',
        ToWarehouseFromSupply: 'TO_WAREHOUSE_FROM_SUPPLY',
        ToSupplyFromWarehouse: 'TO_SUPPLY_FROM_WAREHOUSE',
        ToOrderFromWarehouse: 'TO_ORDER_FROM_WAREHOUSE',
        ToOutsideFromOrder: 'TO_OUTSIDE_FROM_ORDER',
        ToOrderFromOutside: 'TO_ORDER_FROM_OUTSIDE',
        ToWarehouseFromOrder: 'TO_WAREHOUSE_FROM_ORDER',
        ToWarehouseFromWarehouse: 'TO_WAREHOUSE_FROM_WAREHOUSE',
        ToOrderboxFromOrder: 'TO_ORDERBOX_FROM_ORDER',
        ToOrderFromOrderbox: 'TO_ORDER_FROM_ORDERBOX'
    };
})(TransitionHistoryDto || (TransitionHistoryDto = {}));

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
var WarehouseDto;
(function (WarehouseDto) {
    WarehouseDto.StateEnum = {
        Uploading: 'UPLOADING',
        CheckedSucceded: 'CHECKED_SUCCEDED',
        CheckedFailed: 'CHECKED_FAILED',
        Active: 'ACTIVE'
    };
})(WarehouseDto || (WarehouseDto = {}));

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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ApiModule, deps: [{ token: ApiModule, optional: true, skipSelf: true }, { token: i1.HttpClient, optional: true }], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "19.2.25", ngImport: i0, type: ApiModule });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ApiModule });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ApiModule, decorators: [{
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

export { APIS, AbsentArticlesService, AbsentShelfService, AdminService, ApiModule, ArticleService, ArticlesService, BASE_PATH, COLLECTION_FORMATS, Configuration, DictionaryService, ExampleService, HelloWorldService, HelperService, HistoryService, ImageService, InventoriesService, InventoryDto, InventoryProcessDto, InventoryProcessService, InventoryProcessesService, InventoryService, InventoryTaskService, LoginService, MainBookService, ManagersService, OrderAbsentRecordService, OrderBoxDto, OrderBoxService, OrderDto, OrderRecordsService, OrderService, OrderTaskService, OrderTransformedRecordsService, OrderTransitionService, OrderUploadAbsentArticleService, OrderUploadService, OrdersService, PersonDto, PersonService, PrintAgentService, PrintService, PrintersService, ShelfService, StockService, SuppliesService, SupplyDto, SupplyService, SupplyTaskService, SupplyTasksService, SupplyTransitionService, SupplyUploadRecordService, SystemService, TaskService, TenantService, TenantsService, ToStockTransitionService, TransitionFilterFlatDto, TransitionHistoryDto, TransitionService, TurnoverService, WarehouseDictionaryService, WarehouseDto, WarehouseService, WarehouseUploadService, YandexService, provideApi };
//# sourceMappingURL=wh-open-client.mjs.map
