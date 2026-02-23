export class Configuration {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL3dodWktY2xpZW50L3NyYy9saWIvYXBpLWNsaWVudC9jb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXFDQSxNQUFNLE9BQU8sYUFBYTtJQUN0Qjs7T0FFRztJQUNILE9BQU8sQ0FBNkI7SUFDcEMsUUFBUSxDQUFVO0lBQ2xCLFFBQVEsQ0FBVTtJQUNsQjs7T0FFRztJQUNILFdBQVcsQ0FBMkI7SUFDdEMsUUFBUSxDQUFVO0lBQ2xCLGVBQWUsQ0FBVztJQUMxQjs7T0FFRztJQUNILE9BQU8sQ0FBc0I7SUFDN0I7Ozs7OztPQU1HO0lBQ0gsV0FBVyxDQUEyQjtJQUN0Qzs7OztPQUlHO0lBQ0gsV0FBVyxDQUF5RDtJQUV4RSxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxlQUFlLEtBQThCLEVBQUU7UUFDNUksSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzNCLENBQUM7UUFDRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUM3QixDQUFDO1FBQ0QsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDN0IsQ0FBQztRQUNELElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQ25DLENBQUM7UUFDRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUM3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R0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDakQsQ0FBQyxDQUFDLE9BQU8sQ0FBQztJQUNsQixDQUFDO0lBRU0sb0JBQW9CLENBQUMsYUFBcUIsRUFBRSxTQUFpQixFQUFFLEtBQXdCO1FBQzFGLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRCxPQUFPLEtBQUs7WUFDUixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDaEIsQ0FBQztJQUVPLGtCQUFrQixDQUFDLEtBQVk7UUFDbkMsbUVBQW1FO1FBQ25FLGtGQUFrRjtRQUNsRixrREFBa0Q7UUFDbEQsdURBQXVEO1FBQ3ZELHNFQUFzRTtRQUN0RSxFQUFFO1FBQ0YsMkZBQTJGO1FBRTNGLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxVQUFVLEtBQUssV0FBVyxJQUFJLEtBQUssQ0FBQyxLQUFLLFlBQVksSUFBSTtZQUN6RSxDQUFDLENBQUUsS0FBSyxDQUFDLEtBQWMsQ0FBQyxXQUFXLEVBQUU7WUFDckMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFFbEIsT0FBTyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwSGVhZGVycywgSHR0cFBhcmFtZXRlckNvZGVjIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgUGFyYW0gfSBmcm9tICcuL3BhcmFtJztcbmltcG9ydCB7IE9wZW5BcGlIdHRwUGFyYW1zIH0gZnJvbSAnLi9xdWVyeS5wYXJhbXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZ3VyYXRpb25QYXJhbWV0ZXJzIHtcbiAgICAvKipcbiAgICAgKiAgQGRlcHJlY2F0ZWQgU2luY2UgNS4wLiBVc2UgY3JlZGVudGlhbHMgaW5zdGVhZFxuICAgICAqL1xuICAgIGFwaUtleXM/OiB7WyBrZXk6IHN0cmluZyBdOiBzdHJpbmd9O1xuICAgIHVzZXJuYW1lPzogc3RyaW5nO1xuICAgIHBhc3N3b3JkPzogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqICBAZGVwcmVjYXRlZCBTaW5jZSA1LjAuIFVzZSBjcmVkZW50aWFscyBpbnN0ZWFkXG4gICAgICovXG4gICAgYWNjZXNzVG9rZW4/OiBzdHJpbmcgfCAoKCkgPT4gc3RyaW5nKTtcbiAgICBiYXNlUGF0aD86IHN0cmluZztcbiAgICB3aXRoQ3JlZGVudGlhbHM/OiBib29sZWFuO1xuICAgIC8qKlxuICAgICAqIFRha2VzIGNhcmUgb2YgZW5jb2RpbmcgcXVlcnktIGFuZCBmb3JtLXBhcmFtZXRlcnMuXG4gICAgICovXG4gICAgZW5jb2Rlcj86IEh0dHBQYXJhbWV0ZXJDb2RlYztcbiAgICAvKipcbiAgICAgKiBPdmVycmlkZSB0aGUgZGVmYXVsdCBtZXRob2QgZm9yIGVuY29kaW5nIHBhdGggcGFyYW1ldGVycyBpbiB2YXJpb3VzXG4gICAgICogPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS9PQUkvT3BlbkFQSS1TcGVjaWZpY2F0aW9uL2Jsb2IvbWFpbi92ZXJzaW9ucy8zLjEuMC5tZCNzdHlsZS12YWx1ZXNcIj5zdHlsZXM8L2E+LlxuICAgICAqIDxwPlxuICAgICAqIFNlZSB7QGxpbmsgUkVBRE1FLm1kfSBmb3IgbW9yZSBkZXRhaWxzXG4gICAgICogPC9wPlxuICAgICAqL1xuICAgIGVuY29kZVBhcmFtPzogKHBhcmFtOiBQYXJhbSkgPT4gc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIFRoZSBrZXlzIGFyZSB0aGUgbmFtZXMgaW4gdGhlIHNlY3VyaXR5U2NoZW1lcyBzZWN0aW9uIG9mIHRoZSBPcGVuQVBJXG4gICAgICogZG9jdW1lbnQuIFRoZXkgc2hvdWxkIG1hcCB0byB0aGUgdmFsdWUgdXNlZCBmb3IgYXV0aGVudGljYXRpb25cbiAgICAgKiBtaW51cyBhbnkgc3RhbmRhcmQgcHJlZml4ZXMgc3VjaCBhcyAnQmFzaWMnIG9yICdCZWFyZXInLlxuICAgICAqL1xuICAgIGNyZWRlbnRpYWxzPzoge1sga2V5OiBzdHJpbmcgXTogc3RyaW5nIHwgKCgpID0+IHN0cmluZyB8IHVuZGVmaW5lZCl9O1xufVxuXG5leHBvcnQgY2xhc3MgQ29uZmlndXJhdGlvbiB7XG4gICAgLyoqXG4gICAgICogIEBkZXByZWNhdGVkIFNpbmNlIDUuMC4gVXNlIGNyZWRlbnRpYWxzIGluc3RlYWRcbiAgICAgKi9cbiAgICBhcGlLZXlzPzoge1sga2V5OiBzdHJpbmcgXTogc3RyaW5nfTtcbiAgICB1c2VybmFtZT86IHN0cmluZztcbiAgICBwYXNzd29yZD86IHN0cmluZztcbiAgICAvKipcbiAgICAgKiAgQGRlcHJlY2F0ZWQgU2luY2UgNS4wLiBVc2UgY3JlZGVudGlhbHMgaW5zdGVhZFxuICAgICAqL1xuICAgIGFjY2Vzc1Rva2VuPzogc3RyaW5nIHwgKCgpID0+IHN0cmluZyk7XG4gICAgYmFzZVBhdGg/OiBzdHJpbmc7XG4gICAgd2l0aENyZWRlbnRpYWxzPzogYm9vbGVhbjtcbiAgICAvKipcbiAgICAgKiBUYWtlcyBjYXJlIG9mIGVuY29kaW5nIHF1ZXJ5LSBhbmQgZm9ybS1wYXJhbWV0ZXJzLlxuICAgICAqL1xuICAgIGVuY29kZXI/OiBIdHRwUGFyYW1ldGVyQ29kZWM7XG4gICAgLyoqXG4gICAgICogRW5jb2Rpbmcgb2YgdmFyaW91cyBwYXRoIHBhcmFtZXRlclxuICAgICAqIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vT0FJL09wZW5BUEktU3BlY2lmaWNhdGlvbi9ibG9iL21haW4vdmVyc2lvbnMvMy4xLjAubWQjc3R5bGUtdmFsdWVzXCI+c3R5bGVzPC9hPi5cbiAgICAgKiA8cD5cbiAgICAgKiBTZWUge0BsaW5rIFJFQURNRS5tZH0gZm9yIG1vcmUgZGV0YWlsc1xuICAgICAqIDwvcD5cbiAgICAgKi9cbiAgICBlbmNvZGVQYXJhbTogKHBhcmFtOiBQYXJhbSkgPT4gc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIFRoZSBrZXlzIGFyZSB0aGUgbmFtZXMgaW4gdGhlIHNlY3VyaXR5U2NoZW1lcyBzZWN0aW9uIG9mIHRoZSBPcGVuQVBJXG4gICAgICogZG9jdW1lbnQuIFRoZXkgc2hvdWxkIG1hcCB0byB0aGUgdmFsdWUgdXNlZCBmb3IgYXV0aGVudGljYXRpb25cbiAgICAgKiBtaW51cyBhbnkgc3RhbmRhcmQgcHJlZml4ZXMgc3VjaCBhcyAnQmFzaWMnIG9yICdCZWFyZXInLlxuICAgICAqL1xuICAgIGNyZWRlbnRpYWxzOiB7WyBrZXk6IHN0cmluZyBdOiBzdHJpbmcgfCAoKCkgPT4gc3RyaW5nIHwgdW5kZWZpbmVkKX07XG5cbmNvbnN0cnVjdG9yKHsgYWNjZXNzVG9rZW4sIGFwaUtleXMsIGJhc2VQYXRoLCBjcmVkZW50aWFscywgZW5jb2RlUGFyYW0sIGVuY29kZXIsIHBhc3N3b3JkLCB1c2VybmFtZSwgd2l0aENyZWRlbnRpYWxzIH06IENvbmZpZ3VyYXRpb25QYXJhbWV0ZXJzID0ge30pIHtcbiAgICAgICAgaWYgKGFwaUtleXMpIHtcbiAgICAgICAgICAgIHRoaXMuYXBpS2V5cyA9IGFwaUtleXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZXJuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFzc3dvcmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY2Nlc3NUb2tlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuID0gYWNjZXNzVG9rZW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJhc2VQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYmFzZVBhdGggPSBiYXNlUGF0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAod2l0aENyZWRlbnRpYWxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMud2l0aENyZWRlbnRpYWxzID0gd2l0aENyZWRlbnRpYWxzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbmNvZGVyKSB7XG4gICAgICAgICAgICB0aGlzLmVuY29kZXIgPSBlbmNvZGVyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW5jb2RlUGFyYW0gPSBlbmNvZGVQYXJhbSA/PyAocGFyYW0gPT4gdGhpcy5kZWZhdWx0RW5jb2RlUGFyYW0ocGFyYW0pKTtcbiAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGNyZWRlbnRpYWxzID8/IHt9O1xuXG4gICAgICAgIC8vIGluaXQgZGVmYXVsdCBiZWFyZXJBdXRoIGNyZWRlbnRpYWxcbiAgICAgICAgaWYgKCF0aGlzLmNyZWRlbnRpYWxzWydiZWFyZXJBdXRoJ10pIHtcbiAgICAgICAgICAgIHRoaXMuY3JlZGVudGlhbHNbJ2JlYXJlckF1dGgnXSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuYWNjZXNzVG9rZW4gPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmFjY2Vzc1Rva2VuKClcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmFjY2Vzc1Rva2VuO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbGVjdCB0aGUgY29ycmVjdCBjb250ZW50LXR5cGUgdG8gdXNlIGZvciBhIHJlcXVlc3QuXG4gICAgICogVXNlcyB7QGxpbmsgQ29uZmlndXJhdGlvbiNpc0pzb25NaW1lfSB0byBkZXRlcm1pbmUgdGhlIGNvcnJlY3QgY29udGVudC10eXBlLlxuICAgICAqIElmIG5vIGNvbnRlbnQgdHlwZSBpcyBmb3VuZCByZXR1cm4gdGhlIGZpcnN0IGZvdW5kIHR5cGUgaWYgdGhlIGNvbnRlbnRUeXBlcyBpcyBub3QgZW1wdHlcbiAgICAgKiBAcGFyYW0gY29udGVudFR5cGVzIC0gdGhlIGFycmF5IG9mIGNvbnRlbnQgdHlwZXMgdGhhdCBhcmUgYXZhaWxhYmxlIGZvciBzZWxlY3Rpb25cbiAgICAgKiBAcmV0dXJucyB0aGUgc2VsZWN0ZWQgY29udGVudC10eXBlIG9yIDxjb2RlPnVuZGVmaW5lZDwvY29kZT4gaWYgbm8gc2VsZWN0aW9uIGNvdWxkIGJlIG1hZGUuXG4gICAgICovXG4gICAgcHVibGljIHNlbGVjdEhlYWRlckNvbnRlbnRUeXBlIChjb250ZW50VHlwZXM6IHN0cmluZ1tdKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgaWYgKGNvbnRlbnRUeXBlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eXBlID0gY29udGVudFR5cGVzLmZpbmQoKHg6IHN0cmluZykgPT4gdGhpcy5pc0pzb25NaW1lKHgpKTtcbiAgICAgICAgaWYgKHR5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRUeXBlc1swXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWxlY3QgdGhlIGNvcnJlY3QgYWNjZXB0IGNvbnRlbnQtdHlwZSB0byB1c2UgZm9yIGEgcmVxdWVzdC5cbiAgICAgKiBVc2VzIHtAbGluayBDb25maWd1cmF0aW9uI2lzSnNvbk1pbWV9IHRvIGRldGVybWluZSB0aGUgY29ycmVjdCBhY2NlcHQgY29udGVudC10eXBlLlxuICAgICAqIElmIG5vIGNvbnRlbnQgdHlwZSBpcyBmb3VuZCByZXR1cm4gdGhlIGZpcnN0IGZvdW5kIHR5cGUgaWYgdGhlIGNvbnRlbnRUeXBlcyBpcyBub3QgZW1wdHlcbiAgICAgKiBAcGFyYW0gYWNjZXB0cyAtIHRoZSBhcnJheSBvZiBjb250ZW50IHR5cGVzIHRoYXQgYXJlIGF2YWlsYWJsZSBmb3Igc2VsZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHRoZSBzZWxlY3RlZCBjb250ZW50LXR5cGUgb3IgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPiBpZiBubyBzZWxlY3Rpb24gY291bGQgYmUgbWFkZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2VsZWN0SGVhZGVyQWNjZXB0KGFjY2VwdHM6IHN0cmluZ1tdKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgaWYgKGFjY2VwdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHlwZSA9IGFjY2VwdHMuZmluZCgoeDogc3RyaW5nKSA9PiB0aGlzLmlzSnNvbk1pbWUoeCkpO1xuICAgICAgICBpZiAodHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYWNjZXB0c1swXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gTUlNRSBpcyBhIEpTT04gTUlNRS5cbiAgICAgKiBKU09OIE1JTUUgZXhhbXBsZXM6XG4gICAgICogICBhcHBsaWNhdGlvbi9qc29uXG4gICAgICogICBhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PVVURjhcbiAgICAgKiAgIEFQUExJQ0FUSU9OL0pTT05cbiAgICAgKiAgIGFwcGxpY2F0aW9uL3ZuZC5jb21wYW55K2pzb25cbiAgICAgKiBAcGFyYW0gbWltZSAtIE1JTUUgKE11bHRpcHVycG9zZSBJbnRlcm5ldCBNYWlsIEV4dGVuc2lvbnMpXG4gICAgICogQHJldHVybiBUcnVlIGlmIHRoZSBnaXZlbiBNSU1FIGlzIEpTT04sIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgaXNKc29uTWltZShtaW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QganNvbk1pbWU6IFJlZ0V4cCA9IG5ldyBSZWdFeHAoJ14oYXBwbGljYXRpb25cXC9qc29ufFteOy8gXFx0XStcXC9bXjsvIFxcdF0rWytdanNvbilbIFxcdF0qKDsuKik/JCcsICdpJyk7XG4gICAgICAgIHJldHVybiBtaW1lICE9PSBudWxsICYmIChqc29uTWltZS50ZXN0KG1pbWUpIHx8IG1pbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2FwcGxpY2F0aW9uL2pzb24tcGF0Y2granNvbicpO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb29rdXBDcmVkZW50aWFsKGtleTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmNyZWRlbnRpYWxzW2tleV07XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgID8gdmFsdWUoKVxuICAgICAgICAgICAgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkQ3JlZGVudGlhbFRvSGVhZGVycyhjcmVkZW50aWFsS2V5OiBzdHJpbmcsIGhlYWRlck5hbWU6IHN0cmluZywgaGVhZGVyczogSHR0cEhlYWRlcnMsIHByZWZpeD86IHN0cmluZyk6IEh0dHBIZWFkZXJzIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmxvb2t1cENyZWRlbnRpYWwoY3JlZGVudGlhbEtleSk7XG4gICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgPyBoZWFkZXJzLnNldChoZWFkZXJOYW1lLCAocHJlZml4ID8/ICcnKSArIHZhbHVlKVxuICAgICAgICAgICAgOiBoZWFkZXJzO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRDcmVkZW50aWFsVG9RdWVyeShjcmVkZW50aWFsS2V5OiBzdHJpbmcsIHBhcmFtTmFtZTogc3RyaW5nLCBxdWVyeTogT3BlbkFwaUh0dHBQYXJhbXMpOiBPcGVuQXBpSHR0cFBhcmFtcyB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5sb29rdXBDcmVkZW50aWFsKGNyZWRlbnRpYWxLZXkpO1xuICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgID8gcXVlcnkuc2V0KHBhcmFtTmFtZSwgdmFsdWUpXG4gICAgICAgICAgICA6IHF1ZXJ5O1xuICAgIH1cblxuICAgIHByaXZhdGUgZGVmYXVsdEVuY29kZVBhcmFtKHBhcmFtOiBQYXJhbSk6IHN0cmluZyB7XG4gICAgICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gZXhpc3RzIGFzIGZhbGxiYWNrIGZvciBtaXNzaW5nIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgLy8gYW5kIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB0byBvbGRlciB0eXBlc2NyaXB0LWFuZ3VsYXIgZ2VuZXJhdG9yIHZlcnNpb25zLlxuICAgICAgICAvLyBJdCBvbmx5IHdvcmtzIGZvciB0aGUgJ3NpbXBsZScgcGFyYW1ldGVyIHN0eWxlLlxuICAgICAgICAvLyBEYXRlLWhhbmRsaW5nIG9ubHkgd29ya3MgZm9yIHRoZSAnZGF0ZS10aW1lJyBmb3JtYXQuXG4gICAgICAgIC8vIEFsbCBvdGhlciBzdHlsZXMgYW5kIERhdGUtZm9ybWF0cyBhcmUgcHJvYmFibHkgaGFuZGxlZCBpbmNvcnJlY3RseS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQnV0OiBpZiB0aGF0J3MgYWxsIHlvdSBuZWVkIChpLmUuOiB0aGUgbW9zdCBjb21tb24gdXNlLWNhc2UpOiBubyBuZWVkIGZvciBjdXN0b21pemF0aW9uIVxuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyYW0uZGF0YUZvcm1hdCA9PT0gJ2RhdGUtdGltZScgJiYgcGFyYW0udmFsdWUgaW5zdGFuY2VvZiBEYXRlXG4gICAgICAgICAgICA/IChwYXJhbS52YWx1ZSBhcyBEYXRlKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICA6IHBhcmFtLnZhbHVlO1xuXG4gICAgICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoU3RyaW5nKHZhbHVlKSk7XG4gICAgfVxufVxuIl19