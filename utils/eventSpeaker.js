var picoSpeaker = require('pico-speaker');

var EventSpeaker = (function() {
    var socket = null;

    return {
        init: function(speakerConfig) {
            picoSpeaker.init(speakerConfig);
        },

        setSocket: function(ioSocket) {
            socket = ioSocket;
        },

        speak: function(text) {
            console.log("speak");
            if(socket) socket.emit('speak', {text: text});
            return picoSpeaker.speak(text);
        }
    };
})();

module.exports = EventSpeaker;