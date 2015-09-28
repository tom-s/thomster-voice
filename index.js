var _ = require('lodash');
var utils = require('./utils.js');
var cmdProcessor = require('./cmdProcessor.js');
var intentFinder = require('./intentFinder.js');

var SOUND_FILE = "input.wav";

intentFinder.get(SOUND_FILE).then(
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
    },
    function error() {
        utils.speak("Sorry, I can't do that !");
    }
);