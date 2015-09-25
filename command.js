var _ = require('lodash');
var glob = require('glob-all');
var text2num = require('text2num');
var request = require('request');
var natural = require('natural');

// CONF
var FILES = '/home/pi/share/';
var VIDEO_EXTENSIONS = [
    '.3gp',
    '.avi',
    '.bdmv',
    '.divx',
    '.flv',
    '.ifo',
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

// Retrieve arguments
var args = require('yargs').argv;

// Google speak function
function speak(text) {
    console.log(text); // todo
}

var command = _.get(args, '.c');

// Check that a command is provided
if(_.isUndefined(command)) {
    speak("Sorry, I don't know how to do this");
}


// Call appropriate function for given command
switch(command) {
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
        speak("Sorry, I don't understand");
}


function _playMovie(args) {
    console.log('try to find movie with args', args);

    // Change args to make them better
    var args = _formatArgs(args);
    var videoExtension = '*' + VIDEO_EXTENSIONS.join('|')
    var pattern = FILES + '**/' + args.join('*') + '*' + videoExtension;
    console.log("pattern", pattern);

    var files = glob.sync([
        pattern      //include all     files/
    ], {nocase:true});

    switch(files.length) {
        case 0:
            var file = _searchSimilarSoundingFile(args, VIDEO_EXTENSIONS);
            speak("Starting "+ file);
            break;
        case 1:
            var file = files[0];
            speak("Starting "+ file);
            _openFile(file);
            break;
        default:
            var fileStr = FILES + args.join(' ') + videoExtension;
            var file = _searchBestFile(files, fileStr);
            speak("Starting "+ file);
            _openFile(file);
    }

    console.log("files", files);
}

function _searchSimilarSoundingFile(args) {
    
}


function _searchBestFile(files, filesStr) {
    var bestScore = -1;
    var bestFile = files[0];
    _.forEach(files, function(file) {
        var fileName = url.substring(url.lastIndexOf('/')+1);
        var score = natural.JaroWinklerDistance(fileName, filesStr);
        if(score > bestScore) {
            bestFile = file;
        }
    });
    return bestFile;
}

function _openFile(file) {
    var url = 'http://192.168.0.1/jsonrpc?request={"jsonrpc":"2.0","id":"1","method":"Player.Open","params":{"item":{"file":"' + file + '"}}}'
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Show response
            speak("Opening movie");
        } else {
            console.log('an error occured', error, response);
            speak("Sorry, I can't open the movie");
        }
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

function _formatArgs(args) {
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

        // Replace "season" and "episod"
        if(arg.toLowerCase() === "season") {
            seasonIndex = index;
        }
        if(arg.toLowerCase() === "episod") {
            episodIndex = index;
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
