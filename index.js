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
    activities: [{ name: 'Scared Hounds', type: ActivityType.Playing }]
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
    setTimeout(() => message.delete(), 2000);
  }

  // =================== !TEXT ===================
  if (message.content === '!text') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('text_ping_yes')
        .setLabel('Ping: TAK')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('text_ping_no')
        .setLabel('Ping: NIE')
        .setStyle(ButtonStyle.Secondary)
    );

    const panel = await message.channel.send({
      content: 'Czy chcesz wysłać wiadomość z pingiem?',
      components: [row]
    });

    client.textPanelData ??= new Map();
    client.textPanelData.set(panel.id, message.id);
  }
});

// =================== INTERACTIONS ===================
client.on('interactionCreate', async interaction => {

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

  // ===== TEXT BUTTONS =====
  if (interaction.isButton() && interaction.customId.startsWith('text_ping_')) {
    const ping = interaction.customId === 'text_ping_yes';

    const modal = new ModalBuilder()
      .setCustomId(`text_modal_${ping}_${interaction.message.id}`)
      .setTitle('Wyślij wiadomość');

    const input = new TextInputBuilder()
      .setCustomId('text')
      .setLabel('Treść wiadomości')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // ===== TEXT MODAL =====
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('text_modal_')) {
    const text = interaction.fields.getTextInputValue('text');
    const ping = interaction.customId.includes('_true_');
    const panelId = interaction.customId.split('_').pop();

    await interaction.channel.send({
      content: `${ping ? '@everyone\n' : ''}${text}`
    });

    try {
      const cmdId = client.textPanelData.get(panelId);
      await interaction.channel.messages.fetch(panelId).then(m => m.delete());
      await interaction.channel.messages.fetch(cmdId).then(m => m.delete());
      client.textPanelData.delete(panelId);
    } catch {}

    return interaction.reply({ content: '✅ Wysłano', ephemeral: true });
  }

  // ===== CHANGELOG =====
  if (interaction.isButton() && interaction.customId === 'open_changelog_form') {
    const modal = new ModalBuilder()
      .setCustomId('changelog_modal')
      .setTitle('Hounds.lol Changelog');

    const title = new TextInputBuilder().setCustomId('title').setLabel('Tytuł').setStyle(TextInputStyle.Short).setRequired(true);
    const added = new TextInputBuilder().setCustomId('added').setLabel('Co DODANO?').setStyle(TextInputStyle.Paragraph);
    const fixed = new TextInputBuilder().setCustomId('fixed').setLabel('Co NAPRAWIONO?').setStyle(TextInputStyle.Paragraph);
    const removed = new TextInputBuilder().setCustomId('removed').setLabel('Co USUNIĘTO?').setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder().addComponents(title),
      new ActionRowBuilder().addComponents(added),
      new ActionRowBuilder().addComponents(fixed),
      new ActionRowBuilder().addComponents(removed)
    );

    return interaction.showModal(modal);
  }
});

// TOKEN
client.login(process.env.TOKEN);
// client.login("TWÓJ_DISCORD_TOKEN");
