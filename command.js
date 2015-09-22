var _ = require('lodash');
var glob = require('glob-all');
var text2num = require('text2num');
var FILES = '/home/pi/share/';

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
    var pattern = FILES + '**/' + args.join('*') + '*';
    console.log("pattern", pattern);

    var files = glob.sync([
        pattern      //include all     files/
    ], {nocase:true});

    console.log("files", files);
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
