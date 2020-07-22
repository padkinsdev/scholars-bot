var commands = new Map([
  ["get_role", role_assign],
  ["remove_role", role_remove]
]);

function resolve_command(message){
  let flags = []; // initialize some variables
  let args = [];
  let command = message.content.slice(2); // cut off the prefix
  let sections = command.split(' '); // sections[0] is the command name. the rest is additional flags/arguments

  command = sections[0];
  sections.splice(0);
  sections.forEach((item) => { // sort the flags and arguments into separate arrays
    if (item.startsWith("--")){
      flags.push(item);
    } else {
      args.push(item);
    }
  });
  if (commands.has(command)){
    //
  } else {
    message.channel.send("That's not a valid command!")
  }
}

function role_assign(user){
  return true;
}

function role_remove(user){
  return true;
}

exports.resolve_command = resolve_command;

