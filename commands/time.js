var _ = require('lodash');
var request = require('request');
var Q = require('q');
var moment = require('moment-timezone');

var ACCESS_TOKEN = '56c99f2e98d8dbb8ed319b3485260fec';

var time = (function() {

    return {
        getTime: function(location) {
            var deferred = Q.defer();

            if(!location || location.toLowerCase() === 'lyon' || location.toLowerCase() === 'france') {
                deferred.resolve(moment().tz("Europe/Paris").format("h:mm:ss a"));
            }

            return deferred.promise;

        },
        getDay: function(location) {
            var deferred = Q.defer();

            if(!location || location.toLowerCase() === 'lyon' || location.toLowerCase() === 'france') {
                deferred.resolve(moment().tz("Europe/Paris").format("dddd, MMMM Do YYYY"));
            }

            return deferred.promise;
        }
    };
})();

module.exports = time;