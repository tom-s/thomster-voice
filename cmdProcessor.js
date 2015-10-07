var _ = require('lodash');
var utils = require('./utils.js');
var Q = require('q');

// Commands
var weatherCmd = require('./commands/weather.js');
var timeCmd = require('./commands/time.js');
var wolframCmd = require('./commands/wolfram.js');
var movieCmd = require('./commands/movie.js');

// CONF
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
                case 'shutUp':
                    utils.shutUp();
                    utils.speak("OK").then(function() {
                        deferred.resolve();
                    });
                    break;
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
                    console.log("params", params);
                    var location = _.get(_.find(params, {key: 'location'}), '[0]');
                    var datetime = _.get(_.find(params, {key: 'datetime'}), '[0]');
                    weatherCmd.get(location, datetime).then(
                        function success(response) {
                            utils.speak(response).then(function() {
                                deferred.resolve();
                            });
                        },
                        function error() {
                            utils.speak("Sorry, I can't get the weather").then(function() {
                                deferred.reject();
                            });
                        }
                    ) ;
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

                case 'watchMovie':
                    var movieName = _.get(_.find(params, {key: 'movieName'}), '.values[0]');
                    movieCmd.playMovie(movieName).then(
                        function success(response) {
                            utils.speak("Playing movie").then(function() {
                                deferred.resolve();
                            });
                        },
                        function error() {
                            utils.speak("Sorry, I can't get find the movie " + movieName).then(function() {
                                deferred.reject();
                            });
                        }
                    );
                    break;;

                case 'watchSerie':
                    break;

                case 'pause':
                    break;

                case 'play':
                    break;

                default :
                    deferred.reject();
            }
            return deferred.promise;
        }
    };
})();

module.exports = cmdProcessor;