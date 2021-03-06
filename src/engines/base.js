import request from 'request';
import _ from 'lodash';

export default class Base {
  constructor(options) {
    if (options) {
      if (options.verbose) {
        request.debug = true;
      }
      if (options.timeout) {
        this.timeout = options.timeout;
      }
    }
  }
  getRequestSettings() {
    return {};
  }

  preprocessBody(body) {
    return body;
  }

  validate() {
    return true;
  }

  parseLocation() {
    return {};
  }

  parseError(body) {
    return body;
  }

  locate(cell, callback) {
    //  Send request
    const options = this.getRequestSettings(cell);
    options.timeout = this.timeout;

    request(options, (error, response, body) => {
      if (error) {
        if (error.code === 'ETIMEDOUT') {
          if (error.connect === true) {
            callback('Request connection timeout.', null);
          } else {
            callback('Request timeout.', null);
          }
        } else {
          //  Callback with error
          if (_.isFunction(callback)) {
            callback(`Request Error: ${JSON.stringify(error)}`, null);
          }
        }
      } else {
        const b = this.preprocessBody(body);
        if (response.statusCode === 200) {
          if (!this.validate(b)) {
            //  Callback with error message
            if (_.isFunction(callback)) {
              callback(`Response Error: ${JSON.stringify(this.parseError(b))}`, null);
            }
          } else {
            //  Callback with location info
            if (_.isFunction(callback)) {
              callback(null, this.parseLocation(b));
            }
          }
        } else {
          //  Callback with HTTP Status Error Code
          if (_.isFunction(callback)) {
            const status = `${response.statusCode}: ${response.statusMessage}`;
            callback(`Response Error: ${status} (${JSON.stringify(this.parseError(b))})`, null);
          }
        }
      }
    });
  }
}
