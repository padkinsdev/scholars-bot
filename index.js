const discord = require('discord.js');
const cmdhandle = require('./command_handling');
const roles = require('./roles.json');
//const emoji2unicode = require('emoji-unicode');

const client = new discord.Client({
  messageCacheMaxSize: roles["msgCacheSize"],
  disableMentions: "everyone"
});
const prefix = "s.";
const embed_color = "0xf26861";
//var messageCount = 0; // once this reaches the value in roles["msgCacheSize"], the message cache is cleared

client.on("ready", () => {
  client.user.setPresence({
    activity: {
      name: "a lecture",
      type: "WATCHING"
    },
    status: "online"
  })
  .then((presence) => {
    return cacheMessages();
  })
  .then((messageList) => {
    if (messageList.size == 0){
      let embed = new discord.MessageEmbed()
      .setDescription("Welcome to the unofficial College Park Scholars Discord server! React to this message using the guide below in order to claim the role associated with your specific program.\n\n:paintbrush: -> Arts\n:moneybag: -> Business, Society, and the Economy\n:evergreen_tree: -> Environgment, Technology, and the Economy\n:medical_symbol: -> Global Public Health\n:airplane: -> International Studies\n:scales: -> Justice and Legal Thought\n:otter: -> Life Sciences\n:film_frames: -> Media, Self, and Society\n:microphone2: -> Public Leadership\n:ringed_planet: -> Science, Discovery, and the Universe\n:microscope: -> Science and Global Change\n:computer: -> Science, Technology, and Society")
      .setColor(embed_color)
      .setThumbnail(client.user.avatarURL)
      .setTitle("Roles");
      client.guilds.resolve(roles["guildId"]).channels.resolve(roles["reactChannel"]).send(embed)
      .then((message) => {
        for (emoji in roles.role_id){
          //console.log(String.fromCodePoint("0x"+emoji));
          message.react(String.fromCodePoint("0x"+emoji)).catch((reason) => {
            // this is actually unnecessary because the next catch statement will catch any exceptions
            console.error(`Failed to react with ${emoji}:\n${reason}`);
          });
        }
      })
      .catch((reason) => {
        console.error('Error when sending reaction role embed:\n'+reason);
      });
    }
    //console.log(result);
    console.log("I'm ready for action!");
  });
});

client.on('message', (message) => {
  if (message.author.bot){
    return false;
  } else if (message.content.startsWith(prefix)){
    cmdhandle.resolve_command(message);
  }
});

client.on('messageReactionAdd', (reaction, user) => {
  //console.log(reaction.message.channel.messages.cache);
  //console.log(reaction.emoji.name.codePointAt(0));
  let emoji = reaction.emoji.name.codePointAt(0).toString(16);
  //console.log(emoji);
  if (roles.role_id.hasOwnProperty(emoji) && !(user.bot)){
    let roleToAssign = roles.role_id[emoji];
    let guild = reaction.message.guild;
    guild.members.fetch(user)
    .then((member) => {
      return member.roles.add(roleToAssign);
    })
    .then((member) => {
      reaction.message.channel.guild.channels.resolve(roles["confirmChannel"]).send(user.toString() + ", successfully assigned role!").catch((reason) => {
        console.log("Failed to send role assign confirmation message:\n"+reason);
      });
    })
    .catch((reason) => {
      console.log("Error when assigning role:\n" + reason);
      reaction.message.channel.guild.channels.resolve(roles["confirmChannel"]).send(user.toString() + ", I couldn't assign the requested role. Try it once more?").catch((reason) => {
        console.log("Failed to send role assign error message:\n"+reason);
      });
    });
  }
});

client.on('messageReactionRemove', (reaction, user) => {
  // the flip side of the messageReactionAdd event. Pretty much the same code, with some minor edits to reverse the process
  let emoji = reaction.emoji.name.codePointAt(0).toString(16);
  //console.log(emoji);
  if (roles.role_id.hasOwnProperty(emoji) && !(user.bot)){
    let roleToRemove = roles.role_id[emoji];
    let guild = reaction.message.guild;
    guild.members.fetch(user)
    .then((member) => {
      return member.roles.remove(roleToRemove);
    })
    .then((member) => {
      reaction.message.channel.guild.channels.resolve(roles["confirmChannel"]).send(user.toString() + ", successfully removed role!").catch((reason) => {
        console.log("Failed to send role remove confirmation message:\n"+reason);
      });
    })
    .catch((reason) => {
      console.log("Error when assigning role:\n" + reason);
      reaction.message.channel.guild.channels.resolve(roles["confirmChannel"]).send(user.toString() + ", I couldn't remove the requested role. Try it once more?").catch((reason) => {
        console.log("Failed to send role remove error message:\n"+reason);
      });
    });
  }
});

process.on('unhandledRejection', (err) => {
	console.error("Unhandled Rejection:\n"+err);
});

function cacheMessages(){
  return new Promise((resolveOut) => {
    let guild = client.guilds.resolve(roles["guildId"]);
    if (guild){
      let messages = guild.channels.resolve(roles["reactChannel"]).messages;
      if (messages){
        messages.fetch({limit: 10})
        .then((messageList) => {
          resolveOut(messageList);
        })
        .catch((reason) => {
          console.error("Failed to cache messages on launch:\n"+reason);
        });
      } else {
        if (guild.channels.resolve(roles["reactChannel"])){
          console.error('Channel exists in guild, but does not have a list of messages. Check that reactChannel in roles.json corresponds to the id of a text channel');
        } else {
          console.error('Channel id in roles.json is invalid');
        }
      }
    } else {
      console.error('Guild id in roles.json is invalid');
    }
  });
}

client.login(process.env.token);
