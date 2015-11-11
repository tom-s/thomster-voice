var _ = require('lodash');
var wit = require('./wit.js');
var fs = require('fs');
var Q = require('q');

var intentFinder = (function() {
    var ACCESS_TOKEN = "U3XYEWNL7M27YB76EJWHIXNVOAT5KZN4";

    return {
        get: function(soundFile) {
            console.log("try to get intent");
            var deferred = Q.defer();
            var stream = fs.createReadStream(soundFile);
            wit.captureSpeechIntent(ACCESS_TOKEN, stream, "audio/wav", function (err, res) {
                console.log('res', res);
                if (err) speaker.speak("An error occured");
                var res = _.get(res, '.outcomes[0]');
                if(res) {
                    deferred.resolve({
                        intent: res.intent,
                        confidence: res.confidence,
                        params: res.entities
                    })
                } else {
                    deferred.reject();
                }
            });
            return deferred.promise;
        }
    }
})();


module.exports = intentFinder;