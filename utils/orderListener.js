var _ = require('lodash');
var Q = require('q');
var exec = require('child_process').exec;
var cmdProcessor = require('./cmdProcessor.js');
var intentFinder = require('./intentFinder.js');

var orderListener = (function() {
    /* DEFAULT CONFIG */
    var CONFIG = {
        AUDIO_SOURCE: 'hw:1,0',
        DETECTION_PERCENTAGE_START : '5%',
        DETECTION_PERCENTAGE_END: '5%',
        CLEANING: {
            PERFORM: false, // requires a noise profile
            NOISE_PROFILE: 'noise.prof'
        },
        SOUND_FILE : "input.wav", // input file
        SOUND_FILE_CLEAN  : "input-clean.wav",
        LISTEN_MAX_TRIALS : 2
    };

    var finishedCb = null;

    function _analyze() {
        intentFinder.get(CONFIG.SOUND_FILE_CLEAN).then(
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
                        if(finishedCb) {
                            finishedCb();
                        }
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
        var cmd = 'timeout --signal=SIGINT 5 sox -t alsa ' + CONFIG.AUDIO_SOURCE + ' ' + CONFIG.SOUND_FILE + ' silence 1 0.1 ' + CONFIG.DETECTION_PERCENTAGE_START + ' 1 1.0 ' + CONFIG.DETECTION_PERCENTAGE_END;
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
                        if(finishedCb) {
                            finishedCb();
                        }
                    });
                } else {
                    utils.speak("Repeat please").then(function() {
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
        }
    };
})();

module.exports = orderListener;