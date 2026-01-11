const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActivityType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} = require('discord.js');

const SUPPORT_ROLE_ID = '1460012376878223370';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// STATUS
client.once('ready', () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
  client.user.setPresence({
    status: 'dnd',
    activities: [{ name: 'Hounds.lol', type: ActivityType.Watching }]
  });
});

// =================== MESSAGE COMMANDS ===================
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // PAYMENTS
  if (message.content === '!payments') {
    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setTitle('Hounds.lol | Payments')
      .setDescription(`
<:61203blik:1459985128599195869> **Blik / Blik code**  
<:OIP:1459985149599944775> **Paypal**  
<:8715099:1460005344515194931> **Skrill** +5pln +opłata  
<:4887ltc:1460004610675576955> **LTC** +10%
`)
      .setImage('https://cdn.discordapp.com/attachments/1294002617122558033/1459998149975347402/payments.png')
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }

  // TICKET PANEL
  if (message.content === '!ticket') {
    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setTitle('Hounds.lol | Ticket')
      .setDescription('Wybierz kategorię poniżej')
      .setImage('https://cdn.discordapp.com/attachments/1459709935540633652/1460019447854268589/7b8f925a-b8fc-425f-a8d4-5d7e019dcbc9-md.jpg');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_menu')
      .setPlaceholder('Wybierz kategorię...')
      .addOptions(
        { label: 'Buy', value: 'buy' },
        { label: 'Support', value: 'support' },
        { label: 'Media', value: 'media' },
        { label: 'Reseller', value: 'reseller' },
        { label: 'Website Buy', value: 'website' }
      );

    const row = new ActionRowBuilder().addComponents(menu);
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // CHANGELOG PANEL
  if (message.content === '!changelog') {
    const button = new ButtonBuilder()
      .setCustomId('open_changelog_form')
      .setLabel('📝 Wypełnij changelog')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setTitle('Hounds.lol | Changelog Panel')
      .setDescription('Kliknij przycisk, aby dodać changelog.');

    await message.channel.send({ embeds: [embed], components: [row] });

    // USUWA KOMENDĘ
    setTimeout(() => message.delete(), 2000);
  }
});

// =================== INTERACTIONS ===================
client.on('interactionCreate', async interaction => {

  // TWORZENIE TICKETU
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
    const guild = interaction.guild;
    const user = interaction.user;
    const category = interaction.values[0];

    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: SUPPORT_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Zamknij ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `🎫 **Hounds.lol Ticket**  
Kategoria: **${category}**  
Użytkownik: ${user}

Opisz swój problem.`,
      components: [closeBtn]
    });

    return interaction.reply({ content: '✅ Ticket utworzony!', ephemeral: true });
  }

  // ZAMYKANIE TICKETU
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const channel = interaction.channel;
    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'ticket-logs');

    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages
      .reverse()
      .map(m => `[${m.author.tag}] ${m.content}`)
      .join('\n');

    if (logChannel) {
      await logChannel.send({
        files: [{
          attachment: Buffer.from(transcript, 'utf-8'),
          name: `${channel.name}.txt`
        }]
      });
    }

    await interaction.reply({ content: '🔒 Ticket zamknięty.', ephemeral: true });
    setTimeout(() => channel.delete(), 3000);
  }

  // OTWARCIE FORMULARZA CHANGELOG
  if (interaction.isButton() && interaction.customId === 'open_changelog_form') {
    const modal = new ModalBuilder()
      .setCustomId('changelog_modal')
      .setTitle('Hounds.lol Changelog');

    const title = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Tytuł')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const added = new TextInputBuilder()
      .setCustomId('added')
      .setLabel('Co DODANO? (🟢)')
      .setStyle(TextInputStyle.Paragraph);

    const fixed = new TextInputBuilder()
      .setCustomId('fixed')
      .setLabel('Co NAPRAWIONO? (🟠)')
      .setStyle(TextInputStyle.Paragraph);

    const removed = new TextInputBuilder()
      .setCustomId('removed')
      .setLabel('Co USUNIĘTO? (🔴)')
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder().addComponents(title),
      new ActionRowBuilder().addComponents(added),
      new ActionRowBuilder().addComponents(fixed),
      new ActionRowBuilder().addComponents(removed)
    );

    return interaction.showModal(modal);
  }

  // WYSYŁANIE CHANGELOGA
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'changelog_modal') {
    const title = interaction.fields.getTextInputValue('title');
    const added = interaction.fields.getTextInputValue('added');
    const fixed = interaction.fields.getTextInputValue('fixed');
    const removed = interaction.fields.getTextInputValue('removed');

    const embed = new EmbedBuilder()
      .setTitle(`📝 ${title}`)
      .setColor('#1e1e1e')
      .setDescription(`
${added ? `🟢 **Dodano:**\n${added}\n` : ''}
${fixed ? `🟠 **Naprawiono:**\n${fixed}\n` : ''}
${removed ? `🔴 **Usunięto:**\n${removed}\n` : ''}
`)
      .setImage('https://cdn.discordapp.com/attachments/1315741454437584916/1460033159755468842/3828650c-0ca4-430c-b033-9ab469eeb873-md.jpg')
      .setFooter({ text: 'Hounds.lol • Stay Secure' })
      .setTimestamp();

    const channel = interaction.guild.channels.cache.find(c => c.name === 'changelog');

    if (channel) {
      await channel.send({
        content: '@everyone',
        embeds: [embed]
      });
    }

    await interaction.reply({ content: '✅ Changelog wysłany!', ephemeral: true });

    // USUWA PANEL Z PRZYCISKIEM
    try {
      await interaction.message?.delete();
    } catch {}
  }
});

// TOKEN (UŻYJ ENV LUB WPISZ NA SZTYWNO)
client.login(process.env.TOKEN);
// LUB:
// client.login("TWÓJ_DISCORD_TOKEN");
