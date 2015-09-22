var config = require('./config.js');
var irc = require('irc');

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

bot.addListener('registered', function(message) {
  console.log(message);
  bot.say('afiodorov', 'First bot ever');
});

var onDisconnected = function() {
  process.exit();
};

process.on('SIGINT', function() {
  bot.disconnect(onDisconnected);
});
