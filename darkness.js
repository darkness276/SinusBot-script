registerPlugin({
    name: 'Darkness Functions',
    version: '0.4.6',
    description: 'Functii pentru ts.indungi.ro. Made with 💚 by Darkness.',
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
}, (_, { identitate, identitatebot, interval }, meta) => {

    // librarii
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');

    var zin = null; // Client ZinGuard
    var verifica = null; // trimite de 2 ori !transfer pentru a ma asigura

    // privilegii
    const ENQUEUE           = 1 << 13;
    const SKIP_QUEUE        = 1 << 14;
    const ADMIN_QUEUE       = 1 << 15;
    const PLAYBACK          = 1 << 12;
    /*const START_STOP        = 1 <<  8;
    const EDIT_BOT_SETTINGS = 1 << 16;
    const LOGIN             = 1 <<  0;
    const UPLOAD_FILES      = 1 <<  2;
    const DELETE_FILES      = 1 <<  3;
    const EDIT_FILES        = 1 <<  4;
    const CREATE_AND_DELETE_PLAYLISTS = 1 << 5;
    const EDIT_PLAYLISTS    = 1 <<  7;
    const EDIT_INSTANCES    = 1 << 17;
    const EDIT_USERS        = 1 <<  9;*/

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
                else if (ev.text.indexOf('!adduser') != -1) // identitate, nume
                {
                    let cuvinte = ev.text.split(" ");
                    if (cuvinte[0] !== '!adduser') return;
                    if (cuvinte[1] == null || cuvinte[2] == null) return ev.client.chat('Trebuie sa folosesti !adduser [identitate] [nume]');
                    if (cuvinte[1].length != 28 || cuvinte[1][27] !== '=') return ev.client.chat('Formatul identitatii este invalid!');
                    let user = engine.addUser(cuvinte[2]); // adaugare user
                    if (user)
                    {
                        // setare identitate
                        user.setUid(cuvinte[1]);
                        // adaugare accese pentru muzica
                        user.addPrivilege(ENQUEUE);
                        user.addPrivilege(SKIP_QUEUE);
                        user.addPrivilege(ADMIN_QUEUE);
                        user.addPrivilege(PLAYBACK);
                        ev.client.chat('Userul [URL=client://0/'+cuvinte[1]+'~'+cuvinte[2]+']'+cuvinte[2]+'[/URL] a fost adaugat cu succes!');
                    }
                    else ev.client.chat('Nu s-a putut crea un user cu acest nume.');
                }
                else if (ev.text.indexOf('!removeuser') != -1) // nume
                {
                    let cuvinte = ev.text.split(" ");
                    if (cuvinte[0] !== '!removeuser') return;
                    if (cuvinte[1] == null) return ev.client.chat('Trebuie sa folosesti !removeuser [nume]');
                    let user = engine.getUserByName(cuvinte[1]);
                    if (user)
                    {
                        ev.client.chat('Userul [URL=client://0/'+user.uid()+'~'+user.name()+']'+user.name()+'[/URL] a fost sters cu succes!');
                        user.delete();
                    }
                    else ev.client.chat('User inexistent.');
                }
                else if (ev.text === '!users') // lista cu userii
                {
                    ev.client.chat('Useri inregistrati:');
                    var users = engine.getUsers();
                    var msg = '';
                    users.forEach(u => {
                        msg += '[URL=client://0/'+u.uid()+'~'+u.name()+']'+u.name()+'[/URL]\n';
                    });
                    ev.client.chat(msg);
                }
                else if (ev.text === '!version' || ev.text === '!v')
                {
                    patron.chat('Darkness Functions v' + meta.version + ' by [URL=client://0/ooDBgS+7EIE4Nr3wx9AB76fcbx8=~Darkness]Darkness.[/URL] 💚');
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
                // 1234
                case "!version":
                    ev.client.chat('Darkness Functions v' + meta.version + ' by [URL=client://0/ooDBgS+7EIE4Nr3wx9AB76fcbx8=~Darkness]Darkness.[/URL] 💚');
                    break;
                case "!v":
                    ev.client.chat('Darkness Functions v' + meta.version + ' by [URL=client://0/ooDBgS+7EIE4Nr3wx9AB76fcbx8=~Darkness]Darkness.[/URL] 💚');
                    break;
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

    // reconectare la interval setat
    if (interval > 0)
    {
        setInterval(() => {
            engine.log('[Darkness Functions] Deconectare bot...');
            backend.disconnect();

            setTimeout(() => {
                backend.connect();
                engine.log('[Darkness Functions] Bot reconectat!');
            }, 3000);
        }, interval * 3600000);
    }
});