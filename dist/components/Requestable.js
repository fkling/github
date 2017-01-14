'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _jsBase = require('js-base64');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @copyright  2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var log = (0, _debug2.default)('github:request');

/**
 * The error structure returned when a network call fails
 */

var ResponseError = function (_Error) {
   _inherits(ResponseError, _Error);

   /**
    * Construct a new ResponseError
    * @param {string} message - an message to return instead of the the default error message
    * @param {string} path - the requested path
    * @param {Object} response - the object returned by Axios
    */
   function ResponseError(message, path, response) {
      _classCallCheck(this, ResponseError);

      var _this = _possibleConstructorReturn(this, (ResponseError.__proto__ || Object.getPrototypeOf(ResponseError)).call(this, message));

      _this.path = path;
      _this.request = response.config;
      _this.response = (response || {}).response || response;
      _this.status = response.status;
      return _this;
   }

   return ResponseError;
}(Error);

/**
 * Requestable wraps the logic for making http requests to the API
 */


var Requestable = function () {
   /**
    * Either a username and password or an oauth token for Github
    * @typedef {Object} Requestable.auth
    * @prop {string} [username] - the Github username
    * @prop {string} [password] - the user's password
    * @prop {token} [token] - an OAuth token
    */
   /**
    * Initialize the http internals.
    * @param {Requestable.auth} [auth] - the credentials to authenticate to Github. If auth is
    *                                  not provided request will be made unauthenticated
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    * @param {string} [AcceptHeader=v3] - the accept header for the requests
    */
   function Requestable(auth, apiBase, AcceptHeader) {
      _classCallCheck(this, Requestable);

      this.__apiBase = apiBase || 'https://api.github.com';
      this.__auth = {
         token: auth.token,
         username: auth.username,
         password: auth.password
      };
      this.__AcceptHeader = AcceptHeader || 'v3';

      if (auth.token) {
         this.__authorizationHeader = 'token ' + auth.token;
      } else if (auth.username && auth.password) {
         this.__authorizationHeader = 'Basic ' + _jsBase.Base64.encode(auth.username + ':' + auth.password);
      }
   }

   /**
    * Compute the URL to use to make a request.
    * @private
    * @param {string} path - either a URL relative to the API base or an absolute URL
    * @return {string} - the URL to use
    */


   _createClass(Requestable, [{
      key: '__getURL',
      value: function __getURL(path) {
         var url = path;

         if (path.indexOf('//') === -1) {
            url = this.__apiBase + path;
         }

         var newCacheBuster = 'timestamp=' + new Date().getTime();
         return url.replace(/(timestamp=\d+)/, newCacheBuster);
      }

      /**
       * Compute the headers required for an API request.
       * @private
       * @param {boolean} raw - if the request should be treated as JSON or as a raw request
       * @param {string} AcceptHeader - the accept header for the request
       * @return {Object} - the headers to use in the request
       */

   }, {
      key: '__getRequestHeaders',
      value: function __getRequestHeaders(raw, AcceptHeader) {
         var headers = {
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept': 'application/vnd.github.' + (AcceptHeader || this.__AcceptHeader)
         };

         if (raw) {
            headers.Accept += '.raw';
         }
         headers.Accept += '+json';

         if (this.__authorizationHeader) {
            headers.Authorization = this.__authorizationHeader;
         }

         return headers;
      }

      /**
       * Sets the default options for API requests
       * @protected
       * @param {Object} [requestOptions={}] - the current options for the request
       * @return {Object} - the options to pass to the request
       */

   }, {
      key: '_getOptionsWithDefaults',
      value: function _getOptionsWithDefaults() {
         var requestOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

         if (!(requestOptions.visibility || requestOptions.affiliation)) {
            requestOptions.type = requestOptions.type || 'all';
         }
         requestOptions.sort = requestOptions.sort || 'updated';
         requestOptions.per_page = requestOptions.per_page || '100'; // eslint-disable-line

         return requestOptions;
      }

      /**
       * if a `Date` is passed to this function it will be converted to an ISO string
       * @param {*} date - the object to attempt to cooerce into an ISO date string
       * @return {string} - the ISO representation of `date` or whatever was passed in if it was not a date
       */

   }, {
      key: '_dateToISO',
      value: function _dateToISO(date) {
         if (date && date instanceof Date) {
            date = date.toISOString();
         }

         return date;
      }

      /**
       * A function that receives the result of the API request.
       * @callback Requestable.callback
       * @param {Requestable.Error} error - the error returned by the API or `null`
       * @param {(Object|true)} result - the data returned by the API or `true` if the API returns `204 No Content`
       * @param {Object} request - the raw {@linkcode https://github.com/mzabriskie/axios#response-schema Response}
       */
      /**
       * Make a request.
       * @param {string} method - the method for the request (GET, PUT, POST, DELETE)
       * @param {string} path - the path for the request
       * @param {*} [data] - the data to send to the server. For HTTP methods that don't have a body the data
       *                   will be sent as query parameters
       * @param {Requestable.callback} [cb] - the callback for the request
       * @param {boolean} [raw=false] - if the request should be sent as raw. If this is a falsy value then the
       *                              request will be made as JSON
       * @return {Promise} - the Promise for the http request
       */

   }, {
      key: '_request',
      value: function _request(method, path, data, cb, raw) {
         var url = this.__getURL(path);

         var AcceptHeader = (data || {}).AcceptHeader;
         if (AcceptHeader) {
            delete data.AcceptHeader;
         }
         var headers = this.__getRequestHeaders(raw, AcceptHeader);

         var queryParams = {};

         var shouldUseDataAsParams = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && methodHasNoBody(method);
         if (shouldUseDataAsParams) {
            queryParams = data;
            data = undefined;
         }

         var config = {
            url: url,
            method: method,
            headers: headers,
            params: queryParams,
            data: data,
            responseType: raw ? 'text' : 'json'
         };

         log(config.method + ' to ' + config.url);
         var requestPromise = (0, _axios2.default)(config).catch(callbackErrorOrThrow(cb, path));

         if (cb) {
            requestPromise.then(function (response) {
               if (response.data && Object.keys(response.data).length > 0) {
                  // When data has results
                  cb(null, response.data, response);
               } else if (config.method !== 'GET' && Object.keys(response.data).length < 1) {
                  // True when successful submit a request and receive a empty object
                  cb(null, response.status < 300, response);
               } else {
                  cb(null, response.data, response);
               }
            });
         }

         return requestPromise;
      }

      /**
       * Make a request to an endpoint the returns 204 when true and 404 when false
       * @param {string} path - the path to request
       * @param {Object} data - any query parameters for the request
       * @param {Requestable.callback} cb - the callback that will receive `true` or `false`
       * @param {method} [method=GET] - HTTP Method to use
       * @return {Promise} - the promise for the http request
       */

   }, {
      key: '_request204or404',
      value: function _request204or404(path, data, cb) {
         var method = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'GET';

         return this._request(method, path, data).then(function success(response) {
            if (cb) {
               cb(null, true, response);
            }
            return true;
         }, function failure(response) {
            if (response.response.status === 404) {
               if (cb) {
                  cb(null, false, response);
               }
               return false;
            }

            if (cb) {
               cb(response);
            }
            throw response;
         });
      }

      /**
       * Make a request and fetch all the available data. Github will paginate responses so for queries
       * that might span multiple pages this method is preferred to {@link Requestable#request}
       * @param {string} path - the path to request
       * @param {Object} options - the query parameters to include
       * @param {Requestable.callback} [cb] - the function to receive the data. The returned data will always be an array.
       * @param {Object[]} results - the partial results. This argument is intended for interal use only.
       * @return {Promise} - a promise which will resolve when all pages have been fetched
       * @deprecated This will be folded into {@link Requestable#_request} in the 2.0 release.
       */

   }, {
      key: '_requestAllPages',
      value: function _requestAllPages(path, options, cb, results) {
         var _this2 = this;

         results = results || [];

         return this._request('GET', path, options).then(function (response) {
            var _results;

            var thisGroup = void 0;
            if (response.data instanceof Array) {
               thisGroup = response.data;
            } else if (response.data.items instanceof Array) {
               thisGroup = response.data.items;
            } else {
               var message = 'cannot figure out how to append ' + response.data + ' to the result set';
               throw new ResponseError(message, path, response);
            }
            (_results = results).push.apply(_results, _toConsumableArray(thisGroup));

            var nextUrl = getNextPage(response.headers.link);
            if (nextUrl && typeof options.page !== 'number') {
               log('getting next page: ' + nextUrl);
               return _this2._requestAllPages(nextUrl, options, cb, results);
            }

            if (cb) {
               cb(null, results, response);
            }

            response.data = results;
            return response;
         }).catch(callbackErrorOrThrow(cb, path));
      }
   }]);

   return Requestable;
}();

