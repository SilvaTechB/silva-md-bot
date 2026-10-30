'use strict';

const axios = require('axios');
const { jidNormalizedUser, downloadMediaMessage } = require('@whiskeysockets/baileys');
let globalLidMapping;
try { ({ globalLidMapping } = require('@whiskeysockets/baileys/lib/Utils/lid-mapping')); } catch {}

const truecallerCache = new Map();

async function lookupTruecaller(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (truecallerCache.has(cleaned)) return truecallerCache.get(cleaned);

    const endpoints = [
        `https://api.truecaller.com/v2/search?q=${cleaned}&countryCode=&type=4`,
        `https://search5-noneu.truecaller.com/v2/search?q=${cleaned}&countryCode=&type=4`,
    ];

    for (const url of endpoints) {
        try {
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Truecaller/13.0.3 (Android;13)' },
                timeout: 5000,
            });
            if (data?.data?.[0]?.name) {
                const name = data.data[0].name;
                const fullName = [name.first, name.last].filter(Boolean).join(' ').trim();
                if (fullName) {
                    truecallerCache.set(cleaned, fullName);
                    return fullName;
                }
            }
        } catch {}
    }

    truecallerCache.set(cleaned, null);
    return null;
}

function getContactName(jid) {
    if (!global.pushNameCache) return null;
    const name = global.pushNameCache.get(jid);
    if (name) return name;
    const norm = jidNormalizedUser(jid);
    if (norm !== jid) {
        const n2 = global.pushNameCache.get(norm);
        if (n2) return n2;
    }
    const bare = jid.split(':')[0].split('@')[0];
    if (/^\d+$/.test(bare)) {
        const phoneJid = bare + '@s.whatsapp.net';
        const n3 = global.pushNameCache.get(phoneJid);
        if (n3) return n3;
    }
    return null;
}

function cleanPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 7 ? digits : null;
}

function lidToPhone(lid) {
    if (!lid) return null;

    if (lid.endsWith('@s.whatsapp.net')) {
        return cleanPhone(lid);
    }

    if (lid.endsWith('@lid')) {
        const norm = lid.split(':')[0] + '@lid';
        const bareNorm = lid.split(':')[0].split('@')[0];

        if (global.lidPhoneCache) {
            const cached = global.lidPhoneCache.get(lid) || global.lidPhoneCache.get(norm) || global.lidPhoneCache.get(bareNorm);
            const phone = cleanPhone(cached);
            if (phone) return phone;
        }

        if (global.lidJidMap) {
            const mapped = global.lidJidMap.get(lid) || global.lidJidMap.get(norm);
            const phone = cleanPhone(mapped);
            if (phone) return phone;
        }

        if (globalLidMapping?.getPnFromLid) {
            const mapped = globalLidMapping.getPnFromLid(lid) || globalLidMapping.getPnFromLid(norm);
            const phone = cleanPhone(mapped);
            if (phone) return phone;
        }
    }

    return cleanPhone(lid);
}

function escapeVcf(str) {
    return (str || '').replace(/[\\;,]/g, c => '\\' + c).replace(/\n/g, '\\n');
}

