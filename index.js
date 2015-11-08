var _ = require('lodash');
var utils = require('./utils.js');
var Q = require('q');
var ip = require('ip');
var clapDetector = require('./utils/clapDetector.js');

var DEV_IP = '192.168.0.10';

/* Init */
var ipAddress = ip.address();
var clapConfig = {
    CLEANING: {
        perform: true
    }
};

// Override config for raspberry
if(ipAddress !== DEV_IP) {
    console.log("raspberry config detected");
    clapConfig.AUDIO_SOURCE = 'hw:0,0';
    //clapConfig.NOISE_PROFILE = 'noise-rasp.prof';
    clapConfig.DETECTION_PERCENTAGE_START = '5%';
    clapConfig.DETECTION_PERCENTAGE_END = '5%';
}


/* Start clap detection */
clapDetector.start(clapConfig);

// Register to one clap
clapDetector.onClap(function() {
    //console.log('a clap has been recorded ');
}.bind(this));

// Register to multiple claps
clapDetector.onClaps(3, 3000, function(delay) {
    console.log("3 claps in ", delay, "ms");
    utils.speak('Yes ?', function() {
        console.log("listen !");
    })
}.bind(this));

