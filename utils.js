var exec = require('child_process').exec;

var utils = (function() {
    var lastText = '';
    return {
        speak: function(text) {
            var cmd = 'pico2wave -w output.wav " ' + text + '" && aplay output.wav';
            exec(cmd, function(error, stdout, stderr) {
                // command output is in stdout
                if(error) {
                    console.log('error while executing command ', cmd);
                }
                lastText = text;
            });
        },
        repeat: function() {
            this.speak(lastText);
        }
    };
})();

module.exports = utils;