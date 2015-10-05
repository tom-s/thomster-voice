var exec = require('child_process').exec;
var _ = require('lodash');
var Q = require('q');

var windowManager = (function() {
    return {
        toggleFullScreen: function(windowId) {
            var deferred = Q.defer();
            var cmd = 'wmctrl -i -r ' + windowId + ' -b toggle,fullscreen,maximized_vert,maximized_horz';
            exec(cmd, function(error, out, stderr) {
                // command output is in stdout
                if(error) {
                    console.log('error while executing command ', cmd);
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        },
        getWindowId: function(name) {
            var deferred = Q.defer();
            var cmd = ' wmctrl -l | grep ' + name;
            var regEx = /([a-zA-Z0-9]+)\s.+/;
            exec(cmd, function(error, out, stderr) {
                // command output is in stdout
                if(error) {
                    console.log('error while executing command ', cmd);
                    deferred.reject();
                } else {
                    var data = out.match(regEx);
                    console.log("data", data);
                    deferred.resolve(_.get(data, '[1]'));
                }
            });
            return deferred.promise;
        }
    };
})();

module.exports = windowManager;