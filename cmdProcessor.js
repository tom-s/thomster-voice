var _ = require('lodash');
var utils = require('./utils.js');

// Commands
var weatherCmd = require('./commands/weather.js');
var timeCmd = require('./commands/time.js');

cmdProcessor = (function() {
    return {
        execute: function(cmd, params) {
            console.log("execute", cmd, params);
            // Call appropriate function for given command
            switch(cmd) {
                case 'weather':
                    var location = _.get(_.find(params, {key: 'location'}), '[0]');
                    //weather.get(location) ;
                    break;
                case 'day':
                    var location = _.get(_.find(params, {key: 'location'}), '.values[0]');
                    timeCmd.getDay(location).then(
                        function success(response) {
                            utils.speak("Today is : " + response);
                        },
                        function error() {
                            utils.speaks("Sorry, I can't get the time");
                        }
                    );
                    break;
                case 'time':
                    var location = _.get(_.find(params, {key: 'location'}), '.values[0]');
                    timeCmd.getTime(location).then(
                        function success(response) {
                            utils.speak("The time is : " + response);
                        },
                        function error() {
                            utils.speaks("Sorry, I can't get the time");
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
        }
    };
})();





module.exports = cmdProcessor;