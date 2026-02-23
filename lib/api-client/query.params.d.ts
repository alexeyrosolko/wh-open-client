import { HttpParams, HttpParameterCodec } from '@angular/common/http';
export declare enum QueryParamStyle {
    Json = 0,
    Form = 1,
    DeepObject = 2,
    SpaceDelimited = 3,
    PipeDelimited = 4
}
export type Delimiter = "," | " " | "|" | "\t";
export interface ParamOptions {
    /** When true, serialized as multiple repeated key=value pairs. When false, serialized as a single key with joined values using `delimiter`. */
    explode?: boolean;
    /** Delimiter used when explode=false. The delimiter itself is inserted unencoded between encoded values. */
    delimiter?: Delimiter;
}
export declare class OpenApiHttpParams {
    private params;
    private defaults;
    private encoder;
    /**
     * @param encoder  Parameter serializer
     * @param defaults Global defaults used when a specific parameter has no explicit options.
     *                 By OpenAPI default, explode is true for query params with style=form.
     */
    constructor(encoder?: HttpParameterCodec, defaults?: {
        explode?: boolean;
        delimiter?: Delimiter;
    });
    private resolveOptions;
    /**
     * Replace the parameter's values and (optionally) its options.
     * Options are stored per-parameter (not global).
     */
    set(key: string, values: string[] | string, options?: ParamOptions): this;
    /**
     * Append a single value to the parameter. If the parameter didn't exist it will be created
     * and use resolved options (global defaults merged with any provided options).
     */
    append(key: string, value: string, options?: ParamOptions): this;
    /**
     * Serialize to a query string according to per-parameter OpenAPI options.
     * - If explode=true for that parameter → repeated key=value pairs (each value encoded).
     * - If explode=false for that parameter → single key=value where values are individually encoded
     *   and joined using the configured delimiter. The delimiter character is inserted AS-IS
     *   (not percent-encoded).
     */
    toString(): string;
    /**
     * Return parameters as a plain record.
     * - If a parameter has exactly one value, returns that value directly.
     * - If a parameter has multiple values, returns a readonly array of values.
     */
    toRecord(): Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
    /**
     * Return an Angular's HttpParams with an identity parameter codec as the parameters are already encoded.
     */
    toHttpParams(): HttpParams;
}
export declare function concatHttpParamsObject(httpParams: OpenApiHttpParams, key: string, item: {
    [index: string]: any;
}, delimiter: Delimiter): OpenApiHttpParams;
