const Discord = require("discord.js");
const client = new Discord.Client({
  disableMentions: 'everyone'
})
require("dotenv").config()
require('discord-reply');
const { Database } = require("quickmongo");
const db = new Database(process.env.Mongo)
const randomstring = require("randomstring");
const disbut = require('discord-buttons');
require('discord-buttons')(client);
const { MessageMenu, MessageMenuOption } = require('discord-buttons');
const config = require(`./config.json`)
const prefix = config.prefix;

async function channelLog(embed) {
  if (!config.log_channel_id) return;
  let ch = await client.channels.cache.get(config.log_channel_id) || message.guild.channels.cache.find(channel => channel.name.match("log"));
  if (!ch) return console.log(`Config doldurulmalı.`)
  ch.send(embed)
}

client.on('ready', async () => {
  await console.clear()
  channelLog(`> API Bağlantısı kuruldu`)
  console.log(`Test destek talebi`)
});
client.on("message", async(message) =>{
  if (message.author.bot || !message.guild) return;
  let args = message.content.toLowerCase().split(" ");
  let command = args.shift()
  if (command == prefix + `yardım`) {
    let embed = new Discord.MessageEmbed()
      .setTitle(`Destek Komutları`)
      .setDescription(` \`${prefix}ticket-gönder\` - Ticketleri açmak için bir mesaj gönderin
\`${prefix}ticket-ekle\` - Belirli bir tickete üye ekler
\`${prefix}ticket-kaldır\` - Bir üyeyi belirli bir ticket kaldırır.
\`${prefix}ticket-sil\` - Belirli bir ticketi sil
\`${prefix}ticket-kapat\` - Belirli bir ticketi kapat
\`${prefix}ticket-aç\` - Belirli bir ticketi aç
\`${prefix}yetkili-ayarla\` - Destek yetkilisi ayarlar.
\`${prefix}kanal-ayarla\` - Destek kanalı ayarlar.`)
      .setColor("#ff8e00")
    message.lineReply({ embed: embed })
  }
  if (command == prefix + `ticket-ekle`) {
    if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.lineReply(`Error 3`);
    let args = message.content.split(' ').slice(1).join(' ');
    let channel = message.mentions.channels.first() || message.channel;
    const sfats = await db.get(`Staff_${message.guild.id}`)
    if (!sfats) return message.lineReply({ embed: { description: `Error 3`, color: "#ff8e00" } })
    if (await db.get(`ticket_${channel.id}_${message.guild.id}`)) {
      let member = message.mentions.members.first() || message.guild.members.cache.get(args || message.guild.members.cache.find(x => x.user.username === args || x.user.username === args));
      if (!member) return message.lineReply(`Kullanıcının idsini belirtin.`);
      try {
        channel.updateOverwrite(member.user, {
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
          ATTACH_FILES: true,
          READ_MESSAGE_HISTORY: true,
        }).then(() => {
          message.lineReply({ embed: { description: `${member} kullanıcısı başarıyla ${channel} biletine eklenmiştir.`, color: "#ff8e00" } });
        });
      }
      catch (e) {
        return message.channel.send(`Bir hata oluştu. Lütfen tekrar deneyin!`);
      }
    }
  }
  if (command == prefix + `ticket-kaldır`) {
    if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.lineReply(`Error 3`);
    let args = message.content.split(' ').slice(1).join(' ');
    let channel = message.mentions.channels.first() || message.channel;
    const sfats = await db.get(`Staff_${message.guild.id}`)
    if (!sfats) return message.lineReply({ embed: { description: `Error 3`, color: "#ff8e00" } })
    if (await db.get(`ticket_${channel.id}_${message.guild.id}`)) {
      let member = message.mentions.members.first() || message.guild.members.cache.get(args || message.guild.members.cache.find(x => x.user.username === args || x.user.username === args));
      if (!member) return message.lineReply(`Kullanıcının idsini belirtin.`);
      try {
        channel.updateOverwrite(member.user, {
          VIEW_CHANNEL: false,
        }).then(() => {
          message.lineReply({ embed: { description: `Başarıyla ${member} adlı üye ${channel} biletinden kaldırıldı.`, color: "#ff8e00" } });
        });
      }
      catch (e) {
        return message.channel.send(`Bir hata oluştu`);
      }
    }
  }
  if (command == prefix + 'ticket-sil') {
    let channel = message.mentions.channels.first() || message.channel;
    const sfats = await db.get(`Staff_${message.guild.id}`)
    if (!sfats) return message.lineReply({ embed: { description: `Error3`, color: "#ff8e00" } })
    if (await db.get(`ticket_${channel.id}_${message.guild.id}`)) {
      message.lineReply({ embed: { description: `Ticket 5 saniye sonra kalıcı olarak silenecektir.`, color: "#ff8e00" } })
      setTimeout(async () => {
          channel.delete()
      }, 5000)
    }
  }
  if (command == prefix + 'ticket-kapat') {
    let channel = message.mentions.channels.first() || message.channel;
    const sfats = await db.get(`Staff_${message.guild.id}`)
    if (!sfats) return message.lineReply({ embed: { description: `Error`, color: "#ff8e00" } })
    if (await db.get(`ticket_${channel.id}_${message.guild.id}`)) {
      let msg = await message.lineReply({ embed: { description: `Destek 5 saniye sonra kalıcı silinecektir.`, color: "#ff8e00" } })
      setTimeout(async () => {
        try {
          msg.delete()
          channel.send({ embed: { description: `Ticket tarafından kapatıldı <@!${message.author.id}>`, color: `YELLOW` } })
          let type = 'member'
          await Promise.all(channel.permissionOverwrites.filter(o => o.type === type).map(o => o.delete()));
          channel.setName(`pasif-ticket`)
        } catch (e) {
          return message.channel.send(`Bir hata oluştu. Lütfen tekrar deneyin!`);
        }
      }, 1000)
    }
  }
  if (command == prefix + 'yetkili-ayarla'){
    console.log(args)
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.lineReply(`:x: Bu komut gerektirir \`ADMINISTRATOR\` izini gerekir..`);
    if (args.length != 2) return message.lineReply({ embed: { description: `Lütfen bu komutla bir Yönetici rol idsi, *sonra* bir Moderatör rol idsi sağlayın! `, color: "#ff8e00" } })
    if (message.mentions.roles.length < 2 && !Number(args[0]) && !Number(args[1])) return message.lineReply({ embed: { description: `Lütfen bu komutla önce bir Yönetici rolünden (veya iD), *sonra* bir Moderatör rolünden (veya iD) bahsedin! `, color: "#ff8e00" } })
    const Admin = message.guild.roles.cache.get(args[0]);
    const Moder = message.guild.roles.cache.get(args[1]);
    await db.set(`Staff_${message.guild.id}.Admin`, Admin.id)
    await db.set(`Staff_${message.guild.id}.Moder`, Moder.id)
    message.react("✅")
  }
  if (command == prefix + 'kanal-ayarla'){
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.lineReply(`:x: Bu komut gerektirir \`ADMINISTRATOR\` izini gerekir..`);
    if (args.length != 2) return message.lineReply({ embed: { description: `Lütfen bu komutla bir kanal idsi, *sonra* bir kategori idsi belirtin! `, color: "#ff8e00" } })
    if (message.mentions.roles.length < 2 && !Number(args[0]) && !Number(args[1])) return message.lineReply({ embed: { description: `Lütfen bu komutla bir Log Kanalı (veya iD), *sonra* bir Kategori (veya iD) belirtin! `, color: "#ff8e00" } })
    const txt = message.guild.channels.cache.get(args[0]);
    const cat = message.guild.channels.cache.get(args[1]);
    if (txt.type !== "text") return message.channel.send("İlk giriş bir metin kanalı olmalıdır");
    if (cat.type !== "category") return message.channel.send("İkinci giriş bir metin kategorisi olmalıdır");
    await db.set(`Channels_${message.guild.id}.Log`, txt.id)
    await db.set(`Channels_${message.guild.id}.Cat`, cat.id)
    message.react("✅")
  }
  if (command == prefix + 'ticket-gönder' || command == prefix + 'ticket') {
    if (!message.member.hasPermission('ADMINISTRATOR')) return message.lineReply(`:x: Bu komut gerektirir \`ADMINISTRATOR\` izini gerekir..`);
    const sfats = await db.get(`Staff_${message.guild.id}`)
    const sfas = await db.get(`Channels_${message.guild.id}`)
    if (!sfats || sfats === null) return message.lineReply({ embed: { description: `Bu sunucunun önce personel rollerini ayarlaması gerekiyor! \`${prefix}yetkili-ayarla\``, color: "#ff8e00" } })
    if (!sfas || sfas === null) return message.lineReply({ embed: { description: `Bu sunucunun önce ticket kanallarını kurması gerekiyor! \`${prefix}kanal-ayarla\``, color: "#ff8e00" } })
    let idd = randomstring.generate({ length: 20 })
    let args = message.content.split(' ').slice(1).join(' ');
    if (!args) args = `Destek Talebi Test`
    let button1 = new MessageMenuOption()
    .setLabel('Kural ihlali')
    .setEmoji('⚠️')
    .setValue("men")
    .setDescription('Sunucumuzda kural ihlali yapanları bildirmek için kullanılır.')
    let button3 = new MessageMenuOption()
    .setLabel('Destek Talebi')
    .setEmoji('🎫')
    .setValue("hlp")
    .setDescription('Yetkili ekibimizde iletişime geçmek için kullanılır.')  
    let select = new MessageMenu()
    .setID(idd)
    .setPlaceholder('Bilet oluştur.')
    .setMaxValues(1)
    .setMinValues(1)
    .addOptions(button1, button3)
    let embed = new Discord.MessageEmbed()
      .setTitle(args)
      .setDescription("Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test \n \nLorem ipsum testLorem ipsum testLorem ipsum testLorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test")
      .setThumbnail("https://cdn.discordapp.com/attachments/871880950827589672/888088846460407858/image_processing20200510-10309-1d6koi6.png")
      .setTimestamp()
      .setColor('#ffae00')
      .setFooter(message.guild.name, message.guild.iconURL())
    let msg = await message.channel.send({ embed: embed, component: select }).then(async msg => {
      msg.pin()
      await db.set(`tickets_${idd}_${message.guild.id}`, {
        reason: args,
        msgID: msg.id,
        id: idd,
        options: [button1,  button3],
        guildName: message.guild.name,
        guildAvatar: message.guild.iconURL(),
        channelID: message.channel.id
      })
    })
  }
})


