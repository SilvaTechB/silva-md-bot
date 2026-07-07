'use strict';

// ─── Country code → country name lookup ───────────────────────────────────────
// Sorted longest-prefix-first so greedy matching is correct.
const COUNTRY_CODES = [
    ['1876','Jamaica'],['1809','Dominican Rep.'],['1787','Puerto Rico'],
    ['1473','Grenada'],['1868','Trinidad & Tobago'],['1784','St. Vincent'],
    ['1758','Saint Lucia'],['1767','Dominica'],['1664','Montserrat'],
    ['1649','Turks & Caicos'],['1671','Guam'],['1670','N. Mariana Is.'],
    ['7840','Abkhazia'],['7940','Abkhazia'],
    ['993','Turkmenistan'],['994','Azerbaijan'],['995','Georgia'],
    ['996','Kyrgyzstan'],['998','Uzbekistan'],['992','Tajikistan'],
    ['977','Nepal'],['976','Mongolia'],['975','Bhutan'],['974','Qatar'],
    ['973','Bahrain'],['972','Israel'],['971','United Arab Emirates'],
    ['970','Palestine'],['968','Oman'],['967','Yemen'],['966','Saudi Arabia'],
    ['965','Kuwait'],['964','Iraq'],['963','Syria'],['962','Jordan'],
    ['961','Lebanon'],['960','Maldives'],['886','Taiwan'],['880','Bangladesh'],
    ['856','Laos'],['855','Cambodia'],['853','Macau'],['852','Hong Kong'],
    ['855','Cambodia'],['682','Cook Islands'],['679','Fiji'],['678','Vanuatu'],
    ['677','Solomon Is.'],['676','Tonga'],['675','Papua New Guinea'],
    ['674','Nauru'],['673','Brunei'],['672','Norfolk Is.'],
    ['670','Timor-Leste'],['599','Caribbean Netherlands'],['598','Uruguay'],
    ['597','Suriname'],['596','Martinique'],['595','Paraguay'],
    ['594','French Guiana'],['593','Ecuador'],['592','Guyana'],
    ['591','Bolivia'],['590','Guadeloupe'],['509','Haiti'],['508','St. Pierre'],
    ['507','Panama'],['506','Costa Rica'],['505','Nicaragua'],['504','Honduras'],
    ['503','El Salvador'],['502','Guatemala'],['501','Belize'],
    ['421','Slovakia'],['420','Czech Republic'],['387','Bosnia'],
    ['386','Slovenia'],['385','Croatia'],['382','Montenegro'],
    ['381','Serbia'],['380','Ukraine'],['379','Vatican'],['378','San Marino'],
    ['377','Monaco'],['376','Andorra'],['375','Belarus'],['374','Armenia'],
    ['373','Moldova'],['372','Estonia'],['371','Latvia'],['370','Lithuania'],
    ['359','Bulgaria'],['358','Finland'],['357','Cyprus'],['356','Malta'],
    ['355','Albania'],['354','Iceland'],['353','Ireland'],['352','Luxembourg'],
    ['351','Portugal'],['350','Gibraltar'],['299','Greenland'],
    ['298','Faroe Islands'],['297','Aruba'],['269','Comoros'],['268','Eswatini'],
    ['267','Botswana'],['266','Lesotho'],['265','Malawi'],['264','Namibia'],
    ['263','Zimbabwe'],['262','Réunion'],['261','Madagascar'],['260','Zambia'],
    ['258','Mozambique'],['257','Burundi'],['256','Uganda'],['255','Tanzania'],
    ['254','Kenya'],['253','Djibouti'],['252','Somalia'],['251','Ethiopia'],
    ['250','Rwanda'],['249','Sudan'],['248','Seychelles'],['246','British IO'],
    ['245','Guinea-Bissau'],['244','Angola'],['243','DR Congo'],['242','Congo'],
    ['241','Gabon'],['240','Equatorial Guinea'],['239','São Tomé'],
    ['238','Cape Verde'],['237','Cameroon'],['236','Central African Rep.'],
    ['235','Chad'],['234','Nigeria'],['233','Ghana'],['232','Sierra Leone'],
    ['231','Liberia'],['230','Mauritius'],['229','Benin'],['228','Togo'],
    ['227','Niger'],['226','Burkina Faso'],['225','Côte d\'Ivoire'],
    ['224','Guinea'],['223','Mali'],['222','Mauritania'],['221','Senegal'],
    ['220','Gambia'],['218','Libya'],['216','Tunisia'],['213','Algeria'],
    ['212','Morocco'],['211','South Sudan'],['98','Iran'],['97','Jordan/Israel prefix'],
    ['95','Myanmar'],['94','Sri Lanka'],['93','Afghanistan'],['92','Pakistan'],
    ['91','India'],['90','Turkey'],['86','China'],['84','Vietnam'],
    ['82','South Korea'],['81','Japan'],['66','Thailand'],['65','Singapore'],
    ['64','New Zealand'],['63','Philippines'],['62','Indonesia'],
    ['61','Australia'],['60','Malaysia'],['58','Venezuela'],['57','Colombia'],
    ['56','Chile'],['55','Brazil'],['54','Argentina'],['53','Cuba'],
    ['52','Mexico'],['51','Peru'],['49','Germany'],['48','Poland'],
    ['47','Norway'],['46','Sweden'],['45','Denmark'],['44','United Kingdom'],
    ['43','Austria'],['41','Switzerland'],['40','Romania'],['39','Italy'],
    ['36','Hungary'],['34','Spain'],['33','France'],['32','Belgium'],
    ['31','Netherlands'],['30','Greece'],['27','South Africa'],['20','Egypt'],
    ['7','Russia / Kazakhstan'],['1','USA / Canada'],
];
COUNTRY_CODES.sort((a, b) => b[0].length - a[0].length);

/**
 * Return "Country Name (+code)" for a given phone number string.
 */
function getCountry(number) {
    const digits = String(number).replace(/\D/g, '');
    for (const [code, name] of COUNTRY_CODES) {
        if (digits.startsWith(code)) return `${name} (+${code})`;
    }
    return 'Unknown';
}

/**
 * Resolve any JID (phone, LID, device-suffixed) to a bare phone JID.
 * Uses global.lidPhoneCache for LID → phone lookup (same chain as handler.js).
 * Returns null if it is a LID not yet cached, or a group/newsletter JID.
 */
function resolvePhoneJid(jid) {
    if (!jid) return null;
    const server = (jid.split('@')[1] || '');
    const user   = jid.split('@')[0].split(':')[0];

    if (server === 'lid') {
        if (global.lidPhoneCache?.size) {
            const phone = global.lidPhoneCache.get(user)
                       || global.lidPhoneCache.get(user + '@lid')
                       || global.lidPhoneCache.get(jid);
            if (phone) {
                const digits = String(phone).replace(/\D/g, '');
                if (digits.length >= 7) return `${digits}@s.whatsapp.net`;
            }
        }
        return null;
    }
    if (server === 's.whatsapp.net' || server === '') {
        return `${user}@s.whatsapp.net`;
    }
    return null; // group / newsletter / other
}

module.exports = { getCountry, resolvePhoneJid };
