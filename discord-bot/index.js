import {
  Client,
  GatewayIntentBits,
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";

const GUILD_ID = "1192916761113268326";
const TICKET_PANEL_CHANNEL_ID = "1531015902429057085";
const STAFF_ROLE_ID = "1531015608404279296";
const CLAIM_ROLE_ID = "1531413502797811972";
const TICKET_PARENT_CATEGORY_ID = process.env.TICKET_PARENT_CATEGORY_ID || undefined;

const CATEGORIES = ["Generelt", "Donation", "Bande", "Firma", "Unban", "Kompensation", "CK", "Development"];

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder().setName("ticketpanel").setDescription("Post ticket-panelet i ticket-kanalen (kun staff)."),
  new SlashCommandBuilder()
    .setName("claimeddonation")
    .setDescription("Vis og markér indløste fordele for donations-koden i denne ticket (kun staff)."),
].map((c) => c.toJSON());

client.once("ready", async () => {
  client.user.setPresence({
    status: "online",
    activities: [{ name: "everix-chi.vercel.app", type: ActivityType.Watching }],
  });
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
    console.log("Slash commands registered.");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }

  const { error: dbCheckError } = await supabase.from("donation_codes").select("code").limit(1);
  if (dbCheckError) {
    console.error("Supabase connectivity check FAILED - donation code lookups will not work:", dbCheckError);
  } else {
    console.log("Supabase connectivity check OK.");
  }
});

client.on("error", (err) => console.error("Client error:", err));

function categoryRows() {
  const rows = [];
  for (let i = 0; i < CATEGORIES.length; i += 4) {
    const chunk = CATEGORIES.slice(i, i + 4);
    rows.push(
      new ActionRowBuilder().addComponents(
        chunk.map((cat) =>
          new ButtonBuilder().setCustomId(`ticket_open_${cat}`).setLabel(cat).setStyle(ButtonStyle.Secondary)
        )
      )
    );
  }
  return rows;
}

function closeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_close").setLabel("Luk ticket").setStyle(ButtonStyle.Danger)
  );
}

async function postTicketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("Opret en ticket")
    .setDescription("Vælg den kategori, din henvendelse handler om, herunder.")
    .setColor(0x437cfd);
  await channel.send({ embeds: [embed], components: categoryRows() });
}

async function hasOpenTicket(discordId, category) {
  const { data } = await supabase
    .from("tickets")
    .select("channel_id")
    .eq("opener_discord_id", discordId)
    .eq("category", category)
    .eq("status", "open")
    .maybeSingle();
  return data;
}

