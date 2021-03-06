var glob = require('glob-all');
var text2num = require('text2num');
var request = require('request');
var natural = require('natural');
var metaphone = natural.Metaphone;
var soundEx = natural.SoundEx;
var exec = require('child_process').exec;
var _ = require('lodash');
var Q = require('q');
var windowManager = require('../utils/windowManager.js');

// CONF
var FILES = '/home/pi/share/';
var VIDEO_EXTENSIONS = [
    '.3gp',
    '.avi',
    '.bdmv',
    '.divx',
    '.m2ts',
    '.m4v',
    '.mkv',
    '.mov',
    '.mp4',
    '.mpeg',
    '.mpg',
    '.mts',
    '.ogm',
    '.ogv',
    '.wmv'
];


var movie = (function() {

    function _startKodi() {
        console.log("start kodi");
        var deferred = Q.defer();
        // Check if kodi is running
        var cmd = "ps cax | grep chrome | grep -o '^[ ]*[0-9]*'";
        exec(cmd, function(error, out, stderr) {
            if(out) {
                console.log("already runnning");
                // already running
                deferred.resolve();
            } else {
                console.log("start kodi");
                var cmd = "startkodi %u";
                exec(cmd, function(error, out, stderr) {
                    if(error) {
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                });
            }
        });
        return deferred.promise;
    }

    function _searchSimilarSoundingFile(search) {
        var similarSoundingFiles = [];

        // Retrieve list of all movies
        var pattern = FILES + '**/*' + videoExtension;

        var files = glob.sync([
            pattern      //include all     files/
        ], {nocase:true});

        console.log("list of all video files", files);

        // Select movies which sound like
        _.forEach(files, function(file) {
            var fileName = file.substring(url.lastIndexOf('/')+1);
            if(metaphone.compare(fileName, search)) {
                similarSoundingFiles.push(file);
            }
        });

        return _searchBestFile(similarSoundingFiles, search);
    }


    function _searchBestFile(files, filesStr) {
        var bestScore = -1;
        var bestFile = null;
        _.forEach(files, function(file) {
            var fileName = file.substring(file.lastIndexOf('/')+1);
            var score = natural.JaroWinklerDistance(fileName, filesStr);
            if(score > bestScore) {
                bestFile = file;
            }
        });
        return bestFile;
    }

    function _openFile(file) {
        _startKodi().then(function() {
            console.log("OPEN FILE");
            var url = 'http://192.168.0.1/jsonrpc?request={"jsonrpc":"2.0","id":"1","method":"Player.Open","params":{"item":{"file":"' + file + '"}}}'
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body) // Show response
                    utils.speak("Opening movie");
                } else {
                    console.log('an error occured', error, response);
                    utils.speak("Sorry, I can't open the movie");
                }
            })
        })
    }

    function _playPause() {
        var url = 'http://192.168.0.1/jsonrpc?request={"jsonrpc": "2.0", "method": "Player.PlayPause", "params": { "playerid": 0 }, "id": 1}';
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Show response
            } else {
                console.log('an error occured', error, response);
            }
        })
    }

    function _formatArgs(args, isSerie) {
        isSerie = (isSerie) ? true : false;
        var seasonIndex;
        var episodIndex;

        var formatedArgs = _.map(args, function(arg, index) {
            // Convert text to numbers
            try {
                arg = text2num(arg);
                // If a number, format it adding extra 0 prefix
                arg = (arg < 10)  ? arg = '0' + arg : '' + arg;
            } catch(err) {
                // don't care
            }

            if(isSerie) {
                // Replace "season" and "episod"
                if(arg.toLowerCase() === "season") {
                    seasonIndex = index;
                }
                if(arg.toLowerCase() === "episod") {
                    episodIndex = index;
                }
            }

            return arg;

        });

        // If both season and episod are provided (serie), make it standard format
        if(seasonIndex && episodIndex) {
            formatedArgs[seasonIndex] = 's';
            formatedArgs[episodIndex] = 'e';

            /*
             // if two numbers in a row, it's almost certain to be an episod number with a missing dash
             var previousArgIsInt = false;
             var indexesToBeDeleted = [];
             formatedArgs = _.compact(_.map(formatedArgs, function(arg, index) {
             var intPattern =  /^([0-9]+)$/;
             var argIsInt = intPattern.test(arg);
             if(previousArgIsInt && argIsInt) {
             arg = formatedArgs[index - 1] = formatedArgs[index - 1] + '-' + arg; // update former argument
             indexesToBeDeleted = index;
             }
             previousArgIsInt = argIsInt;
             return arg;
             }));
             */

        }


        console.log("formated args are", formatedArgs);
        return formatedArgs;
    }

    return {
        playMovie: function(movieName) {
            console.log('try to find movieby the name of', movieName);

            var deferred = Q.defer();

            // Format args
            var args = movieName.split(' ');
            var videoExtension = '*' + VIDEO_EXTENSIONS.join('|')
            var pattern = FILES + '**/' + args.join('*') + '*' + videoExtension;
            console.log("pattern", pattern);

            var files = glob.sync([
                pattern      //include all     files/
            ], {nocase:true});

            console.log("files", files);

            switch(files.length) {
                case 0:
                    // Try a last resort solution, finding a name by the way it sounds !
                    console.log('search similar sounding file');
                    var file = _searchSimilarSoundingFile(args.join(' '), VIDEO_EXTENSIONS);
                    if(file) {
                        return _openFile(file);
                    } else {
                        deferred.reject();
                    }
                    break;
                case 1:
                    console.log("movie found !");
                    var file = files[0];
                    return _openFile(file);
                    break;
                default:
                    // Pick the best file
                    var fileStr = FILES + args.join(' ') + videoExtension;
                    var file = _searchBestFile(files, fileStr);
                    if(file) {
                        return _openFile(file);
                    } else {
                       deferred.reject();
                    }
            }
            return deferred.promise;
        },
        playSerie: function(args) {
            console.log('try to find movie with args', args);

            // Format args
            var args = _formatArgs(args);
            var videoExtension = '*' + VIDEO_EXTENSIONS.join('|')
            var pattern = FILES + '**/' + args.join('*') + '*' + videoExtension;
            console.log("pattern", pattern);

            var files = glob.sync([
                pattern      //include all     files/
            ], {nocase:true});

            console.log("files", files);

            switch(files.length) {
                case 0:
                    // Try a last resort solution, finding a name by the way it sounds !
                    var file = _searchSimilarSoundingFile(args.join(' '), VIDEO_EXTENSIONS);
                    if(file) {
                        utils.speak("Starting "+ file);
                        _openFile(file);
                    } else {
                        utils.speak("Could not file movie");
                    }
                    break;
                case 1:
                    var file = files[0];
                    utils.speak("Starting "+ file);
                    _openFile(file);
                    break;
                default:
                    var fileStr = FILES + args.join(' ') + videoExtension;
                    var file = _searchBestFile(files, fileStr);
                    if(file) {
                        utils.speak("Starting "+ file);
                    } else {
                        utils.speak("Could not file movie");
                        _openFile(file);
                    }
            }
        }
    }
})();


module.exports = movie;