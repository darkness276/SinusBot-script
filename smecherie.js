registerPlugin({
    name: 'Smecheria lui Darkness',
    version: '0.0.1',
    description: 'Functii pentru propriul client. Made with 💚 by Darkness.',
    author: 'Darkness.',
    vars: [{
        name: 'mesaje',
        title: 'Raspunsuri funny, atunci cand botul primeste orice mesaj in privat.',
        type: 'array',
        vars: [
            {
                name: 'mesaj_nebun',
                title: 'Mesaj',
                type: 'string'
            }
        ]
    }, {
        name: 'interval',
        title: 'Interval restart bot (in ore)',
        type: 'number',
        placeholder: '5',
        default: 5
    }]
}, (_, { mesaje, interval }) => {

    // librarii
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');

    event.on('chat', function(ev) {
        if (!ev.client) return; // in caz de bug
        if (ev.client.isSelf()) return; // sa nu-si raspunda la propriile mesaje
        if (ev.mode != 1) return; // sa fie doar mesaj privat

        onChat(ev)
        .catch(e => {
            engine.log('[Smecheria lui Darkness] Eroare onChat: ' + e.message);
        });
    });

    async function onChat(ev)
    {
        if (mesaje.length > 0) // verifica daca a setat vreun mesaj
        {
            let random = Math.floor(Math.random() * mesaje.length);

            ev.client.chat(mesaje[random].mesaj_nebun); // trimite un mesaj random
        }
    }

    // reconectare la interval setat
    if (interval > 0)
    {
        setInterval(() => {
            engine.log('[Smecheria lui Darkness] Deconectare bot...');
            backend.disconnect();

            setTimeout(() => {
                backend.connect();
                engine.log('[Smecheria lui Darkness] Bot reconectat!');
            }, 3000);
        }, interval * 3600000);
    }
});