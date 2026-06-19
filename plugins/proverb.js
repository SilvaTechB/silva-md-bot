'use strict';

const axios = require('axios');
const { fmt } = require('../lib/theme');

const PROVERBS = [
    { text: "A stitch in time saves nine.", origin: "English" },
    { text: "Actions speak louder than words.", origin: "English" },
    { text: "All that glitters is not gold.", origin: "English" },
    { text: "A penny saved is a penny earned.", origin: "English" },
    { text: "Beggars can't be choosers.", origin: "English" },
    { text: "Better late than never.", origin: "English" },
    { text: "Don't count your chickens before they hatch.", origin: "English" },
    { text: "Every cloud has a silver lining.", origin: "English" },
    { text: "Fortune favors the bold.", origin: "Latin" },
    { text: "Knowledge is power.", origin: "Francis Bacon" },
    { text: "Look before you leap.", origin: "English" },
    { text: "No pain, no gain.", origin: "English" },
    { text: "Practice makes perfect.", origin: "English" },
    { text: "The early bird catches the worm.", origin: "English" },
    { text: "Time is money.", origin: "Benjamin Franklin" },
    { text: "Two wrongs don't make a right.", origin: "English" },
    { text: "When in Rome, do as the Romans do.", origin: "Latin" },
    { text: "Where there's a will, there's a way.", origin: "English" },
    { text: "You reap what you sow.", origin: "Biblical" },
    { text: "A fool and his money are soon parted.", origin: "English" },
    { text: "Absence makes the heart grow fonder.", origin: "English" },
    { text: "All roads lead to Rome.", origin: "Latin" },
    { text: "Birds of a feather flock together.", origin: "English" },
    { text: "Curiosity killed the cat.", origin: "English" },
    { text: "Don't bite the hand that feeds you.", origin: "English" },
    { text: "Great minds think alike.", origin: "English" },
    { text: "Honesty is the best policy.", origin: "English" },
    { text: "It takes two to tango.", origin: "English" },
    { text: "Laughter is the best medicine.", origin: "English" },
    { text: "Necessity is the mother of invention.", origin: "Latin" },
    { text: "Don't judge a book by its cover.", origin: "English" },
    { text: "The pen is mightier than the sword.", origin: "Edward Bulwer-Lytton" },
    { text: "Rome wasn't built in a day.", origin: "English" },
    { text: "The grass is always greener on the other side.", origin: "English" },
    { text: "Too many cooks spoil the broth.", origin: "English" },
    { text: "A chain is only as strong as its weakest link.", origin: "English" },
    { text: "An apple a day keeps the doctor away.", origin: "Welsh" },
    { text: "Don't put all your eggs in one basket.", origin: "English" },
    { text: "Every dog has its day.", origin: "English" },
    { text: "Give a man a fish and you feed him for a day; teach a man to fish and you feed him for a lifetime.", origin: "Chinese" },
    { text: "Half a loaf is better than none.", origin: "English" },
    { text: "If it ain't broke, don't fix it.", origin: "American" },
    { text: "It's no use crying over spilled milk.", origin: "English" },
    { text: "Keep your friends close and your enemies closer.", origin: "Sun Tzu" },
    { text: "Let sleeping dogs lie.", origin: "English" },
    { text: "Many hands make light work.", origin: "English" },
    { text: "Nothing ventured, nothing gained.", origin: "English" },
    { text: "One man's trash is another man's treasure.", origin: "English" },
    { text: "People who live in glass houses shouldn't throw stones.", origin: "English" },
    { text: "The best things in life are free.", origin: "English" },
    { text: "The road to hell is paved with good intentions.", origin: "English" },
    { text: "There's no place like home.", origin: "English" },
    { text: "United we stand, divided we fall.", origin: "Aesop" },
    { text: "You can lead a horse to water, but you can't make it drink.", origin: "English" },
    { text: "A bad workman always blames his tools.", origin: "English" },
    { text: "All's fair in love and war.", origin: "English" },
    { text: "Better safe than sorry.", origin: "English" },
    { text: "Do unto others as you would have them do unto you.", origin: "Biblical" },
    { text: "Experience is the best teacher.", origin: "Latin" },
    { text: "Failing to plan is planning to fail.", origin: "Benjamin Franklin" },
    { text: "God helps those who help themselves.", origin: "English" },
    { text: "He who laughs last, laughs longest.", origin: "English" },
    { text: "If you want something done right, do it yourself.", origin: "French" },
    { text: "Judge not, that ye be not judged.", origin: "Biblical" },
    { text: "Kill two birds with one stone.", origin: "English" },
    { text: "Live and let live.", origin: "English" },
    { text: "Money is the root of all evil.", origin: "Biblical" },
    { text: "No man is an island.", origin: "John Donne" },
    { text: "Once bitten, twice shy.", origin: "English" },
    { text: "Prevention is better than cure.", origin: "Desiderius Erasmus" },
    { text: "Still waters run deep.", origin: "Latin" },
    { text: "The apple never falls far from the tree.", origin: "German" },
    { text: "The truth will set you free.", origin: "Biblical" },
    { text: "Time heals all wounds.", origin: "English" },
    { text: "To err is human, to forgive divine.", origin: "Alexander Pope" },
    { text: "Truth is stranger than fiction.", origin: "Mark Twain" },
    { text: "Waste not, want not.", origin: "English" },
    { text: "What doesn't kill you makes you stronger.", origin: "Friedrich Nietzsche" },
    { text: "When the going gets tough, the tough get going.", origin: "Joseph P. Kennedy" },
    { text: "With great power comes great responsibility.", origin: "French" },
    { text: "You can't make an omelette without breaking eggs.", origin: "French" },
    { text: "A journey of a thousand miles begins with a single step.", origin: "Lao Tzu" },
    { text: "All good things come to those who wait.", origin: "English" },
    { text: "Blood is thicker than water.", origin: "English" },
    { text: "Don't make a mountain out of a molehill.", origin: "English" },
    { text: "Even Homer sometimes nods.", origin: "Horace" },
    { text: "First come, first served.", origin: "English" },
    { text: "Good things come in small packages.", origin: "English" },
    { text: "He who hesitates is lost.", origin: "English" },
    { text: "In the land of the blind, the one-eyed man is king.", origin: "Erasmus" },
    { text: "It takes a village to raise a child.", origin: "African" },
    { text: "Kindness is a language which the deaf can hear and the blind can see.", origin: "Mark Twain" },
    { text: "Life is what happens when you're busy making other plans.", origin: "John Lennon" },
    { text: "Make hay while the sun shines.", origin: "English" },
    { text: "Never put off till tomorrow what you can do today.", origin: "English" },
    { text: "Old habits die hard.", origin: "English" },
    { text: "Patience is a virtue.", origin: "English" },
    { text: "Slow and steady wins the race.", origin: "Aesop" },
    { text: "The bigger they are, the harder they fall.", origin: "English" },
    { text: "The darkest hour is just before the dawn.", origin: "English" },
    { text: "The more you learn, the more you earn.", origin: "Warren Buffett" },
    { text: "Two heads are better than one.", origin: "English" },
    { text: "Well begun is half done.", origin: "Aristotle" },
];

module.exports = {
    commands:    ['proverb', 'saying', 'wisdom', 'adage'],
    description: 'Get a random proverb, wise saying, or adage',
    usage:       '.proverb',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        let pick = null;

        try {
            const res = await axios.get('https://api.sampleapis.com/proverbs/proverbs', { timeout: 6000 });
            const list = res.data;
            if (Array.isArray(list) && list.length) {
                const item = list[Math.floor(Math.random() * list.length)];
                if (item?.proverb) pick = { text: item.proverb, origin: item.tags?.[0] || 'Traditional' };
            }
        } catch {}

        if (!pick) {
            pick = PROVERBS[Math.floor(Math.random() * PROVERBS.length)];
        }

        const msg =
            `📜 *Proverb*\n\n` +
            `_"${pick.text}"_\n\n` +
            `— *${pick.origin || 'Traditional'}*\n\n` +
            `_Type \`.proverb\` again for another!_`;

        await sock.sendMessage(jid, { text: fmt(msg), contextInfo }, { quoted: message });
    }
};
