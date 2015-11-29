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
            console.log("speak", text);
            if(socket) socket.emit('speak', {text: text}); // emit an event
            return picoSpeaker.speak(text); // speak
        }
    };
})();

module.exports = EventSpeaker;