var _ = require('lodash');
var request = require('request');
var Q = require('q');

var ACCESS_TOKEN = '56c99f2e98d8dbb8ed319b3485260fec';

var weather = (function() {

    function _convertKelvinToCelcius(temp) {
        return temp - 273,15;
    }

    return {
        get: function (location) {
            location = (location) ? location : 'Lyon';
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
                        var desc = _.get(json, '.weather[0].description');
                        var temperature = _convertKelvinToCelcius(_.get(json, '.main.temp'));
                        var temperatureMax = _convertKelvinToCelcius(_.get(json, '.main.temp_max'));
                        var text = 'In ' + location + ', ' + desc + '. Temperature is currently ' + temperature + ' degrees. ';
                        text+= 'Maximum temperature of the day is ' + temperatureMax + ' degrees.';
                        deferred.resolve(text);
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