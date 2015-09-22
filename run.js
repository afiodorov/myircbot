var config = require('./config.js');
var irc = require('irc');
var spawn = require('child_process').spawn;

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

});

bot.addListener('message',
  function(nick, to, text, message) {
    if(!message.args[1]) {
      return;
    }
    var messageTxt = message.args[1];
    var re = /:grep .*/;
    if (messageTxt.match(re)) {
      var args = messageTxt.split(' ');
      args.shift();
      args = ['-h'].concat(args).concat(config.logfiles);
      var grep = spawn('grep', args);
      console.log('running grep ' + args.join(' '));
      grep.stdout.on('data', function(data) {
        bot.say(nick, data.toString());
      });
    }
});

var onDisconnected = function() {
  process.exit();
};

process.on('SIGINT', function() {
  bot.disconnect(onDisconnected);
});
