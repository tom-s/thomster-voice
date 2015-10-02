var _ = require('lodash');
var request = require('request');
var Q = require('q');
var moment = require('moment-timezone');

var GOOGLE_API_URL = 'http://maps.googleapis.com/maps/api/geocode/json';
var GOOGLE_TIMEZONE_API_URL = 'https://maps.googleapis.com/maps/api/timezone/json';

var time = (function() {

    function _getTimeZone(coordinates) {
        var deferred = Q.defer();
        var apiUrl = GOOGLE_TIMEZONE_API_URL;
        var qs =  {
            'location': coordinates.lat + ',' + coordinates.lng,
            'timestamp': moment().unix()
        };
        request.get(apiUrl, {qs: qs}, function (err, response, body) {
            if(err) {
                deferred.reject();
            } else {
                var json = JSON.parse(body);
                var timezone = _.get(json, '.timeZoneId');
                if(timezone) {
                    deferred.resolve(timezone);
                } else {
                    deferred.reject();
                }
            }
        });
        return deferred.promise;
    }

    function _getCoordinates(location) {
        var deferred = Q.defer();
        var apiUrl = GOOGLE_API_URL;
        var qs =  {
            'language': 'en',
            'address' : location
        };
        request.get(apiUrl, {qs: qs}, function (err, response, body) {
            if(err) {
                deferred.reject();
            } else {
                var json = JSON.parse(body);
                var location = _.get(json, '.results[0].geometry.location');
                if(location) {
                    deferred.resolve(location);
                } else {
                    deferred.reject();
                }
            }

        });
        return deferred.promise;
    }

    return {
        getTime: function(location) {
            var deferred = Q.defer();

            if(!location || location.toLowerCase() === 'lyon' || location.toLowerCase() === 'france') {
                deferred.resolve(moment().tz("Europe/Paris").format("h:mm:ss a"));
            } else {
                _getCoordinates(location).then(function success(coordinates) {
                    _getTimeZone(coordinates).then(function success(timezone) {
                        deferred.resolve(moment().tz(timezone).format("h:mm:ss a"));
                    }, function error() {
                        deferred.reject();
                    });
                }, function error() {
                    deferred.reject();
                });
            }

            return deferred.promise;

        },
        getDay: function(location) {
            var deferred = Q.defer();

            if(!location || location.toLowerCase() === 'lyon' || location.toLowerCase() === 'france') {
                deferred.resolve(moment().tz("Europe/Paris").format("dddd, MMMM Do YYYY"));
            } else {
                _getCoordinates(location).then(function success(coordinates) {
                    _getTimeZone(coordinates).then(function success(timezone) {
                        deferred.resolve(moment().tz(timezone).format("dddd, MMMM Do YYYY"));
                    }, function error() {
                        deferred.reject();
                    });
                }, function error() {
                    deferred.reject();
                });
            }

            return deferred.promise;
        }
    };
})();

module.exports = time;