'use strict';
/*jslint node: true*/

var config = require('./config.js');
var irc = require('irc');
var stdin = process.openStdin();
var fs = require('fs');
var evenHandler = require('./eventHandler.js');
var date = require('./date.js');

var bot = new irc.Client(config.server, config.botName, {
      userName: config.botName,
      realName: config.botName,
      password: config.password,
      port: 6697,
      localAddress: null,
      debug: false,
      showErrors: false,
      autoRejoin: true,
      autoConnect: true,
      channels: config.channels,
      secure: true,
      selfSigned: true,
      certExpired: true,
      floodProtection: false,
      floodProtectionDelay: 1000,
      sasl: true,
      stripColors: false,
      channelPrefixes: '&#',
      messageSplit: 512,
      encoding: 'UTF-8'
    }
);

/*jslint unparam: true*/
bot.addListener('registered', function(message) {
  evenHandler.setBot(bot);
});
/*jslint unparam: false*/

bot.addListener('message',
  function(nick, to, messageTxt) {
    if (messageTxt.match(/^:grep .*/)) {
      evenHandler.grep(nick, to, messageTxt);
    } else if (messageTxt.match(/^:links today$/)) {
      evenHandler.links(nick, to, messageTxt);
    } else if (messageTxt.match(/^:quote @?.*/)) {
      evenHandler.quote(nick, to, messageTxt);
    } else if (messageTxt.match(/^:[a-z]{2}->[a-z]{2} .*/)) {
      evenHandler.translate(nick, to, messageTxt);
    }
});

bot.addListener('message' + config.channels[0],
  function(from, message) {
    var logfile = '[' + date.getDateWithTime() + ']' + ' ' +
      from + ': ' + message + '\n';
    fs.appendFile(config.gitterLog, logfile, function(err) {
      if (err) {
        console.log('error: ' + err);
      }
     });
});

var onDisconnected = function() {
  process.exit();
};

bot.addListener('error', function(message) {
  console.log('error: ', message);
});

process.on('SIGINT', function() {
  bot.disconnect(onDisconnected);
});

stdin.addListener('data', function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then substring()
    bot.say(config.owner, d.toString().trim());
});
