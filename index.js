var _ = require('lodash');
var exec = require('child_process').exec;
var utils = require('./utils.js');
var cmdProcessor = require('./cmdProcessor.js');
var intentFinder = require('./intentFinder.js');
var Q = require('q');
var ip = require('ip');
var clapDetector = require('./utils/clapDetector.js');

var DEV_IP = '192.168.0.10';


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
                utils.speak("Sorry, I don't know how to that").then(function() {
                    _sleep(true);
                })

            });
        },
        function error() {
            utils.speak("Sorry I didn't get that, repeat please").then(function() {
                _listen();
            })
        }
    );
}

/* Listen for a command */
function _listen(nb) {
    nb = (_.isUndefined(nb)) ? 1 : nb;
    var cmd = 'timeout --signal=SIGINT 5 sox -t alsa ' + AUDIO_SOURCE + ' ' + SOUND_FILE + ' silence 1 0.1 ' + DETECTION_PERCENTAGE_START + ' 1 1.0 ' + DETECTION_PERCENTAGE_END;
    var child = exec(cmd);
    child.on('close', function(code) {
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

/* Init */
var ipAddress = ip.address();
var clapConfig = {
    CLEANING: {
        perform: true
    }
};

// Override config for raspberry
if(ipAddress !== DEV_IP) {
    console.log("raspberry config detected");
    clapConfig.AUDIO_SOURCE = 'hw:0,0';
    //clapConfig.NOISE_PROFILE = 'noise-rasp.prof';
    clapConfig.DETECTION_PERCENTAGE_START = '5%';
    clapConfig.DETECTION_PERCENTAGE_END = '5%';
}

clapDetector.start(clapConfig);

// Register to one clap
clapDetector.onClap(function() {
    //console.log('CLAP CALLBACK ! ');
}.bind(this));

// Register to multiple claps
clapDetector.onClaps(3, 3000, function(delay) {
    console.log("3 claps in ", delay, "ms");
}.bind(this));