async function createTicketChannel(guild, opener, category) {
  return guild.channels.create({
    name: `${category.toLowerCase()}-${opener.username}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: TICKET_PARENT_CATEGORY_ID,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: opener.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: STAFF_ROLE_ID,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: guild.members.me.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });
}

async function openTicket(interaction, category, donationCode) {
  await interaction.deferReply({ ephemeral: true });
  const channel = await createTicketChannel(interaction.guild, interaction.user, category);

  await supabase.from("tickets").insert({
    category,
    opener_discord_id: interaction.user.id,
    channel_id: channel.id,
    donation_code: donationCode || null,
    status: "open",
  });

  if (donationCode) {
    const { data: codeRow } = await supabase
      .from("donation_codes")
      .select("tier")
      .eq("code", donationCode)
      .maybeSingle();
    const { data: perks } = await supabase.from("donation_code_perks").select("label, claimed").eq("code", donationCode);
    const perksText = (perks || []).map((p) => `${p.claimed ? "✅" : "⬜"} ${p.label}`).join("\n");

    const embed = new EmbedBuilder()
      .setTitle(`Donation - ${codeRow?.tier || "ukendt"}`)
      .setDescription(`Kode: **${donationCode}**\n\n${perksText}`)
      .setColor(0x437cfd);

    await channel.send({
      content: `<@${interaction.user.id}> - staff kan bruge \`/claimeddonation\` her til at markere, hvilke fordele der er givet.`,
      embeds: [embed],
      components: [closeRow()],
    });
  } else {
    await channel.send({
      content: `<@${interaction.user.id}> - tak for din henvendelse (**${category}**). Staff kigger med her.`,
      components: [closeRow()],
    });
  }

  await interaction.editReply({ content: `Din ticket er oprettet: <#${channel.id}>` });
}

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "ticketpanel") {
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
        await interaction.reply({ content: "Du har ikke adgang til denne kommando.", ephemeral: true });
        return;
      }
      const channel = await client.channels.fetch(TICKET_PANEL_CHANNEL_ID);
      await postTicketPanel(channel);
      await interaction.reply({ content: "Ticket-panel postet.", ephemeral: true });
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === "claimeddonation") {
      if (!interaction.member.roles.cache.has(CLAIM_ROLE_ID)) {
        await interaction.reply({ content: "Du har ikke adgang til denne kommando.", ephemeral: true });
        return;
      }

      const { data: ticket } = await supabase
        .from("tickets")
        .select("donation_code, category")
        .eq("channel_id", interaction.channelId)
        .maybeSingle();

      if (!ticket || ticket.category !== "Donation" || !ticket.donation_code) {
        await interaction.reply({
          content: "Denne kanal er ikke en Donation-ticket med en tilknyttet kode.",
          ephemeral: true,
        });
        return;
      }

      const { data: codeRow } = await supabase
        .from("donation_codes")
        .select("status, tier")
        .eq("code", ticket.donation_code)
        .maybeSingle();

      if (!codeRow || codeRow.status === "claimed") {
        await interaction.reply({ content: "Alle fordele for denne kode er allerede indløst.", ephemeral: true });
        return;
      }

      const { data: perks } = await supabase
        .from("donation_code_perks")
        .select("id, label")
        .eq("code", ticket.donation_code)
        .eq("claimed", false);

      if (!perks || !perks.length) {
        await interaction.reply({ content: "Alle fordele for denne kode er allerede indløst.", ephemeral: true });
        return;
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId(`claim_perks_select:${ticket.donation_code}`)
        .setPlaceholder("Vælg de fordele, der er givet i denne ticket")
        .setMinValues(1)
        .setMaxValues(perks.length)
        .addOptions(perks.map((p) => ({ label: p.label.slice(0, 100), value: p.id })));

      await interaction.reply({
        content: `Resterende fordele for **${ticket.donation_code}** (${codeRow.tier}):`,
        components: [new ActionRowBuilder().addComponents(select)],
        ephemeral: true,
      });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("ticket_open_")) {
      const category = interaction.customId.replace("ticket_open_", "");
      const existing = await hasOpenTicket(interaction.user.id, category);
      if (existing) {
        await interaction.reply({
          content: `Du har allerede en åben ticket i kategorien **${category}**: <#${existing.channel_id}>`,
          ephemeral: true,
        });
        return;
      }

      if (category === "Donation") {
        const modal = new ModalBuilder().setCustomId("donation_code_modal").setTitle("Indtast din kvitteringskode");
        const input = new TextInputBuilder()
          .setCustomId("donation_code_input")
          .setLabel("Kvitteringskode (fra tak-siden)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }

      await openTicket(interaction, category, null);
      return;
    }

    if (interaction.isButton() && interaction.customId === "ticket_close") {
      await interaction.deferReply();
      await supabase
        .from("tickets")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("channel_id", interaction.channelId);
      await interaction.editReply({ content: "Ticketten lukkes om 5 sekunder..." });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === "donation_code_modal") {
      const code = interaction.fields.getTextInputValue("donation_code_input").trim().toUpperCase();

      const { data: codeRow, error: codeError } = await supabase
        .from("donation_codes")
        .select("status")
        .eq("code", code)
        .maybeSingle();

      if (codeError) {
        console.error("donation_codes lookup failed:", codeError);
        await interaction.reply({
          content: "Der skete en teknisk fejl under opslag af koden. Prøv igen, eller kontakt en admin (tjek bottens konsol).",
          ephemeral: true,
        });
        return;
      }
      if (!codeRow) {
        await interaction.reply({ content: "Denne kode er ugyldig og eksisterer ikke.", ephemeral: true });
        return;
      }
      if (codeRow.status === "claimed") {
        await interaction.reply({ content: "Denne kode er allerede blevet brugt.", ephemeral: true });
        return;
      }

      const existing = await hasOpenTicket(interaction.user.id, "Donation");
      if (existing) {
        await interaction.reply({
          content: `Du har allerede en åben Donation-ticket: <#${existing.channel_id}>`,
          ephemeral: true,
        });
        return;
      }

      await openTicket(interaction, "Donation", code);
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("claim_perks_select:")) {
      const code = interaction.customId.split(":")[1];
      const perkIds = interaction.values;

      await supabase
        .from("donation_code_perks")
        .update({ claimed: true, claimed_at: new Date().toISOString(), claimed_by: interaction.user.id })
        .in("id", perkIds);

      const { data: remaining } = await supabase
        .from("donation_code_perks")
        .select("id")
        .eq("code", code)
        .eq("claimed", false);

      if (!remaining || !remaining.length) {
        await supabase.from("donation_codes").update({ status: "claimed", claimed_at: new Date().toISOString() }).eq("code", code);
      }

      await interaction.update({
        content:
          remaining && remaining.length
            ? `Markeret som givet. ${remaining.length} fordel(e) mangler stadig for **${code}**.`
            : `Alle fordele for **${code}** er nu indløst - koden kan ikke bruges igen.`,
        components: [],
      });
      return;
    }
  } catch (err) {
    console.error("Interaction error:", err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Der skete en fejl. Prøv igen.", ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
