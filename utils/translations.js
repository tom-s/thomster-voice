var Translations = (function() {
    var lang = 'en';
    var texts = {
        'YES': {
            en: "Yes ?",
            fr: "Oui ?"
        },
        'REPEAT': {
            en: "Sorry, could you repeat please ?",
            fr: "Je n'ai pas compris, pouvez-vous répéter ?"
        },
        'REPEAT_SHORT': {
            en: "Repeat please",
            fr: "Veuillez répéter"
        },
        'NEVERMIND': {
            en: "Nevermind. Good bye !",
            fr: "Tant pis, au revoir !"
        }
    };
    return {
        setLang: function(language) {
            lang = language;
        },
        get: function(key, language) {
            if(!language) language = lang;
            return texts[key][language];
        }
    };
})();

module.exports = Translations;