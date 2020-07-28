const config = require('./config.json');
const discord = require('discord.js');

function assign_role(message){
  let parts = argFlagSeparate(message.content);
  let failed = ""; // list of keywords that don't correspond to claimable roles
  parts.args.forEach((roleName, index) => {
    if (config["keyed_roles"][config["role_aliases"][roleName]]){
      //console.log("HERE");
      message.guild.roles.fetch(config["keyed_roles"][config["role_aliases"][roleName]])
      .then((role) => {
        return message.member.roles.add(role);
      })
      .catch((reason) => {
        console.error(`Error while assigning role assigning role for ${roleName}:\n${reason}`);
        failed = failed + roleName + "\n";
      });
    } else {
      failed = `${failed} ${roleName}\n`;
      if (index >= parts.args.length -1){
        if (failed !== ""){
          let embed = new discord.MessageEmbed()
          .setDescription(`Failed to assign roles for the following:\n${failed}`)
          .setColor(config["embedColor"])
          .setThumbnail(message.author.avatarURL())
          .setTitle("Role Claim");
          message.channel.send(embed);
        } else {
          message.channel.send("Assigned!");
        }
      }
    }
  });
}

function remove_role(message){
  let parts = argFlagSeparate(message.content);
  let failed = ""; // list of keywords that don't correspond to claimable roles
  parts.args.forEach((roleName, index) => {
    if (config["keyed_roles"][config["role_aliases"][roleName]]){
      message.guild.roles.fetch(config["keyed_roles"][config["role_aliases"][roleName]])
      .then((role) => {
        return message.member.roles.remove(role);
      })
      .catch((reason) => {
        console.error(`Error while assigning role assigning role for ${roleName}:\n${reason}`);
        failed = failed + roleName + "\n";
      });
    } else {
      // why doesn't this work?
      failed = `${failed} ${roleName}\n`;
      if (index >= parts.args.length -1){
        if (failed !== ""){
          let embed = new discord.MessageEmbed()
          .setDescription(`Failed to remove roles for the following:\n${failed}`)
          .setColor(config["embedColor"])
          .setThumbnail(message.author.avatarURL())
          .setTitle("Role Remove");
          message.channel.send(embed);
        } else {
          message.channel.send("Removed!");
        }
      }
    }
  });
}

function list_roles(message){
  let list = "Roles:\n**alias -> role**\n"
  for (key in config.role_aliases) {
    if (config.role_aliases.hasOwnProperty(key)) {
      list = `${list}\n${key} -> ${config.role_aliases[key]}`;
    }
  }
  let embed = new discord.MessageEmbed()
  .setDescription(list)
  .setColor(config["embedColor"])
  .setThumbnail(message.author.avatarURL())
  .setTitle("Role List");
  message.channel.send(embed);
}

// -----------------------

function argFlagSeparate(messageContent){
  let flags = []; // initialize some variables
  let args = [];
  let command = messageContent.slice(2); // cut off the prefix
  let sections = command.split(' '); // sections[0] is the command name. the rest is additional flags/arguments
  command = sections[0];
  sections.splice(0, 1);
  sections.forEach((item) => { // sort the flags and arguments into separate arrays
    //console.log(item);
    if (item.startsWith("--")){
      flags.push(item);
    } else {
      args.push(item);
    }
  });
  return {
    command: command,
    flags: flags,
    args: args
  }
}

function say_hello(message){
  return message.reply("hello!");
}

var commands = {
  hello: say_hello,
  assign: assign_role,
  remove: remove_role,
  list: list_roles
}

/*
var commands = new Map([ 
  ["get_role", role_assign],
  ["remove_role", role_remove],
  ["hello", say_hello]
]);
*/
// if the Map looks familiar, it's because I'm effectively using the closest equivalent to a Python dictionary that I know of, and mapping command names to functions
// this is effectively the same thing as what I did with Fae (funsies-bot)

function resolve_command(message){
  let parts = argFlagSeparate(message.content);
  if (commands[parts.command]){
  //if (commands.has(parts.command)){
    //console.log(typeof commands[parts.command]);
    return commands[parts.command];
  } else {
    message.channel.send("That's not a valid command!");
    return function(){
      return true;
    }
  }
}

exports.resolve_command = resolve_command;