client.on('clickMenu', async (button) => {
  console.log(button.values)
  if (await db.get(`tickets_${button.id}_${button.message.guild.id}`)) {
    await button.reply.send(`Destek biletiniz oluşturuluyor. `, true)
    await db.math(`counts_${button.message.id}_${button.message.guild.id}`, `+`, 1)
    let count = await db.get(`counts_${button.message.id}_${button.message.guild.id}`)
    let channel;
    await button.clicker.fetch();
    if (button.values[0] === "men") { 
      button.guild.channels.create(`ihlal-${count}`, {
        permissionOverwrites: [
          {
            id: button.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
          {
            id: (await db.get(`Staff_${button.message.guild.id}.Admin`)),
            allow: ['VIEW_CHANNEL', `READ_MESSAGE_HISTORY`, `ATTACH_FILES`, `SEND_MESSAGES`,`MANAGE_MESSAGES`],
          },
          {
            id: button.clicker.user.id,
            allow: ['VIEW_CHANNEL', `READ_MESSAGE_HISTORY`, `ATTACH_FILES`, `SEND_MESSAGES`],
          },
        ], parent: (await db.get(`Channels_${button.message.guild.id}.Cat`)), position: 1, topic: `Ticket : <@!${button.clicker.user.id}>`, reason: "Tüm hakları MateDEV - 2021"
      }).then(async channel => {
        channel = channel
        await db.set(`ticket_${channel.id}_${button.message.guild.id}`, { count: count, ticket_by: button.clicker.user.id })
      
        await button.reply.edit(`
  **Desteğiniz oluşturuldu** <#${channel.id}>`, true)
        const embedticket = new Discord.MessageEmbed()
          .setTitle("TEST")
          .setThumbnail("https://cdn.discordapp.com/attachments/871880950827589672/888088846460407858/image_processing20200510-10309-1d6koi6.png")
        .setColor('#ffae00')
        .setDescription("Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test \n \nLorem ipsum testLorem ipsum testLorem ipsum testLorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test")
        let idd = randomstring.generate({ length: 25 })
        await db.set(`close_${button.clicker.user.id}`, idd)
        let bu1tton = new disbut.MessageButton()
          .setStyle('green')
          .setEmoji(`🔒`)
          .setLabel(`Çözüldü`)
          .setID(idd)
        channel.send(`👋 Merhaba <@!${button.clicker.user.id}>`, { embed: embedticket, component: bu1tton }).then(msg => {
    })
        })
      }
        if (button.values[0] === "hlp"){
          button.guild.channels.create(`destek-${count}`, {
            permissionOverwrites: [
              {
                id: button.guild.roles.everyone,
                deny: ['VIEW_CHANNEL'],
              },
              {
                id: (await db.get(`Staff_${button.message.guild.id}.Admin`)),
                allow: ['VIEW_CHANNEL', `READ_MESSAGE_HISTORY`, `ATTACH_FILES`, `SEND_MESSAGES`,`MANAGE_MESSAGES`],
              },
              {
                id: (await db.get(`Staff_${button.message.guild.id}.Moder`)),
                allow: ['VIEW_CHANNEL', `READ_MESSAGE_HISTORY`, `ATTACH_FILES`, `SEND_MESSAGES`,`MANAGE_MESSAGES`],
              },
              {
                id: button.clicker.user.id,
                allow: ['VIEW_CHANNEL', `READ_MESSAGE_HISTORY`, `ATTACH_FILES`, `SEND_MESSAGES`],
              },
            ], parent: (await db.get(`Channels_${button.message.guild.id}.Cat`)), position: 1, topic: `Ticket : <@!${button.clicker.user.id}>`, reason: "Tüm hakları MateDEV - 2021"
          }).then(async channel => {
            channel = channel
            await db.set(`ticket_${channel.id}_${button.message.guild.id}`, { count: count, ticket_by: button.clicker.user.id })
          
            await button.reply.edit(`
            **Desteğiniz oluşturuldu** <#${channel.id}>`, true)
            const embedticket = new Discord.MessageEmbed()
              .setTitle("TEST")
              .setColor('#ffae00')
              .setThumbnail("https://cdn.discordapp.com/attachments/871880950827589672/888088846460407858/image_processing20200510-10309-1d6koi6.png")    
              .setDescription("Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test \n \nLorem ipsum testLorem ipsum testLorem ipsum testLorem ipsum test Lorem ipsum test Lorem ipsum test Lorem ipsum test")
            let idd = randomstring.generate({ length: 25 })
            await db.set(`close_${button.clicker.user.id}`, idd)
            let bu1tton = new disbut.MessageButton()
              .setStyle('green')
              .setEmoji(`🔒`)
              .setLabel(`Çözüldü`)
              .setID(idd)
            channel.send(`👋 Merhaba <@!${button.clicker.user.id}>`, { embed: embedticket, component: bu1tton }).then(msg => {
            })
            })
        }
      }
    });
      client.on('clickButton', async (button1) => {
        await button1.clicker.fetch()
        let idd = randomstring.generate({ length: 25 })
        await db.set(`close_${button1.clicker.user.id}_sure`, idd)
        if (button1.id == (await db.get(`close_${button1.clicker.user.id}`))) {
          let bu0tton = new disbut.MessageButton()
            .setStyle(`green`)
            .setLabel(`Onaylıyorum`)
            .setID(idd)
          await button1.reply.send(`Aşağıdaki **Onaylıyorum** butonuna basarak ticketin kapatılmasını onaylayabilirsiniz.`, { component: bu0tton, ephemeral: true });
        }
      })
        client.on('clickButton', async (button) => {
          await button.clicker.fetch()
          if (button.id == (await db.get(`close_${button.clicker.user.id}_sure`))) {
          await button.reply.send(`Ticket 5 saniye sonra kapatılacaktır!`, true)   
            let ch = button.channel
            if (!ch) return;
            setTimeout(async () => {
              try {
                await ch.send({ embed: { description: `Kapatıldı <@!${button.clicker.user.id}>`, color: `YELLOW` } });
                let type = 'member'
                await Promise.all(ch.permissionOverwrites.filter(o => o.type === type).map(o => o.delete()));
                ch.setName(`closed-${button.clicker.user.username}`)
              } catch (e) {
                return button.channel.send(`Bir hata oluştu. Lütfen tekrar deneyin!`);
              }
            }, 4000)
          }
        })

        client.on('guildMemberAdd', member => {
          let rol = "887886283475673130"
        
          member.roles.add(rol)
     })

client.login("TOKEN");
