var _ = require('lodash');
var Q = require('q');
var exec = require('child_process').exec;
var eventSpeaker = require('./eventSpeaker.js');
var cmdProcessor = require('./cmdProcessor.js');
var ai = require('./ai.js');
var appRoot = require('app-root-path');

// Include translations
var TRANS = require('./translations.js');

var orderListener = (function() {
    /* DEFAULT CONFIG */
    var CONFIG = {
        AUDIO_SOURCE: 'hw:1,0', // microphone
        DETECTION_PERCENTAGE_START : '5%',
        DETECTION_PERCENTAGE_END: '5%',
        CLEANING: {
            PERFORM: true, // requires a noise profile
            NOISE_PROFILE: 'noise.prof'
        },
        SOUND_FILE : "input.wav", // input file
        SOUND_FILE_CLEAN  : "input-clean.wav",
        LISTEN_MAX_TRIALS : 2
    };

    var finishedCb = null;
    var socket = null;

    function _analyze(filename) {
        console.log('analyze', filename);
        ai.ask(filename).then(
            function success(res) {
                console.log("RES is", res);

                var answer = _.get(res, 'fulfillment.speech');
                if(answer) {
                    console.log("answer is", answer);
                    eventSpeaker.speak(answer);
                    if(finishedCb) finishedCb();

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
                eventSpeaker.speak(TRANS.get('REPEAT')).then(function() {
                    _listen();
                })
            }
        );
    }

    function  _cleanFile(filename) {
        var deferred = Q.defer();
        if(CONFIG.CLEANING.PERFORM) {
            var newFilename = filename.substr(0, filename.lastIndexOf(".")) + "clean.wav";
            // Clean noise
            var cmd = 'sox ' + filename + ' ' + newFilename + ' noisered ' + CONFIG.CLEANING.NOISE_PROFILE + ' 0.21';
            exec(cmd, function() {
                console.log('filename is', newFilename);
                deferred.resolve(newFilename);
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
        var cmd = 'timeout --signal=SIGINT 5 sox -t alsa ' + CONFIG.AUDIO_SOURCE + ' ' + CONFIG.SOUND_FILE + ' silence -l 1 0.0001 ' + CONFIG.DETECTION_PERCENTAGE_START + ' 1 1.0 ' + CONFIG.DETECTION_PERCENTAGE_END;
        var filename = appRoot + '/input.wav';

        var child = exec(cmd, function(err, stdout, sterr) {
            console.log("command finished", err, stdout, sterr);
            if(!err) {
                _cleanFile(filename).then(function(filename) {
                    _analyze(filename);
                });
            } else {
                // This is a timeout
                if(nb === CONFIG.LISTEN_MAX_TRIALS) {
                    eventSpeaker.speak(TRANS.get('NEVERMIND'));
                    if(finishedCb) finishedCb();
                } else {
                    eventSpeaker.speak(TRANS.get('REPEAT_SHORT')).then(function() {
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
            console.log("here");
            finishedCb = cb;
            _listen();
        },

        setSocket: function(ioSocket) {
            socket = ioSocket;
        }
    };
})();

module.exports = orderListener;

console.log("required");