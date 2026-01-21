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

    setTimeout(() => message.delete(), 2000);
  }

  // =================== NEW TEXT PANEL ===================
  if (message.content === '!text') {
    const menu = new StringSelectMenuBuilder()
      .setCustomId('ping_select')
      .setPlaceholder('Czy chcesz ping?')
      .addOptions(
        { label: 'Tak', value: 'yes' },
        { label: 'Nie', value: 'no' }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setDescription('Wybierz czy chcesz ping, a potem wpisz tekst.');

    await message.channel.send({ embeds: [embed], components: [row] });
    setTimeout(() => message.delete(), 1000);
  }
});

// =================== INTERACTIONS ===================
client.on('interactionCreate', async interaction => {

  // =================== PING SELECT ===================
  if (interaction.isStringSelectMenu() && interaction.customId === 'ping_select') {
    const ping = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`text_modal_${ping}`)
      .setTitle('Wpisz tekst');

    const textInput = new TextInputBuilder()
      .setCustomId('text')
      .setLabel('Wpisz text')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(textInput));

    return interaction.showModal(modal);
  }

  // =================== SEND TEXT ===================
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('text_modal_')) {
    const pingOption = interaction.customId.split('_')[2];
    const text = interaction.fields.getTextInputValue('text');

    const embed = new EmbedBuilder()
      .setColor('#808080')
      .setDescription(text);

    await interaction.channel.send({
      content: pingOption === 'yes' ? '@everyone' : null,
      embeds: [embed]
    });

    await interaction.reply({ content: '✅ Wysłano!', ephemeral: true });

    try {
      await interaction.message?.delete();
    } catch {}
  }

  // =================== RESZTA TWOJEGO KODU ===================
  // (ticket, changelog itd. zostają bez zmian – Discord sam je obsłuży)
});

// TOKEN
client.login(process.env.TOKEN);
// LUB:
// client.login("TWÓJ_DISCORD_TOKEN");
