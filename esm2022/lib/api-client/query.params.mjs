import { HttpParams } from '@angular/common/http';
import { CustomHttpParameterCodec, IdentityHttpParameterCodec } from './encoder.mjs';
export var QueryParamStyle;
(function (QueryParamStyle) {
    QueryParamStyle[QueryParamStyle["Json"] = 0] = "Json";
    QueryParamStyle[QueryParamStyle["Form"] = 1] = "Form";
    QueryParamStyle[QueryParamStyle["DeepObject"] = 2] = "DeepObject";
    QueryParamStyle[QueryParamStyle["SpaceDelimited"] = 3] = "SpaceDelimited";
    QueryParamStyle[QueryParamStyle["PipeDelimited"] = 4] = "PipeDelimited";
})(QueryParamStyle || (QueryParamStyle = {}));
export class OpenApiHttpParams {
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
export function concatHttpParamsObject(httpParams, key, item, delimiter) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkucGFyYW1zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvd2h1aS1jbGllbnQvc3JjL2xpYi9hcGktY2xpZW50L3F1ZXJ5LnBhcmFtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFzQixNQUFNLHNCQUFzQixDQUFDO0FBQ3RFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSwwQkFBMEIsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUVqRixNQUFNLENBQU4sSUFBWSxlQU1YO0FBTkQsV0FBWSxlQUFlO0lBQ3ZCLHFEQUFJLENBQUE7SUFDSixxREFBSSxDQUFBO0lBQ0osaUVBQVUsQ0FBQTtJQUNWLHlFQUFjLENBQUE7SUFDZCx1RUFBYSxDQUFBO0FBQ2pCLENBQUMsRUFOVyxlQUFlLEtBQWYsZUFBZSxRQU0xQjtBQWdCRCxNQUFNLE9BQU8saUJBQWlCO0lBQ2xCLE1BQU0sR0FBNEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUM1QyxRQUFRLENBQXlCO0lBQ2pDLE9BQU8sQ0FBcUI7SUFFcEM7Ozs7T0FJRztJQUNILFlBQVksT0FBNEIsRUFBRSxRQUF1RDtRQUM3RixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxJQUFJLHdCQUF3QixFQUFFLENBQUM7UUFDekQsSUFBSSxDQUFDLFFBQVEsR0FBRztZQUNaLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxJQUFJLElBQUk7WUFDbEMsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLElBQUksR0FBRztTQUN4QyxDQUFDO0lBQ04sQ0FBQztJQUVPLGNBQWMsQ0FBQyxLQUFvQjtRQUN2QyxPQUFPO1lBQ0gsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPO1lBQ2hELFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUztTQUN6RCxD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Q2hDLENBQUM7U0FBTSxDQUFDO1FBQ0osT0FBTyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwUGFyYW1zLCBIdHRwUGFyYW1ldGVyQ29kZWMgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBDdXN0b21IdHRwUGFyYW1ldGVyQ29kZWMsIElkZW50aXR5SHR0cFBhcmFtZXRlckNvZGVjIH0gZnJvbSAnLi9lbmNvZGVyJztcblxuZXhwb3J0IGVudW0gUXVlcnlQYXJhbVN0eWxlIHtcbiAgICBKc29uLFxuICAgIEZvcm0sXG4gICAgRGVlcE9iamVjdCxcbiAgICBTcGFjZURlbGltaXRlZCxcbiAgICBQaXBlRGVsaW1pdGVkLFxufVxuXG5leHBvcnQgdHlwZSBEZWxpbWl0ZXIgPSBcIixcIiB8IFwiIFwiIHwgXCJ8XCIgfCBcIlxcdFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcmFtT3B0aW9ucyB7XG4gICAgLyoqIFdoZW4gdHJ1ZSwgc2VyaWFsaXplZCBhcyBtdWx0aXBsZSByZXBlYXRlZCBrZXk9dmFsdWUgcGFpcnMuIFdoZW4gZmFsc2UsIHNlcmlhbGl6ZWQgYXMgYSBzaW5nbGUga2V5IHdpdGggam9pbmVkIHZhbHVlcyB1c2luZyBgZGVsaW1pdGVyYC4gKi9cbiAgICBleHBsb2RlPzogYm9vbGVhbjtcbiAgICAvKiogRGVsaW1pdGVyIHVzZWQgd2hlbiBleHBsb2RlPWZhbHNlLiBUaGUgZGVsaW1pdGVyIGl0c2VsZiBpcyBpbnNlcnRlZCB1bmVuY29kZWQgYmV0d2VlbiBlbmNvZGVkIHZhbHVlcy4gKi9cbiAgICBkZWxpbWl0ZXI/OiBEZWxpbWl0ZXI7XG59XG5cbmludGVyZmFjZSBQYXJhbUVudHJ5IHtcbiAgICB2YWx1ZXM6IHN0cmluZ1tdO1xuICAgIG9wdGlvbnM6IFJlcXVpcmVkPFBhcmFtT3B0aW9ucz47XG59XG5cbmV4cG9ydCBjbGFzcyBPcGVuQXBpSHR0cFBhcmFtcyB7XG4gICAgcHJpdmF0ZSBwYXJhbXM6IE1hcDxzdHJpbmcsIFBhcmFtRW50cnk+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgZGVmYXVsdHM6IFJlcXVpcmVkPFBhcmFtT3B0aW9ucz47XG4gICAgcHJpdmF0ZSBlbmNvZGVyOiBIdHRwUGFyYW1ldGVyQ29kZWM7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gZW5jb2RlciAgUGFyYW1ldGVyIHNlcmlhbGl6ZXJcbiAgICAgKiBAcGFyYW0gZGVmYXVsdHMgR2xvYmFsIGRlZmF1bHRzIHVzZWQgd2hlbiBhIHNwZWNpZmljIHBhcmFtZXRlciBoYXMgbm8gZXhwbGljaXQgb3B0aW9ucy5cbiAgICAgKiAgICAgICAgICAgICAgICAgQnkgT3BlbkFQSSBkZWZhdWx0LCBleHBsb2RlIGlzIHRydWUgZm9yIHF1ZXJ5IHBhcmFtcyB3aXRoIHN0eWxlPWZvcm0uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZW5jb2Rlcj86IEh0dHBQYXJhbWV0ZXJDb2RlYywgZGVmYXVsdHM/OiB7IGV4cGxvZGU/OiBib29sZWFuOyBkZWxpbWl0ZXI/OiBEZWxpbWl0ZXIgfSkge1xuICAgICAgICB0aGlzLmVuY29kZXIgPSBlbmNvZGVyIHx8IG5ldyBDdXN0b21IdHRwUGFyYW1ldGVyQ29kZWMoKTtcbiAgICAgICAgdGhpcy5kZWZhdWx0cyA9IHtcbiAgICAgICAgICAgIGV4cGxvZGU6IGRlZmF1bHRzPy5leHBsb2RlID8/IHRydWUsXG4gICAgICAgICAgICBkZWxpbWl0ZXI6IGRlZmF1bHRzPy5kZWxpbWl0ZXIgPz8gXCIsXCIsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNvbHZlT3B0aW9ucyhsb2NhbD86IFBhcmFtT3B0aW9ucyk6IFJlcXVpcmVkPFBhcmFtT3B0aW9ucz4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXhwbG9kZTogbG9jYWw/LmV4cGxvZGUgPz8gdGhpcy5kZWZhdWx0cy5leHBsb2RlLFxuICAgICAgICAgICAgZGVsaW1pdGVyOiBsb2NhbD8uZGVsaW1pdGVyID8/IHRoaXMuZGVmYXVsdHMuZGVsaW1pdGVyLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2UgdGhlIHBhcmFtZXRlcidzIHZhbHVlcyBhbmQgKG9wdGlvbmFsbHkpIGl0cyBvcHRpb25zLlxuICAgICAqIE9wdGlvbnMgYXJlIHN0b3JlZCBwZXItcGFyYW1ldGVyIChub3QgZ2xvYmFsKS5cbiAgICAgKi9cbiAgICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlczogc3RyaW5nW10gfCBzdHJpbmcsIG9wdGlvbnM/OiBQYXJhbU9wdGlvbnMpOiB0aGlzIHtcbiAgICAgICAgY29uc3QgYXJyID0gQXJyYXkuaXNBcnJheSh2YWx1ZXMpID8gdmFsdWVzLnNsaWNlKCkgOiBbdmFsdWVzXTtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHRoaXMucmVzb2x2ZU9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMucGFyYW1zLnNldChrZXksIHt2YWx1ZXM6IGFyciwgb3B0aW9uczogb3B0c30pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmQgYSBzaW5nbGUgdmFsdWUgdG8gdGhlIHBhcmFtZXRlci4gSWYgdGhlIHBhcmFtZXRlciBkaWRuJ3QgZXhpc3QgaXQgd2lsbCBiZSBjcmVhdGVkXG4gICAgICogYW5kIHVzZSByZXNvbHZlZCBvcHRpb25zIChnbG9iYWwgZGVmYXVsdHMgbWVyZ2VkIHdpdGggYW55IHByb3ZpZGVkIG9wdGlvbnMpLlxuICAgICAqL1xuICAgIGFwcGVuZChrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZywgb3B0aW9ucz86IFBhcmFtT3B0aW9ucyk6IHRoaXMge1xuICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMucGFyYW1zLmdldChrZXkpO1xuICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICAgIC8vIElmIG5ldyBvcHRpb25zIHByb3ZpZGVkLCBvdmVycmlkZSB0aGUgc3RvcmVkIG9wdGlvbnMgZm9yIHN1YnNlcXVlbnQgc2VyaWFsaXphdGlvblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBlbnRyeS5vcHRpb25zID0gdGhpcy5yZXNvbHZlT3B0aW9ucyh7Li4uZW50cnkub3B0aW9ucywgLi4ub3B0aW9uc30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW50cnkudmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXQoa2V5LCBbdmFsdWVdLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemUgdG8gYSBxdWVyeSBzdHJpbmcgYWNjb3JkaW5nIHRvIHBlci1wYXJhbWV0ZXIgT3BlbkFQSSBvcHRpb25zLlxuICAgICAqIC0gSWYgZXhwbG9kZT10cnVlIGZvciB0aGF0IHBhcmFtZXRlciDihpIgcmVwZWF0ZWQga2V5PXZhbHVlIHBhaXJzIChlYWNoIHZhbHVlIGVuY29kZWQpLlxuICAgICAqIC0gSWYgZXhwbG9kZT1mYWxzZSBmb3IgdGhhdCBwYXJhbWV0ZXIg4oaSIHNpbmdsZSBrZXk9dmFsdWUgd2hlcmUgdmFsdWVzIGFyZSBpbmRpdmlkdWFsbHkgZW5jb2RlZFxuICAgICAqICAgYW5kIGpvaW5lZCB1c2luZyB0aGUgY29uZmlndXJlZCBkZWxpbWl0ZXIuIFRoZSBkZWxpbWl0ZXIgY2hhcmFjdGVyIGlzIGluc2VydGVkIEFTLUlTXG4gICAgICogICAobm90IHBlcmNlbnQtZW5jb2RlZCkuXG4gICAgICovXG4gICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgcmVjb3JkcyA9IHRoaXMudG9SZWNvcmQoKTtcbiAgICAgICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcmVjb3Jkcykge1xuICAgICAgICAgICAgcGFydHMucHVzaChgJHtrZXl9PSR7cmVjb3Jkc1trZXldfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oXCImXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBwYXJhbWV0ZXJzIGFzIGEgcGxhaW4gcmVjb3JkLlxuICAgICAqIC0gSWYgYSBwYXJhbWV0ZXIgaGFzIGV4YWN0bHkgb25lIHZhbHVlLCByZXR1cm5zIHRoYXQgdmFsdWUgZGlyZWN0bHkuXG4gICAgICogLSBJZiBhIHBhcmFtZXRlciBoYXMgbXVsdGlwbGUgdmFsdWVzLCByZXR1cm5zIGEgcmVhZG9ubHkgYXJyYXkgb2YgdmFsdWVzLlxuICAgICAqL1xuICAgIHRvUmVjb3JkKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBSZWFkb25seUFycmF5PHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+PiB7XG4gICAgICAgIGNvbnN0IHBhcnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgUmVhZG9ubHlBcnJheTxzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPj4gPSB7fTtcblxuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIGVudHJ5XSBvZiB0aGlzLnBhcmFtcy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGVuY29kZWRLZXkgPSB0aGlzLmVuY29kZXIuZW5jb2RlS2V5KGtleSk7XG5cbiAgICAgICAgICAgIGlmIChlbnRyeS5vcHRpb25zLmV4cGxvZGUpIHtcbiAgICAgICAgICAgICAgICBwYXJ0c1tlbmNvZGVkS2V5XSA9IGVudHJ5LnZhbHVlcy5tYXAoKHYpID0+IHRoaXMuZW5jb2Rlci5lbmNvZGVWYWx1ZSh2KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuY29kZWRWYWx1ZXMgPSBlbnRyeS52YWx1ZXMubWFwKCh2KSA9PiB0aGlzLmVuY29kZXIuZW5jb2RlVmFsdWUodikpO1xuXG4gICAgICAgICAgICAgICAgLy8gam9pbiB3aXRoIHRoZSBkZWxpbWl0ZXIgKnVuZW5jb2RlZCpcbiAgICAgICAgICAgICAgICBwYXJ0c1tlbmNvZGVkS2V5XSA9IGVuY29kZWRWYWx1ZXMuam9pbihlbnRyeS5vcHRpb25zLmRlbGltaXRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFydHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGFuIEFuZ3VsYXIncyBIdHRwUGFyYW1zIHdpdGggYW4gaWRlbnRpdHkgcGFyYW1ldGVyIGNvZGVjIGFzIHRoZSBwYXJhbWV0ZXJzIGFyZSBhbHJlYWR5IGVuY29kZWQuXG4gICAgICovXG4gICAgdG9IdHRwUGFyYW1zKCk6IEh0dHBQYXJhbXMge1xuICAgICAgICBjb25zdCByZWNvcmRzID0gdGhpcy50b1JlY29yZCgpO1xuXG4gICAgICAgIGxldCBodHRwUGFyYW1zID0gbmV3IEh0dHBQYXJhbXMoe2VuY29kZXI6IG5ldyBJZGVudGl0eUh0dHBQYXJhbWV0ZXJDb2RlYygpfSk7XG5cbiAgICAgICAgcmV0dXJuIGh0dHBQYXJhbXMuYXBwZW5kQWxsKHJlY29yZHMpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdEh0dHBQYXJhbXNPYmplY3QoaHR0cFBhcmFtczogT3BlbkFwaUh0dHBQYXJhbXMsIGtleTogc3RyaW5nLCBpdGVtOiB7XG4gICAgW2luZGV4OiBzdHJpbmddOiBhbnlcbn0sIGRlbGltaXRlcjogRGVsaW1pdGVyKTogT3BlbkFwaUh0dHBQYXJhbXMge1xuICAgIGxldCBrZXlBbmRWYWx1ZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGsgaW4gaXRlbSkge1xuICAgICAgICBrZXlBbmRWYWx1ZXMucHVzaChrKTtcblxuICAgICAgICBjb25zdCB2YWx1ZSA9IGl0ZW1ba107XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBrZXlBbmRWYWx1ZXMucHVzaCguLi52YWx1ZS5tYXAoY29udmVydFRvU3RyaW5nKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXlBbmRWYWx1ZXMucHVzaChjb252ZXJ0VG9TdHJpbmcodmFsdWUpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBodHRwUGFyYW1zLnNldChrZXksIGtleUFuZFZhbHVlcywge2V4cGxvZGU6IGZhbHNlLCBkZWxpbWl0ZXI6IGRlbGltaXRlcn0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgcmV0dXJuIHZhbHVlLnRvSVNPU3RyaW5nKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxufVxuIl19