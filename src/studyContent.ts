import type { Ionicons } from '@expo/vector-icons';
import type { Passage } from './bible';

export type Topic = { id: string; title: string; blurb: string; icon: keyof typeof Ionicons.glyphMap; refs: Passage[] };

const p = (bookId: number, chapter: number, verse: number): Passage => ({ bookId, chapter, verse });

/** Curated topics. Passages are references only, so the text always comes from the Bible version the reader has chosen. */
export const topics: Topic[] = [
  { id: 'faith', title: 'Faith', blurb: 'Trusting God when you cannot see the way.', icon: 'compass-outline', refs: [p(58, 11, 1), p(58, 11, 6), p(45, 10, 17), p(47, 5, 7), p(41, 11, 24), p(40, 17, 20), p(59, 2, 17), p(48, 2, 20)] },
  { id: 'hope', title: 'Hope', blurb: 'A steady anchor for hard seasons.', icon: 'sunny-outline', refs: [p(45, 15, 13), p(24, 29, 11), p(19, 42, 11), p(25, 3, 23), p(58, 6, 19), p(60, 1, 3), p(45, 8, 25), p(23, 40, 31)] },
  { id: 'love', title: 'Love', blurb: 'God’s love for us, and how we love others.', icon: 'heart-outline', refs: [p(43, 3, 16), p(46, 13, 4), p(46, 13, 13), p(62, 4, 8), p(62, 4, 19), p(45, 5, 8), p(43, 13, 34), p(45, 8, 38)] },
  { id: 'peace', title: 'Peace', blurb: 'Calm for a restless heart.', icon: 'leaf-outline', refs: [p(43, 14, 27), p(50, 4, 7), p(23, 26, 3), p(19, 29, 11), p(51, 3, 15), p(45, 5, 1), p(43, 16, 33)] },
  { id: 'forgiveness', title: 'Forgiveness', blurb: 'Receiving mercy and giving it away.', icon: 'hand-left-outline', refs: [p(62, 1, 9), p(49, 4, 32), p(51, 3, 13), p(40, 6, 14), p(19, 103, 12), p(42, 6, 37), p(41, 11, 25), p(44, 3, 19)] },
  { id: 'worry', title: 'Worry & anxiety', blurb: 'Handing your cares to someone bigger.', icon: 'cloud-outline', refs: [p(50, 4, 6), p(60, 5, 7), p(40, 6, 34), p(19, 94, 19), p(23, 41, 10), p(19, 55, 22), p(43, 14, 1)] },
  { id: 'strength', title: 'Strength', blurb: 'Help for the days you feel weak.', icon: 'barbell-outline', refs: [p(50, 4, 13), p(19, 46, 1), p(16, 8, 10), p(47, 12, 9), p(19, 28, 7), p(49, 6, 10), p(19, 18, 2)] },
  { id: 'wisdom', title: 'Wisdom', blurb: 'Guidance for choices big and small.', icon: 'bulb-outline', refs: [p(20, 3, 5), p(20, 3, 6), p(59, 1, 5), p(20, 9, 10), p(20, 4, 7), p(19, 111, 10), p(20, 2, 6), p(20, 16, 3)] },
  { id: 'gratitude', title: 'Gratitude', blurb: 'Learning to say thank you.', icon: 'gift-outline', refs: [p(52, 5, 18), p(19, 107, 1), p(19, 100, 4), p(51, 3, 17), p(19, 136, 1), p(19, 118, 24), p(49, 5, 20)] },
  { id: 'prayer', title: 'Prayer', blurb: 'Talking with God.', icon: 'chatbubble-ellipses-outline', refs: [p(40, 7, 7), p(24, 33, 3), p(52, 5, 17), p(59, 5, 16), p(19, 145, 18), p(40, 6, 6), p(40, 6, 9)] },
  { id: 'comfort', title: 'Comfort', blurb: 'Nearness in grief and pain.', icon: 'umbrella-outline', refs: [p(19, 23, 4), p(47, 1, 3), p(40, 5, 4), p(19, 34, 18), p(66, 21, 4), p(19, 147, 3), p(23, 43, 2), p(40, 11, 28)] },
  { id: 'grace', title: 'Grace & salvation', blurb: 'A gift, not something we earn.', icon: 'ribbon-outline', refs: [p(49, 2, 8), p(49, 2, 9), p(45, 10, 9), p(44, 4, 12), p(43, 14, 6), p(56, 3, 5), p(45, 6, 23), p(45, 3, 23)] },
  { id: 'joy', title: 'Joy', blurb: 'Gladness that does not depend on circumstances.', icon: 'happy-outline', refs: [p(19, 16, 11), p(43, 15, 11), p(48, 5, 22), p(19, 30, 5), p(50, 4, 4), p(16, 8, 10), p(19, 126, 3)] },
  { id: 'courage', title: 'Courage', blurb: 'Standing firm when you are afraid.', icon: 'shield-outline', refs: [p(6, 1, 9), p(5, 31, 6), p(19, 27, 1), p(55, 1, 7), p(19, 56, 3), p(46, 16, 13), p(19, 31, 24), p(23, 41, 10)] },
  { id: 'patience', title: 'Patience', blurb: 'Waiting well.', icon: 'hourglass-outline', refs: [p(19, 27, 14), p(45, 12, 12), p(59, 1, 3), p(48, 6, 9), p(58, 10, 36), p(19, 37, 7), p(21, 7, 8)] },
  { id: 'trust', title: 'Trust & provision', blurb: 'God knows what you need.', icon: 'home-outline', refs: [p(19, 23, 1), p(50, 4, 19), p(40, 6, 33), p(19, 37, 5), p(20, 3, 5), p(40, 6, 26)] },
];

export const topicById = (id: string) => topics.find((topic) => topic.id === id);
export const allTopicPassages = () => {
  const seen = new Set<string>();
  return topics.flatMap((topic) => topic.refs).filter((ref) => { const key = `${ref.bookId}:${ref.chapter}:${ref.verse}`; if (seen.has(key)) return false; seen.add(key); return true; });
};

export type KnowledgeQuestion = { prompt: string; answer: string; wrong: [string, string, string]; explain: string };
const k = (prompt: string, answer: string, wrong: [string, string, string], explain: string): KnowledgeQuestion => ({ prompt, answer, wrong, explain });

export const knowledgeBank: KnowledgeQuestion[] = [
  k('How many books are in the Protestant Bible?', '66', ['72', '60', '39'], '39 in the Old Testament and 27 in the New Testament.'),
  k('Which book is the first in the Bible?', 'Genesis', ['Exodus', 'Psalms', 'Matthew'], 'Genesis means “beginning”.'),
  k('Which book is the last in the Bible?', 'Revelation', ['Jude', 'Malachi', 'Acts'], 'Revelation closes the New Testament and the Bible.'),
  k('Who built the ark?', 'Noah', ['Moses', 'Abraham', 'Enoch'], 'God told Noah to build the ark before the flood (Genesis 6–9).'),
  k('Who led the Israelites out of slavery in Egypt?', 'Moses', ['Joshua', 'Aaron', 'Samuel'], 'The story is told in the book of Exodus.'),
  k('Which prophet was swallowed by a great fish?', 'Jonah', ['Elijah', 'Jeremiah', 'Amos'], 'Jonah spent three days inside the fish (Jonah 1–2).'),
  k('Which shepherd boy defeated the giant Goliath?', 'David', ['Saul', 'Jonathan', 'Samson'], 'See 1 Samuel 17. David later became king of Israel.'),
  k('Who was thrown into the lions’ den for praying to God?', 'Daniel', ['Shadrach', 'Elijah', 'Jeremiah'], 'God shut the lions’ mouths (Daniel 6).'),
  k('In which town was Jesus born?', 'Bethlehem', ['Nazareth', 'Jerusalem', 'Capernaum'], 'Luke 2 and Matthew 2 tell of His birth in Bethlehem.'),
  k('How many apostles did Jesus choose?', 'Twelve', ['Seven', 'Ten', 'Seventy'], 'The twelve are listed in Matthew 10.'),
  k('What was Jesus’ first miracle in John’s Gospel?', 'Turning water into wine', ['Healing a blind man', 'Feeding the five thousand', 'Walking on water'], 'At a wedding in Cana (John 2).'),
  k('Which disciple denied Jesus three times?', 'Peter', ['Thomas', 'Judas', 'John'], 'Peter wept bitterly afterwards, and Jesus later restored him.'),
  k('Who betrayed Jesus for thirty pieces of silver?', 'Judas Iscariot', ['Peter', 'Pontius Pilate', 'Caiaphas'], 'See Matthew 26.'),
  k('Who wrote most of the Psalms?', 'David', ['Solomon', 'Moses', 'Asaph'], 'David is credited with about seventy-three of them.'),
  k('On which mountain did Moses receive the Ten Commandments?', 'Mount Sinai', ['Mount Carmel', 'Mount Zion', 'Mount Nebo'], 'See Exodus 19–20.'),
  k('Which son of Jacob was sold into slavery by his brothers?', 'Joseph', ['Benjamin', 'Judah', 'Reuben'], 'Genesis 37. God later used him to save his family.'),
  k('Which king asked God for wisdom instead of riches?', 'Solomon', ['David', 'Hezekiah', 'Josiah'], '1 Kings 3.'),
  k('Which of these is listed as fruit of the Spirit in Galatians 5?', 'Gentleness', ['Pride', 'Ambition', 'Cleverness'], 'Galatians 5:22–23 lists love, joy, peace, patience, kindness, goodness, faithfulness, gentleness and self-control.'),
  k('On which day of creation did God rest?', 'The seventh', ['The sixth', 'The third', 'The tenth'], 'Genesis 2:2.'),
  k('Who was the first man God created?', 'Adam', ['Abel', 'Seth', 'Noah'], 'Genesis 2.'),
  k('Who was the mother of Jesus?', 'Mary', ['Martha', 'Elizabeth', 'Ruth'], 'Luke 1–2.'),
  k('Who baptized Jesus in the Jordan River?', 'John the Baptist', ['Peter', 'Paul', 'Andrew'], 'Matthew 3.'),
  k('Which apostle, formerly called Saul, wrote many New Testament letters?', 'Paul', ['Peter', 'John', 'Barnabas'], 'Acts 9 tells of his conversion.'),
  k('On the road to which city did Saul meet the risen Jesus?', 'Damascus', ['Antioch', 'Corinth', 'Jericho'], 'Acts 9.'),
  k('Which sea did Jesus walk on?', 'Sea of Galilee', ['Red Sea', 'Dead Sea', 'Mediterranean Sea'], 'Matthew 14.'),
  k('Which is the longest chapter in the Bible?', 'Psalm 119', ['Genesis 1', 'Isaiah 53', 'Luke 1'], 'Psalm 119 has 176 verses.'),
  k('Who lived 969 years, the oldest person in the Bible?', 'Methuselah', ['Adam', 'Noah', 'Enoch'], 'Genesis 5:27.'),
  k('How many plagues struck Egypt?', 'Ten', ['Seven', 'Twelve', 'Forty'], 'Exodus 7–12.'),
  k('Who interpreted Pharaoh’s dreams about cows and grain?', 'Joseph', ['Moses', 'Daniel', 'Aaron'], 'Genesis 41.'),
  k('Which queen risked her life to save her people?', 'Esther', ['Ruth', 'Deborah', 'The Queen of Sheba'], 'See the book of Esther.'),
  k('Who was the mother of the prophet Samuel?', 'Hannah', ['Sarah', 'Rebekah', 'Naomi'], '1 Samuel 1.'),
  k('Who was Moses’ brother and Israel’s first high priest?', 'Aaron', ['Joshua', 'Caleb', 'Eli'], 'Exodus 28.'),
  k('Which is the last book of the Old Testament?', 'Malachi', ['Zechariah', 'Daniel', 'Nehemiah'], 'Malachi ends the Old Testament.'),
  k('Which is the first book of the New Testament?', 'Matthew', ['Mark', 'Luke', 'John'], 'Matthew opens with the family line of Jesus.'),
  k('Which Gospel records the Sermon on the Mount?', 'Matthew', ['Mark', 'John', 'Acts'], 'Matthew 5–7.'),
  k('Which is the shortest verse in most English Bibles?', '“Jesus wept.”', ['“Pray without ceasing.”', '“Rejoice evermore.”', '“Remember Lot’s wife.”'], 'John 11:35.'),
  k('Who climbed a sycamore tree to see Jesus?', 'Zacchaeus', ['Nicodemus', 'Bartimaeus', 'Matthew'], 'Luke 19.'),
  k('How long did the rain fall during the flood?', 'Forty days and nights', ['Seven days', 'Ten days', 'One hundred days'], 'Genesis 7:12.'),
  k('Who was Ruth’s mother-in-law?', 'Naomi', ['Orpah', 'Hannah', 'Rebekah'], 'Ruth chose to stay with Naomi.'),
  k('Which disciple doubted until he saw Jesus’ wounds?', 'Thomas', ['Philip', 'Bartholomew', 'Andrew'], 'John 20.'),
  k('Which prophet was taken up to heaven in a whirlwind?', 'Elijah', ['Moses', 'Elisha', 'Jeremiah'], '2 Kings 2.'),
  k('In which garden did Jesus pray before He was arrested?', 'Gethsemane', ['Eden', 'Carmel', 'Bethany'], 'Matthew 26.'),
  k('How many Gospels are in the New Testament?', 'Four', ['Three', 'Five', 'Twelve'], 'Matthew, Mark, Luke and John.'),
  k('Who wrote the book of Revelation?', 'John', ['Paul', 'Peter', 'Luke'], 'Revelation 1:1–4.'),
  k('In which town did Jesus grow up?', 'Nazareth', ['Bethlehem', 'Jericho', 'Cana'], 'Luke 2:39–40.'),
  k('Which judge of Israel was famous for his strength and long hair?', 'Samson', ['Gideon', 'Samuel', 'Ehud'], 'Judges 13–16.'),
  k('What did God create on the first day?', 'Light', ['Animals', 'The sun and moon', 'Humans'], 'Genesis 1:3–5.'),
  k('Whom did God call to leave his country and go to a land he would be shown?', 'Abraham', ['Isaac', 'Lot', 'Noah'], 'Genesis 12.'),
  k('What was the first home of Adam and Eve called?', 'The Garden of Eden', ['The Garden of Gethsemane', 'Mount Sinai', 'Canaan'], 'Genesis 2–3.'),
];
