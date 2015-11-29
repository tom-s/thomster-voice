var _ = require('lodash');
var Q = require('q');
var ip = require('ip');
var ai = require('./utils/ai.js');
var clapDetector = require('clap-detector');
var orderListener = require('./utils/orderListener.js');
var eventSpeaker = require('./utils/eventSpeaker.js');

// Include translations
var TRANS = require('./utils/translations.js');

// Start socket on port 8000
var io = require('socket.io')(8000);
var ioSocket = null;

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
    clapConfig.DETECTION_PERCENTAGE_START = '10%';
    clapConfig.DETECTION_PERCENTAGE_END = '10%';
} else {
    speakerConfig.AUDIO_DEVICE = 'default:CARD=PCH';
    clapConfig.DETECTION_PERCENTAGE_START = '20%';
    clapConfig.DETECTION_PERCENTAGE_END = '20%';
}


/* Initalization */

/* Initialize sockets */
io.on('connection', function(socket){
    console.log('a user connected');
    ioSocket = socket;
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    // Update event speaker
    eventSpeaker.setSocket(socket);
    orderListener.setSocket(socket);

});

/* Initialize event Speaker  */
eventSpeaker.init(speakerConfig);

/* Initialize order listener */
orderListener.init(orderConfig);

/* Start clap detection */
clapDetector.start(clapConfig);

// Register to multiple claps
clapDetector.onClaps(3, 2000, function(delay) {
    console.log("3 claps in ", delay, "ms");

    eventSpeaker.speak(TRANS.YES).then(function() {
        clapDetector.pause();
        console.log("listen for order");
        orderListener.listen(function() {
            clapDetector.resume();
        });
    })
}.bind(this));


 // Register to one clap
 clapDetector.onClap(function() {
    console.log('a clap has been recorded ');
 }.bind(this));