function buildVcard(name, phone, metadata = {}) {
    const parts = name.split(/\s+/);
    const firstName = parts[0] || name;
    const lastName = parts.slice(1).join(' ') || '';

    return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVcf(name)}`,
        `N:${escapeVcf(lastName)};${escapeVcf(firstName)};;;`,
        `TEL;TYPE=CELL:+${phone}`,
        metadata.username ? `X-WHATSAPP-USERNAME:${escapeVcf(metadata.username)}` : '',
        metadata.jid ? `X-WHATSAPP-JID:${escapeVcf(metadata.jid)}` : '',
        'END:VCARD',
    ].filter(Boolean).join('\n');
}

function resolveAndName(participant, resolveLid) {
    const participantId = typeof participant === 'string' ? participant : (participant?.id || participant?.lid || '');
    let phone = cleanPhone(participant?.phoneNumber || participant?.phone || participant?.pn) || lidToPhone(participantId);
    if (!phone && resolveLid) {
        const resolved = resolveLid(participantId);
        if (resolved && resolved !== participantId) {
            phone = lidToPhone(resolved);
        }
    }

    let name = getContactName(participantId);
    if (!name) {
        const norm = participantId.split(':')[0] + '@lid';
        name = getContactName(norm);
    }
    if (!name && phone) {
        name = getContactName(phone + '@s.whatsapp.net');
    }

    return { phone, name };
}

module.exports = {
    commands: ['vcfgen', 'savecontacts', 'exportvcf', 'contactsave', 'vcfgroup', 'groupvcf', 'vcfnumber', 'vcfread', 'readvcf', 'vcfview'],
    description: 'Generate VCF contact files from WhatsApp group metadata',
    usage: '.groupvcf | .vcfgroup | .vcfgen | .vcfnumber 2547XXXXXXXX | .vcfread (reply to vcf)',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo, isGroup, groupMetadata, resolveLid, isAdmin, isOwner } = ctx;
        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        if (['vcfread', 'readvcf', 'vcfview'].includes(rawCmd)) {
            const msg = message.message || {};
            const quoted = msg.extendedTextMessage?.contextInfo?.quotedMessage || {};
            const docMsg = quoted.documentMessage
                || quoted.documentWithCaptionMessage?.message?.documentMessage
                || msg.documentMessage
                || null;

            if (!docMsg) {
                return sock.sendMessage(jid, {
                    text: [
                        `📇 *VCF Reader*`,
                        ``,
                        `Read and display contacts from a .vcf file.`,
                        ``,
                        `*How to use:*`,
                        `1. Send or receive a .vcf file in the chat`,
                        `2. Reply to that file with \`.vcfread\``,
                        `3. The bot will display all contacts inside it`,
                        ``,
                        `_Aliases: .readvcf, .vcfview_`,
                    ].join('\n'),
                    contextInfo
                }, { quoted: message });
            }

            let buffer;
            try {
                const stanzaId = msg.extendedTextMessage?.contextInfo?.stanzaId;
                const participant = msg.extendedTextMessage?.contextInfo?.participant;
                const quotedKey = stanzaId
                    ? { remoteJid: jid, id: stanzaId, fromMe: false, participant }
                    : message.key;

                buffer = await downloadMediaMessage(
                    { key: quotedKey, message: { documentMessage: docMsg } },
                    'buffer', {}
                );
            } catch {
                try {
                    const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                    const stream = await downloadContentFromMessage(docMsg, 'document');
                    const chunks = [];
                    for await (const chunk of stream) chunks.push(chunk);
                    buffer = Buffer.concat(chunks);
                } catch {
                    return sock.sendMessage(jid, {
                        text: '❌ Could not download the VCF file. Try sending it again and replying with `.vcfread`.',
                        contextInfo
                    }, { quoted: message });
                }
            }

            const vcfText = buffer.toString('utf8');
            const cards = vcfText.split(/(?=BEGIN:VCARD)/i).filter(c => c.trim().length > 0);

            if (!cards.length) {
                return sock.sendMessage(jid, { text: '❌ No contacts found in this file.', contextInfo }, { quoted: message });
            }

            const contacts = [];
            for (const card of cards) {
                const fnMatch = card.match(/^FN[;:](.+)$/mi);
                const telMatch = card.match(/^TEL[^:]*:(.+)$/mi);
                const orgMatch = card.match(/^ORG[;:](.+)$/mi);
                const emailMatch = card.match(/^EMAIL[^:]*:(.+)$/mi);

                const name = (fnMatch?.[1] || '').trim().replace(/\\(.)/g, '$1') || 'Unknown';
                const phone = (telMatch?.[1] || '').trim().replace(/[\s\-]/g, '') || 'N/A';
                const org = (orgMatch?.[1] || '').trim().replace(/\\(.)/g, '$1').replace(/;/g, ', ') || '';
                const email = (emailMatch?.[1] || '').trim() || '';

                contacts.push({ name, phone, org, email });
            }

            const PAGE_SIZE = 50;
            const totalPages = Math.ceil(contacts.length / PAGE_SIZE);

            for (let page = 0; page < totalPages; page++) {
                const slice = contacts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
                const list = slice.map((c, i) => {
                    const idx = page * PAGE_SIZE + i + 1;
                    let line = `*${idx}.* ${c.name}\n    📞 ${c.phone}`;
                    if (c.org) line += `\n    🏢 ${c.org}`;
                    if (c.email) line += `\n    📧 ${c.email}`;
                    return line;
                }).join('\n\n');

                const header = totalPages > 1
                    ? `📇 *VCF Contents* — Page ${page + 1}/${totalPages} (${contacts.length} contacts)\n\n`
                    : `📇 *VCF Contents* — ${contacts.length} contact(s)\n\n`;

                await sock.sendMessage(jid, {
                    text: header + list,
                    contextInfo
                }, { quoted: page === 0 ? message : undefined });
            }
            return;
        }

        if (rawCmd === 'vcfnumber') {
            const numbers = args.filter(a => /^\+?\d{7,15}$/.test(a.replace(/[\s\-()]/g, '')));
            if (!numbers.length) {
                return sock.sendMessage(jid, {
                    text: '📇 *VCF from Phone Number*\n\n*Usage:* `.vcfnumber <phone1> <phone2> ...`\n\n*Example:*\n`.vcfnumber 254712345678`\n`.vcfnumber +254712345678 +254798765432`\n\nThe bot will try to fetch the name from WhatsApp and Truecaller.',
                    contextInfo
                }, { quoted: message });
            }

            await sock.sendMessage(jid, {
                text: `⏳ Looking up *${numbers.length}* number(s)...`,
                contextInfo
            }, { quoted: message });

            const vcards = [];
            const report = [];

            for (const raw of numbers) {
                const phone = raw.replace(/[\s\-()+ ]/g, '');
                let name = getContactName(phone + '@s.whatsapp.net');
                let source = name ? 'WhatsApp' : '';

                if (!name) {
                    name = await lookupTruecaller(phone);
                    if (name) source = 'Truecaller';
                }

                if (!name) {
                    name = `+${phone}`;
                    source = 'Phone number';
                }

                vcards.push(buildVcard(name, phone));
                report.push(`✅ +${phone} → *${name}* (${source})`);
            }

            const vcfContent = vcards.join('\n');
            const buf = Buffer.from(vcfContent, 'utf8');

            await sock.sendMessage(jid, {
                document: buf,
                mimetype: 'text/x-vcard',
                fileName: `contacts_${numbers.length}.vcf`,
                caption: `📇 *VCF Generated — ${numbers.length} contact(s)*\n\n${report.join('\n')}`
            }, { quoted: message });
            return;
        }

        if (['vcfgroup', 'groupvcf'].includes(rawCmd) || (rawCmd === 'vcfgen' && isGroup && !args.length)) {
            if (!isGroup) {
                return sock.sendMessage(jid, {
                    text: '❌ This command only works in groups.\n\nFor specific numbers use: `.vcfnumber <phone>`',
                    contextInfo
                }, { quoted: message });
            }
            if (!isAdmin && !isOwner) {
                return sock.sendMessage(jid, { text: '⛔ Only group admins or the owner can export member contacts.', contextInfo }, { quoted: message });
            }

            let participants = groupMetadata?.participants || [];
            try {
                const fresh = await sock.groupMetadata(jid);
                if (fresh?.participants?.length) participants = fresh.participants;
            } catch {}

            if (!participants.length) {
                return sock.sendMessage(jid, { text: '❌ Could not fetch group members.', contextInfo }, { quoted: message });
            }

            const lidMapSize = global.lidPhoneCache?.size || 0;
            const pushCacheSize = global.pushNameCache?.size || 0;
            const lidJidSize = global.lidJidMap?.size || 0;
            await sock.sendMessage(jid, {
                text: `⏳ Generating VCF for *${participants.length}* members...\n📊 Cache: LID=${lidMapSize} | Names=${pushCacheSize} | Contacts=${lidJidSize}`,
                contextInfo
            }, { quoted: message });

            const vcards = [];
            let named = 0, phoneOnly = 0, skipped = 0, usernames = 0;
            const seen = new Set();

            for (const p of participants) {
                const { phone, name: cachedName } = resolveAndName(p, resolveLid);

                if (!phone) {
                    skipped++;
                    continue;
                }

                if (seen.has(phone)) continue;
                seen.add(phone);

                // Prefer metadata supplied by WhatsApp. Do not send group phone
                // numbers to third-party reverse-lookup services.
                let name = cachedName || p.notify || p.name || p.pushName || '';
                const username = p.username || p.userName || '';
                if (username) usernames++;

                if (!name) {
                    name = `+${phone}`;
                    phoneOnly++;
                } else {
                    named++;
                }

                vcards.push(buildVcard(name, phone, { username, jid: p.id }));
            }

            if (!vcards.length) {
                return sock.sendMessage(jid, {
                    text: [
                        '❌ WhatsApp did not provide any exportable phone numbers for this group.',
                        '',
                        'This group is currently LID-only and Baileys has no LID→phone mapping for its members.',
                        'The bot cannot infer private phone numbers from an opaque LID.',
                        '',
                        `Current cache: LID=${lidMapSize} | Names=${pushCacheSize} | Contacts=${lidJidSize}`,
                        '',
                        'Try again after the bot receives messages from members or after its contact history syncs.',
                        'Any members still hidden by WhatsApp will remain unresolved.',
                    ].join('\n'),
                    contextInfo
                }, { quoted: message });
            }

            const vcfContent = vcards.join('\n');
            const buf = Buffer.from(vcfContent, 'utf8');
            const groupName = (groupMetadata?.subject || 'group').replace(/[^a-zA-Z0-9_\- ]/g, '').trim();

            await sock.sendMessage(jid, {
                document: buf,
                mimetype: 'text/x-vcard',
                fileName: `${groupName}_contacts.vcf`,
                caption: [
                    `📇 *VCF Generated — ${groupName}*`,
                    ``,
                    `👥 Total contacts: *${vcards.length}*`,
                    `📛 With names: *${named}*`,
                    `📞 Phone only: *${phoneOnly}*`,
                    `🏷️ WhatsApp usernames: *${usernames}*`,
                    skipped > 0 ? `⚠️ Unresolved: *${skipped}* (not yet seen by bot)` : '',
                    ``,
                    `_Open the .vcf file to import all contacts at once._`,
                ].filter(Boolean).join('\n')
            }, { quoted: message });
            return;
        }

        if (rawCmd === 'vcfgen' || rawCmd === 'savecontacts' || rawCmd === 'exportvcf' || rawCmd === 'contactsave') {
            const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (mentioned.length) {
                await sock.sendMessage(jid, {
                    text: `⏳ Looking up *${mentioned.length}* mentioned user(s)...`,
                    contextInfo
                }, { quoted: message });

                const vcards = [];
                const report = [];

                for (const mJid of mentioned) {
                    const { phone, name: cachedName } = resolveAndName(mJid, resolveLid);
                    if (!phone || phone.length < 7) continue;

                    let name = cachedName;
                    let source = name ? 'WhatsApp' : '';

                    if (!name) {
                        name = await lookupTruecaller(phone);
                        if (name) source = 'Truecaller';
                    }

                    if (!name) {
                        name = `+${phone}`;
                        source = 'Phone number';
                    }

                    vcards.push(buildVcard(name, phone));
                    report.push(`✅ +${phone} → *${name}* (${source})`);
                }

                if (!vcards.length) {
                    return sock.sendMessage(jid, { text: '❌ No valid contacts found in mentions.', contextInfo }, { quoted: message });
                }

                const vcfContent = vcards.join('\n');
                const buf = Buffer.from(vcfContent, 'utf8');

                await sock.sendMessage(jid, {
                    document: buf,
                    mimetype: 'text/x-vcard',
                    fileName: `contacts_${vcards.length}.vcf`,
                    caption: `📇 *VCF Generated — ${vcards.length} contact(s)*\n\n${report.join('\n')}`
                }, { quoted: message });
                return;
            }

            const phoneArgs = args.filter(a => /^\+?\d{7,15}$/.test(a.replace(/[\s\-()]/g, '')));
            if (phoneArgs.length) {
                args.splice(0, args.length, ...phoneArgs);
                return module.exports.run(sock, { ...message, message: { conversation: `.vcfnumber ${phoneArgs.join(' ')}` } }, phoneArgs, { ...ctx, command: 'vcfnumber' });
            }

            return sock.sendMessage(jid, {
                text: [
                    `📇 *VCF Contact Generator*`,
                    ``,
                    `Generate .vcf contact files with real names.`,
                    ``,
                    `*Commands:*`,
                    `• \`.vcfgen\` — Export all group members as VCF`,
                    `• \`.vcfgen @user1 @user2\` — VCF for tagged users`,
                    `• \`.vcfnumber 2547XXXXXXXX\` — VCF from phone number(s)`,
                    `• \`.vcfgroup\` — Full group export with name lookup`,
                    `• \`.vcfread\` — Reply to a .vcf file to view its contents`,
                    ``,
                    `*Name Sources (in order):*`,
                    `1. WhatsApp pushName / display name`,
                    `2. Truecaller lookup`,
                    `3. Falls back to phone number`,
                    ``,
                    `_Names are cached from messages — more activity = more names._`,
                ].join('\n'),
                contextInfo
            }, { quoted: message });
        }
    }
};
