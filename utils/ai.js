var _ = require('lodash');
var Q = require('q');
var apiai = require('apiai');
var fs = require('fs');




var Ai = (function() {
    var app = apiai("68f14a183c434a40bbb761e5f9a7f032 ", "9fcdf7db-4157-459c-b9a9-3172bf2474b4 ");

    return {
        ask: function(soundFile) {
            var deferred = Q.defer();
            console.log("tryin API ai");
            var request = app.voiceRequest();
            request.on('response', function(response) {
                deferred.resolve(response);
            });
            request.on('error', function(error) {
                deferred.reject();
            });
            fs.readFile(soundFile, function(error, buffer) {
                if (error) {
                    deferred.reject();
                } else {
                    request.write(buffer);
                }

                request.end();
            });
            return deferred.promise;
        }
    }
})();


module.exports = Ai;