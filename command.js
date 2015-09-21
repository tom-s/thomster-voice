var _ = require('lodash');
var glob = require('glob-all');
var text2num = require('text2num');

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
    case 'playMovie':
        _playMovie(args._);
        break;

    default :
        speak("Sorry, I don't know how to do this");
}


function _playMovie(args) {
    console.log('try to find movie with args', args);

    // Change args to make them better
    var args = _formatArgs(args);
    var files = glob.sync([
        'files/**',      //include all     files/
        '!files/x/**',   //then, exclude   files/x/
        'files/x/z.txt'  //then, reinclude files/x/z.txt
    ]);
}

function _formatArgs(args) {
    var formatedArgs = _.map(args, function(arg) {
        // Convert text to numbers
        try {
            arg = text2num(arg);
            // If a number, format it adding extra 0 prefix
            arg = (arg < 10)  ? arg = '0' + arg : '' + arg;
        } catch(err) {
            // don't care
        }
        return arg;

    });
    console.log("formated args are", formatedArgs);
    return formatedArgs;
}
