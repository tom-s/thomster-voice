var _ = require('lodash');
var utils = require('./utils.js');
var Q = require('q');

// Commands
var weatherCmd = require('./commands/weather.js');
var timeCmd = require('./commands/time.js');
var wolframCmd = require('./commands/wolfram.js');

var MIN_CONFIDENCE_THRESHOLD = 0.4;

cmdProcessor = (function() {
    return {
        execute: function(cmd, confidence, params) {
            var deferred = Q.defer();
            if(confidence < MIN_CONFIDENCE_THRESHOLD) {
                cmd = 'answer'; // force wolfram if unsure
            }
            // Call appropriate function for given command
            switch(cmd) {
                case 'repeat':
                    utils.repeat();
                    break;
                case 'answer':
                    var query = _.get(_.find(params, {key: 'search_query'}), '.values[0]');
                    wolframCmd.getAnswer(query).then(
                        function success(response) {
                            utils.speak(response).then(function() {
                                deferred.resolve();
                            });
                        },
                        function error() {
                            utils.speak("Sorry, I can't get the answer to your question").then(function() {
                                deferred.reject();
                            });
                        }
                    );
                    break;
                case 'weather':
                    var location = _.get(_.find(params, {key: 'location'}), '[0]');
                    //weather.get(location) ;
                    break;
                case 'day':
                    var location = _.get(_.find(params, {key: 'location'}), '.values[0]');
                    timeCmd.getDay(location).then(
                        function success(response) {
                            utils.speak("Today is : " + response).then(function() {
                                deferred.resolve();
                            });
                        },
                        function error() {
                            utils.speak("Sorry, I can't get the time").then(function() {
                                deferred.reject();
                            });
                        }
                    );
                    break;
                case 'time':
                    var location = _.get(_.find(params, {key: 'location'}), '.values[0]');
                    timeCmd.getTime(location).then(
                        function success(response) {
                            utils.speak("The time is : " + response).then(function() {
                                deferred.resolve();
                            });
                        },
                        function error() {
                            utils.speak("Sorry, I can't get the time").then(function() {
                                deferred.reject();
                            });
                        }
                    );
                    break;

                case 'watch':
                    break;

                case 'pause':
                    break;

                case 'play':
                    break;

                default :
                    utils.speak("Sorry, I don't know how to that");
            }
            return deferred.promise;
        }
    };
})();





module.exports = cmdProcessor;