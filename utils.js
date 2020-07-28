// Utility functions to make the code more readable
const discord = require('discord.js');
const config = require("./config.json");

function cacheMessages(client){
  return new Promise((resolveOut, rejectOut) => {
    let guild = client.guilds.resolve(config["guildId"]);
    if (guild){
      let messages = guild.channels.resolve(config["reactChannel"]).messages;
      if (messages){
        messages.fetch({limit: 10})
        .then((messageList) => {
          resolveOut(messageList);
        })
        .catch((reason) => {
          console.error("Failed to cache messages on launch:\n"+reason);
          rejectOut("Message caching failed");
        });
      } else {
        if (guild.channels.resolve(config["reactChannel"])){
          console.error('Channel exists in guild, but does not have a list of messages. Check that reactChannel in config.json corresponds to the id of a text channel');
          rejectOut("Channel does not have 'messages' property");
        } else {
          console.error('Channel id in config.json is invalid');
          rejectOut("Invalid channel id");
        }
      }
    } else {
      console.error('Guild id in config.json is invalid');
      rejectOut("Invalid guild id");
    }
  });
}

function getConfirmChannelFromReaction(reaction){
  return reaction.message.channel.guild.channels.resolve(config["confirmChannel"]);
}

function getWelcomeChannelFromMember(member){
  return member.guild.channels.resolve(config["welcomeChannel"]);
}

function checkRoleExclusivity(member, role, guild){
  if (typeof role == "string"){
    if (!(/^\d+$/.test(role))){
      console.error(`Value ${role} is not numeric`);
      return false;
    }
    /* else {
      guild.roles.fetch()
      .then((roles) => {
        for (item in roles.cache){
          if (item.name == role){
            role = item;
          }
        }
        role = null;
      })
      .catch((reason) => {
        console.error(`Value ${role} is of valid type, but does not correspond to any role name in the passed guild`);
        role = null;
      });
    }*/
  } else if (typeof role == "number"){
    role = role.toString();
  } else if (role instanceof discord.Role){
    // continue
  } else { //if (!(role instanceof discord.Role)){
    console.error(`Value ${role} which was passed to checkRoleExclusivity(), is not an accepted type (discord.Role, number, or string)`);
    return false;
  }
}

exports.cacheMessages = cacheMessages;

exports.getConfirmChannelFromReaction = getConfirmChannelFromReaction;

exports.getWelcomeChannelFromMember = getWelcomeChannelFromMember;