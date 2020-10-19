registerPlugin({
    name: 'Darkness Away',
    version: '0.0.1',
    description: 'Pune-ma away.',
    author: 'Darkness.',
    vars: [{
        name: 'reason',
        title: 'Motiv Away',
        type: 'string'
    }]
}, (_, { reason }) => {
    var backend = require('backend');

    if (reason.length > 0) backend.setAway(true, reason);
});