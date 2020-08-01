const discord = require('discord.js');
const cmdhandle = require('./command_handling');
const config = require('./config.json');
const utils = require('./utils.js');
//const emoji2unicode = require('emoji-unicode');

const client = new discord.Client({
  messageCacheMaxSize: config["msgCacheSize"],
  disableMentions: "everyone"
});
const prefix = "s.";

client.on("ready", () => {
  client.user.setPresence({
    activity: {
      name: "a lecture",
      type: "WATCHING"
    },
    status: "online"
  })
  .then((presence) => {
    return utils.cacheMessages(client);
  })
  .then((messageList) => {
    if (messageList.size == 0){
      let embed = new discord.MessageEmbed()
      .setDescription("Welcome to the unofficial College Park Scholars Discord server! React to this message using the guide below in order to claim the role associated with your specific program.\n\n:paintbrush: -> Arts\n:moneybag: -> Business, Society, and the Economy\n:evergreen_tree: -> Environgment, Technology, and the Economy\n:medical_symbol: -> Global Public Health\n:airplane: -> International Studies\n:scales: -> Justice and Legal Thought\n:otter: -> Life Sciences\n:film_frames: -> Media, Self, and Society\n:microphone2: -> Public Leadership\n:ringed_planet: -> Science, Discovery, and the Universe\n:microscope: -> Science and Global Change\n:computer: -> Science, Technology, and Society")
      .setColor(config["embedColor"])
      .setThumbnail(client.user.avatarURL())
      .setTitle("Roles");
      client.guilds.resolve(config["guildId"]).channels.resolve(config["reactChannel"]).send(embed)
      .then((message) => {
        for (emoji in config.role_id){
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
  })
  .catch((reason) => {
    console.error("Failed to grab message list:\n"+reason);
  })
});

client.on('message', (message) => {
  if (message.author.bot){
    return false;
  } else if (message.content.startsWith(prefix)){
    let func = cmdhandle.resolve_command(message);
    if (typeof func == "function"){
      if (func.length == 0){
        return true;
      } else {
        func(message);
      }
    } else {
      console.log(`Non-function returned from cmdhandle.resolve_command: ${func}`);
    }
  }
});

client.on('messageReactionAdd', (reaction, user) => {
  //console.log(reaction.message.channel.messages.cache);
  //console.log(reaction.emoji.name.codePointAt(0));
  let emoji = reaction.emoji.name.codePointAt(0).toString(16);
  let conflict;
  //console.log(emoji);
  if (config.role_id.hasOwnProperty(emoji) && !(user.bot) && reaction.message.channel.id == config["reactChannel"]){
    let roleToAssign = config.role_id[emoji];
    let guild = reaction.message.guild;
    guild.members.fetch(user)
    .then((member) => {
      let exclusive = utils.exclusive(member, roleToAssign, guild);
      conflict = exclusive.conflicting_role;
      if (exclusive.pass){
        return member.roles.add(roleToAssign);
      } else {
        throw "not exclusive"
      }
    })
    .then((member) => {
      utils.getConfirmChannelFromReaction(reaction).send(user.toString() + ", successfully assigned role!").catch((reason) => {
        console.log("Failed to send role assign confirmation message:\n"+reason);
      });
    })
    .catch((reason) => {
      if (reason != "not exclusive"){
        console.log("Error when assigning role:\n" + reason);
        utils.getConfirmChannelFromReaction(reaction).send(user.toString() + ", I couldn't assign the requested role. Try it once more?").catch((reason) => {
          console.log("Failed to send role assign error message:\n"+reason);
        });
      } else {
        utils.getConfirmChannelFromReaction(reaction).send(user.toString() + ", the role you are trying to get is not compatible with the following role(s):\n"+conflict+"\n\nPlease get rid of the conflicting role if you want to claim the role you just tried to claim.").catch((reason) => {
          console.log("Failed to send 'not exclusive' role assign error message:\n"+reason);
        });
      }
    });
  } else {
    // keeps users from clogging up the message with random reactions
    reaction.remove()
    .catch((reason) => {
      console.error("Failed to remove reaction:\n"+reason)
    });
  }
});

client.on('messageReactionRemove', (reaction, user) => {
  // the flip side of the messageReactionAdd event. Pretty much the same code, with some minor edits to reverse the process
  let emoji = reaction.emoji.name.codePointAt(0).toString(16);
  //console.log(emoji);
  if (config.role_id.hasOwnProperty(emoji) && !(user.bot) && reaction.message.channel.id == config["reactChannel"]){
    let roleToRemove = config.role_id[emoji];
    let guild = reaction.message.guild;
    guild.members.fetch(user)
    .then((member) => {
      return member.roles.remove(roleToRemove);
    })
    .then((member) => {
      utils.getConfirmChannelFromReaction(reaction).send(user.toString() + ", successfully removed role!").catch((reason) => {
        console.log("Failed to send role remove confirmation message:\n"+reason);
      });
    })
    .catch((reason) => {
      console.log("Error when assigning role:\n" + reason);
      utils.getConfirmChannelFromReaction(reaction).send(user.toString() + ", I couldn't remove the requested role. Try it once more?").catch((reason) => {
        console.log("Failed to send role remove error message:\n"+reason);
      });
    });
  }
});

client.on('guildMemberAdd', (member) => {
  if (!(member.user.bot)){
    let embed = new discord.MessageEmbed()
    .setThumbnail(member.user.avatarURL())
    .setColor(config["embedColor"])
    .setTitle(`Welcome, ${member.user.username}`)
    .setDescription("Welcome to the unofficial College Park Scholars Discord server, "+member.toString()+". Be sure to check out <#"+config['reactChannel']+"> to claim the role associated with your College Park Scholars program!");
    utils.getWelcomeChannelFromMember(member).send(embed);
    member.roles.add(config["genericRole"]) // this is the @Student role
    .catch((reason) => {
      console.log("Failed to auto-assign generic role:"+reason);
    });
  } else {
    let embed = new discord.MessageEmbed()
    .setThumbnail(member.user.avatarURL())
    .setColor(config["embedColor"])
    .setTitle(`Welcome, ${member.user.username}`)
    .setDescription("A new bot? More competition, I see :eyes:");
    utils.getWelcomeChannelFromMember(member).send(embed);
  }
});

client.on('guildMemberRemove', (member) => {
  if (!(member.user.bot)){
    let embed = new discord.MessageEmbed()
    .setThumbnail(member.user.avatarURL())
    .setColor(config["embedColor"])
    .setTitle(`Welcome, ${member.user.username}`)
    .setDescription(`${member} has left. They will be missed.`);
    utils.getWelcomeChannelFromMember(member).send(embed);
  } else {
    let embed = new discord.MessageEmbed()
    .setThumbnail(member.user.avatarURL())
    .setColor(config["embedColor"])
    .setTitle(`Welcome, ${member.user.username}`)
    .setDescription(`${member} has left. Keep this a secret, guys, but they were kind of cute :flushed: :point_right: :point_left:`);
    utils.getWelcomeChannelFromMember(member).send(embed);
  }
});

process.on('unhandledRejection', (err) => {
	console.error("Unhandled Rejection:\n"+err);
});

client.login(process.env.token);
