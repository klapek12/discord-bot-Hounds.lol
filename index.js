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

  // ===== TEXT MODAL (CZYSTA KOLUMNA / PREMIUM) =====
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('text_modal_')) {
    const text = interaction.fields.getTextInputValue('text');
    const ping = interaction.customId.includes('_true_');
    const panelId = interaction.customId.split('_').pop();

    const embed = new EmbedBuilder()
      .setColor('#808080')
      .addFields({
        name: '⠀', // NIC SIĘ NIE WYŚWIETLA
        value: `**${text}**`
      })
      .setFooter({
        text: `𝓗𝓸𝓾𝓷𝓭𝓼.𝓵𝓸𝓵 • ${new Date().toLocaleDateString('pl-PL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}`
      });

    await interaction.channel.send({
      content: ping ? '@everyone' : null,
      embeds: [embed]
    });

    try {
      const cmdId = client.textPanelData.get(panelId);
      await interaction.channel.messages.fetch(panelId).then(m => m.delete());
      await interaction.channel.messages.fetch(cmdId).then(m => m.delete());
      client.textPanelData.delete(panelId);
    } catch {}

    return interaction.reply({ content: '✅ Wysłano', ephemeral: true });
  }
});

// TOKEN
client.login(process.env.TOKEN);
// client.login("TWÓJ_DISCORD_TOKEN");
