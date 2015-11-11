var _ = require('lodash');
var Q = require('q');
var ip = require('ip');
var clapDetector = require('clap-detector');
var speaker = require('pico-speaker');
var orderListener = require('./utils/orderListener.js');


/* Config */
var DEV_IP = '192.168.0.10';
var ipAddress = ip.address();
var clapConfig = {
    CLEANING: {
        PERFORM: false
    }
};
var orderConfig = {};
var speakerConfig = {};

// Override config for raspberry
if(ipAddress !== DEV_IP) {
    console.log("raspberry config detected");
    clapConfig.AUDIO_SOURCE = 'hw:0,0';
    //clapConfig.NOISE_PROFILE = 'noise-rasp.prof';
    clapConfig.DETECTION_PERCENTAGE_START = '5%';
    clapConfig.DETECTION_PERCENTAGE_END = '5%';
} else {
    speakerConfig.AUDIO_DEVICE = 'default:CARD=PCH';
}


/* Initalization */

/* Initialize speaker */
speaker.init(speakerConfig);

/* Initialize order listener */
orderListener.init(orderConfig);

/* Start clap detection */
clapDetector.start(clapConfig);

// Register to multiple claps
clapDetector.onClaps(3, 2000, function(delay) {
    console.log("3 claps in ", delay, "ms");
    speaker.speak('Yes ?').then(function() {
        clapDetector.pause();
        orderListener.listen(function() {
            clapDetector.resume();
        });
    })
}.bind(this));


 // Register to one clap
 clapDetector.onClap(function() {
    console.log('a clap has been recorded ');
 }.bind(this));