module.exports = Requestable;

// ////////////////////////// //
//  Private helper functions  //
// ////////////////////////// //
var METHODS_WITH_NO_BODY = ['GET', 'HEAD', 'DELETE'];
function methodHasNoBody(method) {
   return METHODS_WITH_NO_BODY.indexOf(method) !== -1;
}

function getNextPage() {
   var linksHeader = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

   var links = linksHeader.split(/\s*,\s*/); // splits and strips the urls
   return links.reduce(function (nextUrl, link) {
      if (link.search(/rel="next"/) !== -1) {
         return (link.match(/<(.*)>/) || [])[1];
      }

      return nextUrl;
   }, undefined);
}

function callbackErrorOrThrow(cb, path) {
   return function handler(object) {
      var error = void 0;
      if (object.hasOwnProperty('config')) {
         var _object$response = object.response,
             status = _object$response.status,
             statusText = _object$response.statusText,
             _object$config = object.config,
             method = _object$config.method,
             url = _object$config.url;

         var message = status + ' error making request ' + method + ' ' + url + ': "' + statusText + '"';
         error = new ResponseError(message, path, object);
         log(message + ' ' + JSON.stringify(object.data));
      } else {
         error = object;
      }
      if (cb) {
         log('going to error callback');
         cb(error);
      } else {
         log('throwing error');
         throw error;
      }
   };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlcXVlc3RhYmxlLmpzIl0sIm5hbWVzIjpbImxvZyIsIlJlc3BvbnNlRXJyb3IiLCJtZXNzYWdlIiwicGF0aCIsInJlc3BvbnNlIiwicmVxdWVzdCIsImNvbmZpZyIsInN0YXR1cyIsIkVycm9yIiwiUmVxdWVzdGFibGUiLCJhdXRoIiwiYXBpQmFzZSIsIkFjY2VwdEhlYWRlciIsIl9fYXBpQmFzZSIsIl9fYXV0aCIsInRva2VuIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIl9fQWNjZXB0SGVhZGVyIiwiX19hdXRob3JpemF0aW9uSGVhZGVyIiwiZW5jb2RlIiwidXJsIiwiaW5kZXhPZiIsIm5ld0NhY2hlQnVzdGVyIiwiRGF0ZSIsImdldFRpbWUiLCJyZXBsYWNlIiwicmF3IiwiaGVhZGVycyIsIkFjY2VwdCIsIkF1dGhvcml6YXRpb24iLCJyZXF1ZXN0T3B0aW9ucyIsInZpc2liaWxpdHkiLCJhZmZpbGlhdGlvbiIsInR5cGUiLCJzb3J0IiwicGVyX3BhZ2UiLCJkYXRlIiwidG9JU09TdHJpbmciLCJtZXRob2QiLCJkYXRhIiwiY2IiLCJfX2dldFVSTCIsIl9fZ2V0UmVxdWVzdEhlYWRlcnMiLCJxdWVyeVBhcmFtcyIsInNob3VsZFVzZURhdGFBc1BhcmFtcyIsIm1ldGhvZEhhc05vQm9keSIsInVuZGVmaW5lZCIsInBhcmFtcyIsInJlc3BvbnNlVHlwZSIsInJlcXVlc3RQcm9taXNlIiwiY2F0Y2giLCJjYWxsYmFja0Vycm9yT3JUaHJvdyIsInRoZW4iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiX3JlcXVlc3QiLCJzdWNjZXNzIiwiZmFpbHVyZSIsIm9wdGlvbnMiLCJyZXN1bHRzIiwidGhpc0dyb3VwIiwiQXJyYXkiLCJpdGVtcyIsInB1c2giLCJuZXh0VXJsIiwiZ2V0TmV4dFBhZ2UiLCJsaW5rIiwicGFnZSIsIl9yZXF1ZXN0QWxsUGFnZXMiLCJtb2R1bGUiLCJleHBvcnRzIiwiTUVUSE9EU19XSVRIX05PX0JPRFkiLCJsaW5rc0hlYWRlciIsImxpbmtzIiwic3BsaXQiLCJyZWR1Y2UiLCJzZWFyY2giLCJtYXRjaCIsImhhbmRsZXIiLCJvYmplY3QiLCJlcnJvciIsImhhc093blByb3BlcnR5Iiwic3RhdHVzVGV4dCIsIkpTT04iLCJzdHJpbmdpZnkiXSwibWFwcGluZ3MiOiI7Ozs7OztBQU9BOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUFUQTs7Ozs7OztBQVdBLElBQU1BLE1BQU0scUJBQU0sZ0JBQU4sQ0FBWjs7QUFFQTs7OztJQUdNQyxhOzs7QUFDSDs7Ozs7O0FBTUEsMEJBQVlDLE9BQVosRUFBcUJDLElBQXJCLEVBQTJCQyxRQUEzQixFQUFxQztBQUFBOztBQUFBLGdJQUM1QkYsT0FENEI7O0FBRWxDLFlBQUtDLElBQUwsR0FBWUEsSUFBWjtBQUNBLFlBQUtFLE9BQUwsR0FBZUQsU0FBU0UsTUFBeEI7QUFDQSxZQUFLRixRQUFMLEdBQWdCLENBQUNBLFlBQVksRUFBYixFQUFpQkEsUUFBakIsSUFBNkJBLFFBQTdDO0FBQ0EsWUFBS0csTUFBTCxHQUFjSCxTQUFTRyxNQUF2QjtBQUxrQztBQU1wQzs7O0VBYndCQyxLOztBQWdCNUI7Ozs7O0lBR01DLFc7QUFDSDs7Ozs7OztBQU9BOzs7Ozs7O0FBT0Esd0JBQVlDLElBQVosRUFBa0JDLE9BQWxCLEVBQTJCQyxZQUEzQixFQUF5QztBQUFBOztBQUN0QyxXQUFLQyxTQUFMLEdBQWlCRixXQUFXLHdCQUE1QjtBQUNBLFdBQUtHLE1BQUwsR0FBYztBQUNYQyxnQkFBT0wsS0FBS0ssS0FERDtBQUVYQyxtQkFBVU4sS0FBS00sUUFGSjtBQUdYQyxtQkFBVVAsS0FBS087QUFISixPQUFkO0FBS0EsV0FBS0MsY0FBTCxHQUFzQk4sZ0JBQWdCLElBQXRDOztBQUVBLFVBQUlGLEtBQUtLLEtBQVQsRUFBZ0I7QUFDYixjQUFLSSxxQkFBTCxHQUE2QixXQUFXVCxLQUFLSyxLQUE3QztBQUNGLE9BRkQsTUFFTyxJQUFJTCxLQUFLTSxRQUFMLElBQWlCTixLQUFLTyxRQUExQixFQUFvQztBQUN4Qyxj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LE1BQWpCLEVBQXlCO0FBQzdCLFVBQUlDLGNBQUo7QUFDQSxVQUFJRCxPQUFPRSxjQUFQLENBQXNCLFFBQXRCLENBQUosRUFBcUM7QUFBQSxnQ0FDOEJGLE1BRDlCLENBQzNCN0UsUUFEMkI7QUFBQSxhQUNoQkcsTUFEZ0Isb0JBQ2hCQSxNQURnQjtBQUFBLGFBQ1I2RSxVQURRLG9CQUNSQSxVQURRO0FBQUEsOEJBQzhCSCxNQUQ5QixDQUNLM0UsTUFETDtBQUFBLGFBQ2NpQyxNQURkLGtCQUNjQSxNQURkO0FBQUEsYUFDc0JsQixHQUR0QixrQkFDc0JBLEdBRHRCOztBQUVsQyxhQUFJbkIsVUFBY0ssTUFBZCw4QkFBNkNnQyxNQUE3QyxTQUF1RGxCLEdBQXZELFdBQWdFK0QsVUFBaEUsTUFBSjtBQUNBRixpQkFBUSxJQUFJakYsYUFBSixDQUFrQkMsT0FBbEIsRUFBMkJDLElBQTNCLEVBQWlDOEUsTUFBakMsQ0FBUjtBQUNBakYsYUFBT0UsT0FBUCxTQUFrQm1GLEtBQUtDLFNBQUwsQ0FBZUwsT0FBT3pDLElBQXRCLENBQWxCO0FBQ0YsT0FMRCxNQUtPO0FBQ0owQyxpQkFBUUQsTUFBUjtBQUNGO0FBQ0QsVUFBSXhDLEVBQUosRUFBUTtBQUNMekMsYUFBSSx5QkFBSjtBQUNBeUMsWUFBR3lDLEtBQUg7QUFDRixPQUhELE1BR087QUFDSmxGLGFBQUksZ0JBQUo7QUFDQSxlQUFNa0YsS0FBTjtBQUNGO0FBQ0gsSUFqQkQ7QUFrQkYiLCJmaWxlIjoiUmVxdWVzdGFibGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlXG4gKiBAY29weXJpZ2h0ICAyMDE2IFlhaG9vIEluYy5cbiAqIEBsaWNlbnNlICAgIExpY2Vuc2VkIHVuZGVyIHtAbGluayBodHRwczovL3NwZHgub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZS1DbGVhci5odG1sIEJTRC0zLUNsYXVzZS1DbGVhcn0uXG4gKiAgICAgICAgICAgICBHaXRodWIuanMgaXMgZnJlZWx5IGRpc3RyaWJ1dGFibGUuXG4gKi9cblxuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQge0Jhc2U2NH0gZnJvbSAnanMtYmFzZTY0JztcblxuY29uc3QgbG9nID0gZGVidWcoJ2dpdGh1YjpyZXF1ZXN0Jyk7XG5cbi8qKlxuICogVGhlIGVycm9yIHN0cnVjdHVyZSByZXR1cm5lZCB3aGVuIGEgbmV0d29yayBjYWxsIGZhaWxzXG4gKi9cbmNsYXNzIFJlc3BvbnNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAvKipcbiAgICAqIENvbnN0cnVjdCBhIG5ldyBSZXNwb25zZUVycm9yXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIGFuIG1lc3NhZ2UgdG8gcmV0dXJuIGluc3RlYWQgb2YgdGhlIHRoZSBkZWZhdWx0IGVycm9yIG1lc3NhZ2VcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gdGhlIHJlcXVlc3RlZCBwYXRoXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgLSB0aGUgb2JqZWN0IHJldHVybmVkIGJ5IEF4aW9zXG4gICAgKi9cbiAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIHBhdGgsIHJlc3BvbnNlKSB7XG4gICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgICB0aGlzLnJlcXVlc3QgPSByZXNwb25zZS5jb25maWc7XG4gICAgICB0aGlzLnJlc3BvbnNlID0gKHJlc3BvbnNlIHx8IHt9KS5yZXNwb25zZSB8fCByZXNwb25zZTtcbiAgICAgIHRoaXMuc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xuICAgfVxufVxuXG4vKipcbiAqIFJlcXVlc3RhYmxlIHdyYXBzIHRoZSBsb2dpYyBmb3IgbWFraW5nIGh0dHAgcmVxdWVzdHMgdG8gdGhlIEFQSVxuICovXG5jbGFzcyBSZXF1ZXN0YWJsZSB7XG4gICAvKipcbiAgICAqIEVpdGhlciBhIHVzZXJuYW1lIGFuZCBwYXNzd29yZCBvciBhbiBvYXV0aCB0b2tlbiBmb3IgR2l0aHViXG4gICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBSZXF1ZXN0YWJsZS5hdXRoXG4gICAgKiBAcHJvcCB7c3RyaW5nfSBbdXNlcm5hbWVdIC0gdGhlIEdpdGh1YiB1c2VybmFtZVxuICAgICogQHByb3Age3N0cmluZ30gW3Bhc3N3b3JkXSAtIHRoZSB1c2VyJ3MgcGFzc3dvcmRcbiAgICAqIEBwcm9wIHt0b2tlbn0gW3Rva2VuXSAtIGFuIE9BdXRoIHRva2VuXG4gICAgKi9cbiAgIC8qKlxuICAgICogSW5pdGlhbGl6ZSB0aGUgaHR0cCBpbnRlcm5hbHMuXG4gICAgKiBAcGFyYW0ge1JlcXVlc3RhYmxlLmF1dGh9IFthdXRoXSAtIHRoZSBjcmVkZW50aWFscyB0byBhdXRoZW50aWNhdGUgdG8gR2l0aHViLiBJZiBhdXRoIGlzXG4gICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3QgcHJvdmlkZWQgcmVxdWVzdCB3aWxsIGJlIG1hZGUgdW5hdXRoZW50aWNhdGVkXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gW2FwaUJhc2U9aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbV0gLSB0aGUgYmFzZSBHaXRodWIgQVBJIFVSTFxuICAgICogQHBhcmFtIHtzdHJpbmd9IFtBY2NlcHRIZWFkZXI9djNdIC0gdGhlIGFjY2VwdCBoZWFkZXIgZm9yIHRoZSByZXF1ZXN0c1xuICAgICovXG4gICBjb25zdHJ1Y3RvcihhdXRoLCBhcGlCYXNlLCBBY2NlcHRIZWFkZXIpIHtcbiAgICAgIHRoaXMuX19hcGlCYXNlID0gYXBpQmFzZSB8fCAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbSc7XG4gICAgICB0aGlzLl9fYXV0aCA9IHtcbiAgICAgICAgIHRva2VuOiBhdXRoLnRva2VuLFxuICAgICAgICAgdXNlcm5hbWU6IGF1dGgudXNlcm5hbWUsXG4gICAgICAgICBwYXNzd29yZDogYXV0aC5wYXNzd29yZCxcbiAgICAgIH07XG4gICAgICB0aGlzLl9fQWNjZXB0SGVhZGVyID0gQWNjZXB0SGVhZGVyIHx8ICd2Myc7XG5cbiAgICAgIGlmIChhdXRoLnRva2VuKSB7XG4gICAgICAgICB0aGlzLl9fYXV0aG9yaXphdGlvbkhlYWRlciA9ICd0b2tlbiAnICsgYXV0aC50b2tlbjtcbiAgICAgIH0gZWxzZSBpZiAoYXV0aC51c2VybmFtZSAmJiBhdXRoLnBhc3N3b3JkKSB7XG4gICAgICAgICB0aGlzLl9fYXV0aG9yaXphdGlvbkhlYWRlciA9ICdCYXNpYyAnICsgQmFzZTY0LmVuY29kZShhdXRoLnVzZXJuYW1lICsgJzonICsgYXV0aC5wYXNzd29yZCk7XG4gICAgICB9XG4gICB9XG5cbiAgIC8qKlxuICAgICogQ29tcHV0ZSB0aGUgVVJMIHRvIHVzZSB0byBtYWtlIGEgcmVxdWVzdC5cbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIGVpdGhlciBhIFVSTCByZWxhdGl2ZSB0byB0aGUgQVBJIGJhc2Ugb3IgYW4gYWJzb2x1dGUgVVJMXG4gICAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gdGhlIFVSTCB0byB1c2VcbiAgICAqL1xuICAgX19nZXRVUkwocGF0aCkge1xuICAgICAgbGV0IHVybCA9IHBhdGg7XG5cbiAgICAgIGlmIChwYXRoLmluZGV4T2YoJy8vJykgPT09IC0xKSB7XG4gICAgICAgICB1cmwgPSB0aGlzLl9fYXBpQmFzZSArIHBhdGg7XG4gICAgICB9XG5cbiAgICAgIGxldCBuZXdDYWNoZUJ1c3RlciA9ICd0aW1lc3RhbXA9JyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgcmV0dXJuIHVybC5yZXBsYWNlKC8odGltZXN0YW1wPVxcZCspLywgbmV3Q2FjaGVCdXN0ZXIpO1xuICAgfVxuXG4gICAvKipcbiAgICAqIENvbXB1dGUgdGhlIGhlYWRlcnMgcmVxdWlyZWQgZm9yIGFuIEFQSSByZXF1ZXN0LlxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmF3IC0gaWYgdGhlIHJlcXVlc3Qgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgSlNPTiBvciBhcyBhIHJhdyByZXF1ZXN0XG4gICAgKiBAcGFyYW0ge3N0cmluZ30gQWNjZXB0SGVhZGVyIC0gdGhlIGFjY2VwdCBoZWFkZXIgZm9yIHRoZSByZXF1ZXN0XG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IC0gdGhlIGhlYWRlcnMgdG8gdXNlIGluIHRoZSByZXF1ZXN0XG4gICAgKi9cbiAgIF9fZ2V0UmVxdWVzdEhlYWRlcnMocmF3LCBBY2NlcHRIZWFkZXIpIHtcbiAgICAgIGxldCBoZWFkZXJzID0ge1xuICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnLFxuICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi92bmQuZ2l0aHViLicgKyAoQWNjZXB0SGVhZGVyIHx8IHRoaXMuX19BY2NlcHRIZWFkZXIpLFxuICAgICAgfTtcblxuICAgICAgaWYgKHJhdykge1xuICAgICAgICAgaGVhZGVycy5BY2NlcHQgKz0gJy5yYXcnO1xuICAgICAgfVxuICAgICAgaGVhZGVycy5BY2NlcHQgKz0gJytqc29uJztcblxuICAgICAgaWYgKHRoaXMuX19hdXRob3JpemF0aW9uSGVhZGVyKSB7XG4gICAgICAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSB0aGlzLl9fYXV0aG9yaXphdGlvbkhlYWRlcjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGhlYWRlcnM7XG4gICB9XG5cbiAgIC8qKlxuICAgICogU2V0cyB0aGUgZGVmYXVsdCBvcHRpb25zIGZvciBBUEkgcmVxdWVzdHNcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBbcmVxdWVzdE9wdGlvbnM9e31dIC0gdGhlIGN1cnJlbnQgb3B0aW9ucyBmb3IgdGhlIHJlcXVlc3RcbiAgICAqIEByZXR1cm4ge09iamVjdH0gLSB0aGUgb3B0aW9ucyB0byBwYXNzIHRvIHRoZSByZXF1ZXN0XG4gICAgKi9cbiAgIF9nZXRPcHRpb25zV2l0aERlZmF1bHRzKHJlcXVlc3RPcHRpb25zID0ge30pIHtcbiAgICAgIGlmICghKHJlcXVlc3RPcHRpb25zLnZpc2liaWxpdHkgfHwgcmVxdWVzdE9wdGlvbnMuYWZmaWxpYXRpb24pKSB7XG4gICAgICAgICByZXF1ZXN0T3B0aW9ucy50eXBlID0gcmVxdWVzdE9wdGlvbnMudHlwZSB8fCAnYWxsJztcbiAgICAgIH1cbiAgICAgIHJlcXVlc3RPcHRpb25zLnNvcnQgPSByZXF1ZXN0T3B0aW9ucy5zb3J0IHx8ICd1cGRhdGVkJztcbiAgICAgIHJlcXVlc3RPcHRpb25zLnBlcl9wYWdlID0gcmVxdWVzdE9wdGlvbnMucGVyX3BhZ2UgfHwgJzEwMCc7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuICAgICAgcmV0dXJuIHJlcXVlc3RPcHRpb25zO1xuICAgfVxuXG4gICAvKipcbiAgICAqIGlmIGEgYERhdGVgIGlzIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uIGl0IHdpbGwgYmUgY29udmVydGVkIHRvIGFuIElTTyBzdHJpbmdcbiAgICAqIEBwYXJhbSB7Kn0gZGF0ZSAtIHRoZSBvYmplY3QgdG8gYXR0ZW1wdCB0byBjb29lcmNlIGludG8gYW4gSVNPIGRhdGUgc3RyaW5nXG4gICAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gdGhlIElTTyByZXByZXNlbnRhdGlvbiBvZiBgZGF0ZWAgb3Igd2hhdGV2ZXIgd2FzIHBhc3NlZCBpbiBpZiBpdCB3YXMgbm90IGEgZGF0ZVxuICAgICovXG4gICBfZGF0ZVRvSVNPKGRhdGUpIHtcbiAgICAgIGlmIChkYXRlICYmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgIGRhdGUgPSBkYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkYXRlO1xuICAgfVxuXG4gICAvKipcbiAgICAqIEEgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgcmVzdWx0IG9mIHRoZSBBUEkgcmVxdWVzdC5cbiAgICAqIEBjYWxsYmFjayBSZXF1ZXN0YWJsZS5jYWxsYmFja1xuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5FcnJvcn0gZXJyb3IgLSB0aGUgZXJyb3IgcmV0dXJuZWQgYnkgdGhlIEFQSSBvciBgbnVsbGBcbiAgICAqIEBwYXJhbSB7KE9iamVjdHx0cnVlKX0gcmVzdWx0IC0gdGhlIGRhdGEgcmV0dXJuZWQgYnkgdGhlIEFQSSBvciBgdHJ1ZWAgaWYgdGhlIEFQSSByZXR1cm5zIGAyMDQgTm8gQ29udGVudGBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0IC0gdGhlIHJhdyB7QGxpbmtjb2RlIGh0dHBzOi8vZ2l0aHViLmNvbS9temFicmlza2llL2F4aW9zI3Jlc3BvbnNlLXNjaGVtYSBSZXNwb25zZX1cbiAgICAqL1xuICAgLyoqXG4gICAgKiBNYWtlIGEgcmVxdWVzdC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSB0aGUgbWV0aG9kIGZvciB0aGUgcmVxdWVzdCAoR0VULCBQVVQsIFBPU1QsIERFTEVURSlcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gdGhlIHBhdGggZm9yIHRoZSByZXF1ZXN0XG4gICAgKiBAcGFyYW0geyp9IFtkYXRhXSAtIHRoZSBkYXRhIHRvIHNlbmQgdG8gdGhlIHNlcnZlci4gRm9yIEhUVFAgbWV0aG9kcyB0aGF0IGRvbid0IGhhdmUgYSBib2R5IHRoZSBkYXRhXG4gICAgKiAgICAgICAgICAgICAgICAgICB3aWxsIGJlIHNlbnQgYXMgcXVlcnkgcGFyYW1ldGVyc1xuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5jYWxsYmFja30gW2NiXSAtIHRoZSBjYWxsYmFjayBmb3IgdGhlIHJlcXVlc3RcbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jhdz1mYWxzZV0gLSBpZiB0aGUgcmVxdWVzdCBzaG91bGQgYmUgc2VudCBhcyByYXcuIElmIHRoaXMgaXMgYSBmYWxzeSB2YWx1ZSB0aGVuIHRoZVxuICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0IHdpbGwgYmUgbWFkZSBhcyBKU09OXG4gICAgKiBAcmV0dXJuIHtQcm9taXNlfSAtIHRoZSBQcm9taXNlIGZvciB0aGUgaHR0cCByZXF1ZXN0XG4gICAgKi9cbiAgIF9yZXF1ZXN0KG1ldGhvZCwgcGF0aCwgZGF0YSwgY2IsIHJhdykge1xuICAgICAgY29uc3QgdXJsID0gdGhpcy5fX2dldFVSTChwYXRoKTtcblxuICAgICAgY29uc3QgQWNjZXB0SGVhZGVyID0gKGRhdGEgfHwge30pLkFjY2VwdEhlYWRlcjtcbiAgICAgIGlmIChBY2NlcHRIZWFkZXIpIHtcbiAgICAgICAgIGRlbGV0ZSBkYXRhLkFjY2VwdEhlYWRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGhlYWRlcnMgPSB0aGlzLl9fZ2V0UmVxdWVzdEhlYWRlcnMocmF3LCBBY2NlcHRIZWFkZXIpO1xuXG4gICAgICBsZXQgcXVlcnlQYXJhbXMgPSB7fTtcblxuICAgICAgY29uc3Qgc2hvdWxkVXNlRGF0YUFzUGFyYW1zID0gZGF0YSAmJiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSAmJiBtZXRob2RIYXNOb0JvZHkobWV0aG9kKTtcbiAgICAgIGlmIChzaG91bGRVc2VEYXRhQXNQYXJhbXMpIHtcbiAgICAgICAgIHF1ZXJ5UGFyYW1zID0gZGF0YTtcbiAgICAgICAgIGRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcyxcbiAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICByZXNwb25zZVR5cGU6IHJhdyA/ICd0ZXh0JyA6ICdqc29uJyxcbiAgICAgIH07XG5cbiAgICAgIGxvZyhgJHtjb25maWcubWV0aG9kfSB0byAke2NvbmZpZy51cmx9YCk7XG4gICAgICBjb25zdCByZXF1ZXN0UHJvbWlzZSA9IGF4aW9zKGNvbmZpZykuY2F0Y2goY2FsbGJhY2tFcnJvck9yVGhyb3coY2IsIHBhdGgpKTtcblxuICAgICAgaWYgKGNiKSB7XG4gICAgICAgICByZXF1ZXN0UHJvbWlzZS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgLy8gV2hlbiBkYXRhIGhhcyByZXN1bHRzXG4gICAgICAgICAgICAgICBjYihudWxsLCByZXNwb25zZS5kYXRhLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZy5tZXRob2QgIT09ICdHRVQnICYmIE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGEpLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgIC8vIFRydWUgd2hlbiBzdWNjZXNzZnVsIHN1Ym1pdCBhIHJlcXVlc3QgYW5kIHJlY2VpdmUgYSBlbXB0eSBvYmplY3RcbiAgICAgICAgICAgICAgIGNiKG51bGwsIChyZXNwb25zZS5zdGF0dXMgPCAzMDApLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY2IobnVsbCwgcmVzcG9uc2UuZGF0YSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXF1ZXN0UHJvbWlzZTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBNYWtlIGEgcmVxdWVzdCB0byBhbiBlbmRwb2ludCB0aGUgcmV0dXJucyAyMDQgd2hlbiB0cnVlIGFuZCA0MDQgd2hlbiBmYWxzZVxuICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSB0aGUgcGF0aCB0byByZXF1ZXN0XG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGFueSBxdWVyeSBwYXJhbWV0ZXJzIGZvciB0aGUgcmVxdWVzdFxuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5jYWxsYmFja30gY2IgLSB0aGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlY2VpdmUgYHRydWVgIG9yIGBmYWxzZWBcbiAgICAqIEBwYXJhbSB7bWV0aG9kfSBbbWV0aG9kPUdFVF0gLSBIVFRQIE1ldGhvZCB0byB1c2VcbiAgICAqIEByZXR1cm4ge1Byb21pc2V9IC0gdGhlIHByb21pc2UgZm9yIHRoZSBodHRwIHJlcXVlc3RcbiAgICAqL1xuICAgX3JlcXVlc3QyMDRvcjQwNChwYXRoLCBkYXRhLCBjYiwgbWV0aG9kID0gJ0dFVCcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0KG1ldGhvZCwgcGF0aCwgZGF0YSlcbiAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgY2IobnVsbCwgdHJ1ZSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICB9LCBmdW5jdGlvbiBmYWlsdXJlKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UucmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgICAgY2IobnVsbCwgZmFsc2UsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICBjYihyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyByZXNwb25zZTtcbiAgICAgICAgIH0pO1xuICAgfVxuXG4gICAvKipcbiAgICAqIE1ha2UgYSByZXF1ZXN0IGFuZCBmZXRjaCBhbGwgdGhlIGF2YWlsYWJsZSBkYXRhLiBHaXRodWIgd2lsbCBwYWdpbmF0ZSByZXNwb25zZXMgc28gZm9yIHF1ZXJpZXNcbiAgICAqIHRoYXQgbWlnaHQgc3BhbiBtdWx0aXBsZSBwYWdlcyB0aGlzIG1ldGhvZCBpcyBwcmVmZXJyZWQgdG8ge0BsaW5rIFJlcXVlc3RhYmxlI3JlcXVlc3R9XG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSBwYXRoIHRvIHJlcXVlc3RcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gdGhlIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gaW5jbHVkZVxuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5jYWxsYmFja30gW2NiXSAtIHRoZSBmdW5jdGlvbiB0byByZWNlaXZlIHRoZSBkYXRhLiBUaGUgcmV0dXJuZWQgZGF0YSB3aWxsIGFsd2F5cyBiZSBhbiBhcnJheS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0W119IHJlc3VsdHMgLSB0aGUgcGFydGlhbCByZXN1bHRzLiBUaGlzIGFyZ3VtZW50IGlzIGludGVuZGVkIGZvciBpbnRlcmFsIHVzZSBvbmx5LlxuICAgICogQHJldHVybiB7UHJvbWlzZX0gLSBhIHByb21pc2Ugd2hpY2ggd2lsbCByZXNvbHZlIHdoZW4gYWxsIHBhZ2VzIGhhdmUgYmVlbiBmZXRjaGVkXG4gICAgKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgZm9sZGVkIGludG8ge0BsaW5rIFJlcXVlc3RhYmxlI19yZXF1ZXN0fSBpbiB0aGUgMi4wIHJlbGVhc2UuXG4gICAgKi9cbiAgIF9yZXF1ZXN0QWxsUGFnZXMocGF0aCwgb3B0aW9ucywgY2IsIHJlc3VsdHMpIHtcbiAgICAgIHJlc3VsdHMgPSByZXN1bHRzIHx8IFtdO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcmVxdWVzdCgnR0VUJywgcGF0aCwgb3B0aW9ucylcbiAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgbGV0IHRoaXNHcm91cDtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgIHRoaXNHcm91cCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuaXRlbXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgdGhpc0dyb3VwID0gcmVzcG9uc2UuZGF0YS5pdGVtcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGBjYW5ub3QgZmlndXJlIG91dCBob3cgdG8gYXBwZW5kICR7cmVzcG9uc2UuZGF0YX0gdG8gdGhlIHJlc3VsdCBzZXRgO1xuICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJlc3BvbnNlRXJyb3IobWVzc2FnZSwgcGF0aCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKC4uLnRoaXNHcm91cCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5leHRVcmwgPSBnZXROZXh0UGFnZShyZXNwb25zZS5oZWFkZXJzLmxpbmspO1xuICAgICAgICAgICAgaWYgKG5leHRVcmwgJiYgdHlwZW9mIG9wdGlvbnMucGFnZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgIGxvZyhgZ2V0dGluZyBuZXh0IHBhZ2U6ICR7bmV4dFVybH1gKTtcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0QWxsUGFnZXMobmV4dFVybCwgb3B0aW9ucywgY2IsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgIGNiKG51bGwsIHJlc3VsdHMsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3VsdHM7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICB9KS5jYXRjaChjYWxsYmFja0Vycm9yT3JUaHJvdyhjYiwgcGF0aCkpO1xuICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3RhYmxlO1xuXG4vLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyAvL1xuLy8gIFByaXZhdGUgaGVscGVyIGZ1bmN0aW9ucyAgLy9cbi8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIC8vXG5jb25zdCBNRVRIT0RTX1dJVEhfTk9fQk9EWSA9IFsnR0VUJywgJ0hFQUQnLCAnREVMRVRFJ107XG5mdW5jdGlvbiBtZXRob2RIYXNOb0JvZHkobWV0aG9kKSB7XG4gICByZXR1cm4gTUVUSE9EU19XSVRIX05PX0JPRFkuaW5kZXhPZihtZXRob2QpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TmV4dFBhZ2UobGlua3NIZWFkZXIgPSAnJykge1xuICAgY29uc3QgbGlua3MgPSBsaW5rc0hlYWRlci5zcGxpdCgvXFxzKixcXHMqLyk7IC8vIHNwbGl0cyBhbmQgc3RyaXBzIHRoZSB1cmxzXG4gICByZXR1cm4gbGlua3MucmVkdWNlKGZ1bmN0aW9uKG5leHRVcmwsIGxpbmspIHtcbiAgICAgIGlmIChsaW5rLnNlYXJjaCgvcmVsPVwibmV4dFwiLykgIT09IC0xKSB7XG4gICAgICAgICByZXR1cm4gKGxpbmsubWF0Y2goLzwoLiopPi8pIHx8IFtdKVsxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHRVcmw7XG4gICB9LCB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBjYWxsYmFja0Vycm9yT3JUaHJvdyhjYiwgcGF0aCkge1xuICAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZXIob2JqZWN0KSB7XG4gICAgICBsZXQgZXJyb3I7XG4gICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KCdjb25maWcnKSkge1xuICAgICAgICAgY29uc3Qge3Jlc3BvbnNlOiB7c3RhdHVzLCBzdGF0dXNUZXh0fSwgY29uZmlnOiB7bWV0aG9kLCB1cmx9fSA9IG9iamVjdDtcbiAgICAgICAgIGxldCBtZXNzYWdlID0gKGAke3N0YXR1c30gZXJyb3IgbWFraW5nIHJlcXVlc3QgJHttZXRob2R9ICR7dXJsfTogXCIke3N0YXR1c1RleHR9XCJgKTtcbiAgICAgICAgIGVycm9yID0gbmV3IFJlc3BvbnNlRXJyb3IobWVzc2FnZSwgcGF0aCwgb2JqZWN0KTtcbiAgICAgICAgIGxvZyhgJHttZXNzYWdlfSAke0pTT04uc3RyaW5naWZ5KG9iamVjdC5kYXRhKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICBlcnJvciA9IG9iamVjdDtcbiAgICAgIH1cbiAgICAgIGlmIChjYikge1xuICAgICAgICAgbG9nKCdnb2luZyB0byBlcnJvciBjYWxsYmFjaycpO1xuICAgICAgICAgY2IoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGxvZygndGhyb3dpbmcgZXJyb3InKTtcbiAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgfTtcbn1cbiJdfQ==
//# sourceMappingURL=Requestable.js.map
