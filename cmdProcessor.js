var _ = require('lodash');
var utils = require('./utils.js');

cmdProcessor = (function() {
    return {
        execute: function(cmd, params) {
            console.log("execute", cmd, params);
            // Call appropriate function for given command
            switch(cmd) {
                case 'time':
                    break;

                case 'watch':
                    _playMovie(args._);
                    break;

                case 'pause':
                    _playPause();
                    break;

                case 'play':
                    _playPause();
                    break;

                default :
                    utils.speak("Sorry, I don't know how to that");
            }
        }
    };
})();





module.exports = cmdProcessor;