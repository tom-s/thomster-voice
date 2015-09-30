var _ = require('lodash');
var exec = require('child_process').exec;
var utils = require('./utils.js');
var cmdProcessor = require('./cmdProcessor.js');
var intentFinder = require('./intentFinder.js');
var Q = require('q');

var SOUND_FILE = "input.wav";
var SOUND_FILE_CLEAN  = "input-clean.wav";

var waitingForCommand = false;

function _analyze() {
    intentFinder.get(SOUND_FILE_CLEAN).then(
        function success(res) {
            var intentParams = _.map(res.params, function(param, key) {
                return {
                    key: key,
                    values: _.map(param, function(details) {
                        return details.value
                    })
                };
            });
            cmdProcessor.execute(res.intent, res.confidence, intentParams);
            _sleep();
        },
        function error() {
            utils.speak("Sorry, can you repeat ?");
            _listen();
        }
    );
}

function _wakeUp() {
    var deferred = Q.defer();
    // Check that file is the right duration (to filter out noises)
    var cmd = "sox " + SOUND_FILE_CLEAN + " -n stat 2>&1 | sed -n 's#^Length (seconds):[^0-9]*\\([0-9.]*\\)$#\\1#p'";
    exec(cmd, function(error, duration, stderr) {
        duration = parseFloat(duration);
        console.log("duration", duration);
        if(duration > 0.5 && duration < 1.5) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    });
    return deferred.promise;
}

/* Wait for a wakeup command */
function _sleep() {
    var cmd = 'sox -t alsa default ' + SOUND_FILE + ' silence 1 0.1 5% 1 1 1%';
    var child = exec(cmd);
    child.on('close', function(code) {
        _cleanFile().then(function() {
            _wakeUp().then(function(wakeUp) {
                console.log("wake up ? ", wakeUp);
                if(wakeUp) {
                    utils.speak("Yes ?").then(function success() {
                        _listen();
                    })
                } else {
                    _sleep(); // carry on sleeping
                }
            });
        });

    });
}

/* Listen for a command */
function _listen() {
    console.log("listen for command");
    var cmd = 'sox -t alsa default ' + SOUND_FILE + ' silence 1 0.1 5% 1 1.0 5%';
    var child = exec(cmd);
    child.on('close', function(code) {
        _cleanFile().then(function() {
            _analyze();
        });
    });
}

function  _cleanFile() {
    var deferred = Q.defer();
    // Clean noise
    var cmd = 'sox ' + SOUND_FILE + ' ' + SOUND_FILE_CLEAN + ' noisered noise.prof 0.21';
    console.log("clean", cmd);
    exec(cmd, function(error, duration, stderr) {
        deferred.resolve();
    });
    return deferred.promise;
}

/* Init */
_sleep();



