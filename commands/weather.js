var _ = require('lodash');
var request = require('request');
var Q = require('q');

var ACCESS_TOKEN = '56c99f2e98d8dbb8ed319b3485260fec';

var weather = (function() {

    return {
        get: function (location) {
            var deferred = Q.defer();
            var url = 'http://api.openweathermap.org/data/2.5/weather';
            var qs = {
                'q': location
            };
            request.get(url, {qs: qs}, function (err, response, body) {
                    if(err) {
                        deferred.reject();
                    } else {
                        var json = JSON.parse(body);
                        console.log("json", json);
                        // récupérer, main, temperature , temperature min & max
                        deferred.resolve(json);
                    }
            });

            return deferred.promise;
        },
        getForecast: function (location) {
            var url = 'api.openweathermap.org/data/2.5/forecast';
            var options = {
                'q': location
            };
            request.get(url, options).on('response', function (response) {
                console.log("response", response);
                deferred.resolve(response);
            }).on('error', function (error) {
                deferred.reject();
            });

            return deferred.promise;
        }
    };
})();

module.exports = weather;