var _ = require('lodash');
var request = require('request');
var Q = require('q');

var wolfram = (function() {

    return {
        getAnswer: function (query) {
            var deferred = Q.defer();
            var url = 'https://www.wolframalpha.com/input/';
            var qs = {
                'i': query
            };
            request.get(url, {qs: qs}, function (err, response, body) {
                var response = (function() {
                    var rx = /0200.push\( {"stringified": "(.+?)".+\)/;
                    var arr = rx.exec(body);
                    return _.get(arr, '[1]');
                })();
                console.log("response", response);
                if(response) {
                    deferred.resolve(response);
                } else {
                    deferred.reject();
                }
            });

            return deferred.promise;

        }
    };
})();

module.exports = wolfram;