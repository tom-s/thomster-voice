var _ = require('lodash');
var exec = require('child_process').exec;
var utils = require('./utils.js');
var cmdProcessor = require('./cmdProcessor.js');
var intentFinder = require('./intentFinder.js');
var Q = require('q');
var ip = require('ip');

var DETECTION_PERCENTAGE_START = '5%';
var DETECTION_PERCENTAGE_END = '5%';
var AUDIO_SOURCE = 'default';
var NOISE_PROFILE = 'noise.prof';
var SOUND_FILE = "input.wav";
var SOUND_FILE_CLEAN  = "input-clean.wav";
var LISTEN_MAX_TRIALS = 2;

var step = 0; // wake up step
var sleepTiming;

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
            cmdProcessor.execute(res.intent, res.confidence, intentParams).then(function success() {
                _sleep(true);
            }, function error() {
                _sleep(true);
            });
        },
        function error() {
            utils.speak("Sorry I didn't get that, repeat please").then(function() {
                _listen();
            })
        }
    );
}

function _checkFile() {
    var deferred = Q.defer();
    // Check that file is the right duration (to filter out noises)
    var cmd = "sox " + SOUND_FILE_CLEAN + " -n stat 2>&1 | sed -n 's#^Length (seconds):[^0-9]*\\([0-9.]*\\)$#\\1#p'";
    console.log("file length", cmd);
    exec(cmd, function(error, duration, stderr) {
        // Is this a clap of hand ?
        duration = parseFloat(duration);
        console.log("duration", duration, step);
        if(duration < 1){
            var res = (step >= 1) ? true : false;
            step = (res) ?  0 : step + 1;
            deferred.resolve(res);
        } else {
            deferred.resolve(false);
        }

    });
    return deferred.promise;
}

/* Wait for a clap of hand to wake up */
function _sleep(resetStep) {
    console.log("------ SLEEP --------");
    // Step step
    if(resetStep) {
        step  = 0;
    }

    // Listen for clap
    var cmd = 'sox -t alsa ' + AUDIO_SOURCE + ' ' + SOUND_FILE + ' silence 1 0.1 '  + DETECTION_PERCENTAGE_START + ' 1 0.1 ' + DETECTION_PERCENTAGE_END;
    console.log("sleep", cmd);
    var child = exec(cmd);
    child.on('close', function(code) {

        // Check if step should be reset
        var timeData = (sleepTiming) ? process.hrtime(sleepTiming) : null;
        var elapsedTime = parseFloat(_.get(timeData, '[0]')); // seconds only
        console.log("elapsed time", timeData, elapsedTime);
        if(!isNaN(elapsedTime) && elapsedTime > 2) {
            step = 0;
        }

        // Clean and check file and take action
        _cleanFile().then(function() {
            _checkFile().then(function(wakeUp) {
                console.log("wake up ? ", wakeUp, step);
                if(wakeUp) {
                    utils.speak("Yes ?").then(function() {
                        _listen();
                    })
                } else {
                    console.log("set sleep timing !");
                    sleepTiming = process.hrtime();
                    _sleep(); // carry on sleeping
                }
            });
        });

    });
}

/* Listen for a command */
function _listen(nb) {
    nb = (_.isUndefined(nb)) ? 1 : nb;
    var cmd = 'timeout --signal=SIGINT 5 sox -t alsa ' + AUDIO_SOURCE + ' ' + SOUND_FILE + ' silence 1 0.1 ' + DETECTION_PERCENTAGE_START + ' 1 1.0 ' + DETECTION_PERCENTAGE_END;
    console.log("listen", cmd);
    var child = exec(cmd);
    child.on('close', function(code) {
        console.log("close with code", code);
        if(code === 0) {
            _cleanFile().then(function() {
                _analyze();
            });
        } else {
            // This is a timeout
            if(nb === LISTEN_MAX_TRIALS) {
                utils.speak("Nevermind. Good bye !").then(function() {
                    _sleep(true);
                });
            } else {
                utils.speak("Repeat please").then(function() {
                    _listen(++nb);
                });
            }
        }
    });
}

function  _cleanFile() {
    var deferred = Q.defer();
    // Clean noise
    var cmd = 'sox ' + SOUND_FILE + ' ' + SOUND_FILE_CLEAN + ' noisered ' + NOISE_PROFILE + ' 0.21';
    console.log("clean", cmd);
    exec(cmd, function(error, duration, stderr) {
        deferred.resolve();
    });
    return deferred.promise;
}

/* Init */
var ipAddress = ip.address();
if(ipAddress !== '192.168.1.20') {
    console.log("raspberry config detected");
    AUDIO_SOURCE = 'hw:0,0';
    NOISE_PROFILE = 'noise-rasp.prof';
    //DETECTION_PERCENTAGE_START = '5%';
    //DETECTION_PERCENTAGE_END = '5%';
}

_sleep(true);