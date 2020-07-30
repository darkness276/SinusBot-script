registerPlugin({
    name: 'Darkness Functions',
    version: '0.4.3',
    description: 'Vezi balanta sau transferi zincoins fara sa te conectezi pe identitatea botului / reconectare la interval.',
    author: 'Darkness.',
    vars: [{
        name: 'identitate',
        title: 'Identitate owner (ala care poate da !balance, !transfer etc.)',
        type: 'string'
    }, {
        name: 'identitatebot',
        title: 'Identitate ZinGuard (dupa ce o bagi, da restart la bot)',
        type: 'string'
    }, {
        name: 'interval',
        title: 'Interval restart bot (0-8 ore)',
        type: 'number',
        placeholder: '0',
        default: 0
    }]
}, (_, { identitate, identitatebot, interval }) => {

    // librarii
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');

    var zin = null; // Client ZinGuard
    var verifica = null; // trimite de 2 ori !transfer pentru a ma asigura

    event.on('chat', function(ev) {
        if (!ev.client) return; // in caz de bug
        if (ev.client.isSelf()) return; // sa nu-si raspunda la propriile mesaje
        if (ev.mode != 1) return; // sa fie doar mesaj privat

        onChat(ev)
        .catch(e => {
            engine.log('[Darkness Functions] Eroare onChat: ' + e.message);
        });
    });

    async function onChat(ev)
    {
        if (ev.client.uid() === identitate) // identitatea mea
        {
            var patron = null; // Clientul celui care are acces
            patron = backend.getClientByUID(identitate);

            if (patron != null)
            {
                if (ev.text.indexOf('!transfer') != -1)
                {
                    if (zin == null) return patron.chat('Nu pot vorbi inca cu ZinGuard, el trebuie sa faca primul pas...'); // fiind ZinGuard query, nu client, nu poate sa-i dea mesaj decat daca ii da el unul
                    if (verifica === ev.text) zin.chat(ev.text);
                    else {
                        verifica = ev.text;
                        patron.chat('Mai trimite o data pentru siguranta :)');
                    }
                }
                else if (ev.text === '!balance')
                {
                    if (zin != null) zin.chat('!balance');
                    else patron.chat('Nu pot vorbi inca cu ZinGuard, el trebuie sa faca primul pas...');
                }
                else if (ev.text === '!reconnect')
                {
                    patron.chat('M-am dus!');
                    engine.log('[Darkness Functions] Deconectare bot... (!reconnect)');

                    setTimeout(() => {
                        backend.disconnect();
                    }, 500);

                    setTimeout(() => {
                        backend.connect();
                        engine.log('[Darkness Functions] Bot reconectat! (!reconnect)');
                    }, 3000);
                }
            }
        }
        else if (ev.client.uid() === identitatebot) // identiatea ZinGuard
        {
            var patron = null; // Clientul celui care are acces
            patron = backend.getClientByUID(identitate);
            
            zin = ev.client; // Client Zinguard, daca nu primesti mesaj de la el, nu poti sa-i scrii nici o comanda

            if (patron != null && (ev.text.indexOf('] Ai un total de') != -1 || ev.text.indexOf('Ai transferat') != -1)) patron.chat('ZinGuard: ' + ev.text); // daca ala cu acces este online + mesaj doar la intrare si transfer
        }
        else // altii
        {
            switch (ev.text)
            {
                case "darkness":
                    ev.client.chat('Darkness este o persoana exceptionala :)');
                    break;
                case "hardix":
                    ev.client.chat('Tandarei power :P');
                    break;
                case "senaris":
                    ev.client.chat('123');
                    break;
                case "planta":
                    ev.client.chat('Cand punem si noi curcile alea pe gratar?');
                    break;
                default: ev.client.chat('Nu te cunosc bro, imi pare rau :(');
            }
        }
    }

    if (interval < 0 || interval > 8)
    {
        engine.log('[Darkness Functions] Intervalul trebuie sa fie intre 0 (dezactivat) si 8 ore. Setat automat pe 0.');
        interval = 0;
        return;
    }

    // reconectare la 5 ore
    setInterval(() => {
        engine.log('[Darkness Functions] Deconectare bot...');
        backend.disconnect();

        setTimeout(() => {
            backend.connect();
            engine.log('[Darkness Functions] Bot reconectat!');
        }, 3000);
    }, interval * 3600000);
});