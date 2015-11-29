var _ = require('lodash');
var Q = require('q');
var exec = require('child_process').exec;
var eventSpeaker = require('pico-speaker');
var cmdProcessor = require('./cmdProcessor.js');
var ai = require('./ai.js');

// Include translations
var TRANS = require('./translations.js');

var orderListener = (function() {
    /* DEFAULT CONFIG */
    var CONFIG = {
        AUDIO_SOURCE: 'hw:1,0',
        DETECTION_PERCENTAGE_START : '20%',
        DETECTION_PERCENTAGE_END: '20%',
        CLEANING: {
            PERFORM: false, // requires a noise profile
            NOISE_PROFILE: 'noise.prof'
        },
        SOUND_FILE : "input.wav", // input file
        SOUND_FILE_CLEAN  : "input-clean.wav",
        LISTEN_MAX_TRIALS : 2
    };

    var finishedCb = null;
    var socket = null;

    function _analyze() {
        ai.ask(CONFIG.SOUND_FILE_CLEAN).then(
            function success(res) {
                console.log("RES is", res);

                var answer = _.get(res, 'fulfillment.speech');
                if(answer) {
                    console.log("answer is", answer);
                    eventSpeaker.speak(answer).then(function() {
                        if(finishedCb) {
                            finishedCb();
                        }
                    })
                } else {
                    // This is a custom action, handle it accordingly
                    /*
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
                     eventSpeaker.speak("Sorry, I don't know how to that").then(function() {
                     if(finishedCb) {
                     finishedCb();
                     }
                     })

                     });*/
                }
            },
            function error() {
                eventSpeaker.speak(TRANS.REPEAT).then(function() {
                    _listen();
                })
            }
        );
    }

    function  _cleanFile(filename) {
        var deferred = Q.defer();
        if(CONFIG.CLEANING.PERFORM) {
            // Clean noise
            var cmd = 'sox ' + filename + ' ' + 'clean-' + filename + ' noisered ' + CONFIG.CLEANING.NOISE_PROFILE + ' 0.21';
            exec(cmd, function() {
                deferred.resolve('clean-' + filename);
            });
        } else {
            // No cleaning to do
            deferred.resolve(filename);
        }

        return deferred.promise;
    }

    /* Listen for a command */
    function _listen(nb) {
        nb = (_.isUndefined(nb)) ? 1 : nb;
        var cmd = 'timeout --signal=SIGINT 5 sox -t alsa ' + CONFIG.AUDIO_SOURCE + ' ' + CONFIG.SOUND_FILE + ' silence 1 0.1 ' + CONFIG.DETECTION_PERCENTAGE_START + ' 1 1.0 ' + CONFIG.DETECTION_PERCENTAGE_END;
        var child = exec(cmd);
        child.on('close', function(code) {
            if(code === 0) {
                _cleanFile().then(function() {
                    _analyze();
                });
            } else {
                // This is a timeout
                if(nb === CONFIG.LISTEN_MAX_TRIALS) {
                    eventSpeaker.speak(TRANS.NEVERMIND).then(function() {
                        if(finishedCb) {
                            finishedCb();
                        }
                    });
                } else {
                    eventSpeaker.speak(TRANS.REPEAT_SHORT).then(function() {
                        _listen(++nb);
                    });
                }
            }
        });
    }



    return {
        init: function (props) {
            if(props) {
                _.assign(CONFIG, props);
            }
        },

        listen: function(cb) {
            finishedCb = cb;
            _listen();
        },

        setSocket: function(ioSocket) {
            socket = ioSocket;
        }
    };
})();

module.exports = orderListener;