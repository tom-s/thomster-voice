var exec = require('child_process').exec;
var Q = require('q');

var utils = (function() {
    var lastText = '';
    return {
        speak: function(text, cb) {
            var deferred = Q.defer();
            var cmd = 'pico2wave -w output.wav " ' + text + '" && aplay output.wav';
            exec(cmd, function(error, stdout, stderr) {
                // command output is in stdout
                if(error) {
                    console.log('error while executing command ', cmd);
                }
                lastText = text;
                deferred.resolve();
            });
            return deferred.promise;
        },
        repeat: function() {
            this.speak(lastText);
        },
        shutUp: function() {
            var deferred = Q.defer();
            var cmd = 'killall aplay';
            exec(cmd, function(error, stdout, stderr) {
                // command output is in stdout
                if(error) {
                    console.log('error while executing command ', cmd);
                }
                deferred.resolve();
            });
            return deferred.promise;
        }
    };
})();

module.exports = utils;