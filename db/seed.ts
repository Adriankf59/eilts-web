// Seed data v0.1 — SPEC-v0.1.md Bagian 3.
// 40 soal grammar (A1-B2), 13 soal reading GT + 3 passage, 10 soal listening, 5 lesson Fase 0.
// Semua soal & passage dibuat orisinal (lihat RANCANGAN-WEBSITE-BELAJAR-IELTS.md Bagian 11 —
// tidak menyalin dari Cambridge IELTS atau sumber berhak cipta lain).
import { Pool } from "pg";

process.loadEnvFile(); // baca .env — script ini jalan lewat tsx, di luar Next.js

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

type SeedQuestion = {
  id: string;
  skill: "grammar" | "listening" | "reading";
  subSkill: string;
  level: string;
  tipe: "mcq" | "gap" | "tfng" | "matching";
  prompt: string;
  audio?: string | null;
  passageId?: string | null;
  opsi?: string[] | null;
  jawaban: string | string[];
  caseSensitive?: boolean;
  penjelasan: string;
};

const grammarQuestions: SeedQuestion[] = [
  // A1 (10)
  { id: "gr-a1-001", skill: "grammar", subSkill: "tenses-dasar", level: "A1", tipe: "mcq", prompt: "She ___ a teacher.", opsi: ["is", "are", "am", "be"], jawaban: "is", penjelasan: "Subjek tunggal 'she' memakai 'is'." },
  { id: "gr-a1-002", skill: "grammar", subSkill: "articles", level: "A1", tipe: "mcq", prompt: "I bought ___ umbrella yesterday.", opsi: ["a", "an", "the", "-"], jawaban: "an", penjelasan: "Pakai 'an' sebelum bunyi vokal: umbrella → /ʌ/." },
  { id: "gr-a1-003", skill: "grammar", subSkill: "subject-verb-agreement", level: "A1", tipe: "mcq", prompt: "They ___ from Indonesia.", opsi: ["is", "am", "are", "be"], jawaban: "are", penjelasan: "Subjek jamak 'they' memakai 'are'." },
  { id: "gr-a1-004", skill: "grammar", subSkill: "prepositions", level: "A1", tipe: "mcq", prompt: "The book is ___ the table.", opsi: ["in", "on", "at", "for"], jawaban: "on", penjelasan: "Benda di atas permukaan datar memakai 'on'." },
  { id: "gr-a1-005", skill: "grammar", subSkill: "countable-uncountable", level: "A1", tipe: "mcq", prompt: "How much ___ do you need?", opsi: ["rice", "rices", "a rice", "rice's"], jawaban: "rice", penjelasan: "'Rice' adalah uncountable noun, tidak punya bentuk jamak." },
  { id: "gr-a1-006", skill: "grammar", subSkill: "tenses-dasar", level: "A1", tipe: "gap", prompt: "I ___ (go) to school every day.", jawaban: "go", caseSensitive: false, penjelasan: "Present simple untuk kebiasaan, subjek 'I' tidak menambah -s." },
  { id: "gr-a1-007", skill: "grammar", subSkill: "articles", level: "A1", tipe: "mcq", prompt: "___ sun rises in the east.", opsi: ["A", "An", "The", "-"], jawaban: "The", penjelasan: "Benda yang unik di dunia (matahari) memakai 'the'." },
  { id: "gr-a1-008", skill: "grammar", subSkill: "prepositions", level: "A1", tipe: "mcq", prompt: "We arrived ___ 7 o'clock.", opsi: ["in", "on", "at", "by"], jawaban: "at", penjelasan: "Jam spesifik memakai preposisi 'at'." },
  { id: "gr-a1-009", skill: "grammar", subSkill: "subject-verb-agreement", level: "A1", tipe: "gap", prompt: "He ___ (not / like) coffee.", jawaban: "doesn't like", caseSensitive: false, penjelasan: "Present simple negatif subjek tunggal: 'doesn't' + kata kerja dasar." },
  { id: "gr-a1-010", skill: "grammar", subSkill: "word-form", level: "A1", tipe: "gap", prompt: "She is a good ___ (sing).", jawaban: "singer", caseSensitive: false, penjelasan: "Kata benda pelaku dibentuk dengan akhiran -er." },
  // A2 (10)
  { id: "gr-a2-001", skill: "grammar", subSkill: "tenses-dasar", level: "A2", tipe: "gap", prompt: "Yesterday, I ___ (watch) a movie.", jawaban: "watched", caseSensitive: false, penjelasan: "Past simple beraturan: tambah -ed." },
  { id: "gr-a2-002", skill: "grammar", subSkill: "tenses-dasar", level: "A2", tipe: "gap", prompt: "Right now, she ___ (read) a book.", jawaban: "is reading", caseSensitive: false, penjelasan: "Present continuous untuk kejadian yang sedang berlangsung." },
  { id: "gr-a2-003", skill: "grammar", subSkill: "prepositions", level: "A2", tipe: "mcq", prompt: "I was born ___ 1998.", opsi: ["in", "on", "at", "-"], jawaban: "in", penjelasan: "Tahun memakai preposisi 'in'." },
  { id: "gr-a2-004", skill: "grammar", subSkill: "articles", level: "A2", tipe: "mcq", prompt: "He is ___ honest man.", opsi: ["a", "an", "the", "-"], jawaban: "an", penjelasan: "'Honest' diawali bunyi vokal /ɒ/, jadi memakai 'an'." },
  { id: "gr-a2-005", skill: "grammar", subSkill: "word-form", level: "A2", tipe: "gap", prompt: "This decision was very ___ (importance).", jawaban: "important", caseSensitive: false, penjelasan: "Bentuk kata sifat dari 'importance' adalah 'important'." },
  { id: "gr-a2-006", skill: "grammar", subSkill: "subject-verb-agreement", level: "A2", tipe: "gap", prompt: "Neither of the students ___ (be) ready.", jawaban: "is", caseSensitive: false, penjelasan: "'Neither of' diikuti kata kerja tunggal." },
  { id: "gr-a2-007", skill: "grammar", subSkill: "countable-uncountable", level: "A2", tipe: "gap", prompt: "There ___ (be) some information in the report.", jawaban: "is", caseSensitive: false, penjelasan: "'Information' adalah uncountable noun, memakai 'is'." },
  { id: "gr-a2-008", skill: "grammar", subSkill: "tenses-dasar", level: "A2", tipe: "gap", prompt: "I usually ___ (have) breakfast at 7.", jawaban: "have", caseSensitive: false, penjelasan: "Present simple untuk rutinitas, subjek 'I' tidak menambah -s." },
  { id: "gr-a2-009", skill: "grammar", subSkill: "prepositions", level: "A2", tipe: "mcq", prompt: "She is good ___ maths.", opsi: ["at", "in", "on", "for"], jawaban: "at", penjelasan: "'Good at' adalah kolokasi tetap untuk kemampuan." },
  { id: "gr-a2-010", skill: "grammar", subSkill: "word-form", level: "A2", tipe: "gap", prompt: "He finished the work ___ (quick).", jawaban: "quickly", caseSensitive: false, penjelasan: "Kata keterangan cara dibentuk dengan akhiran -ly." },
  // B1 (10)
  { id: "gr-b1-001", skill: "grammar", subSkill: "tenses-lanjut", level: "B1", tipe: "gap", prompt: "I ___ (already / finish) my homework.", jawaban: "have already finished", caseSensitive: false, penjelasan: "Present perfect untuk hasil yang relevan sekarang." },
  { id: "gr-b1-002", skill: "grammar", subSkill: "tenses-lanjut", level: "B1", tipe: "gap", prompt: "She ___ (live) here since 2015.", jawaban: "has lived", caseSensitive: false, penjelasan: "Present perfect dengan 'since' untuk durasi yang masih berlangsung." },
  { id: "gr-b1-003", skill: "grammar", subSkill: "passive-voice", level: "B1", tipe: "gap", prompt: "The report ___ (write) by the team yesterday.", jawaban: "was written", caseSensitive: false, penjelasan: "Passive voice past simple: was/were + past participle." },
  { id: "gr-b1-004", skill: "grammar", subSkill: "relative-clause", level: "B1", tipe: "mcq", prompt: "The man ___ called you is my uncle.", opsi: ["who", "which", "where", "whom"], jawaban: "who", penjelasan: "'Who' merujuk pada orang sebagai subjek klausa." },
  { id: "gr-b1-005", skill: "grammar", subSkill: "modals", level: "B1", tipe: "mcq", prompt: "You ___ see a doctor if the pain continues.", opsi: ["should", "can", "could", "might"], jawaban: "should", penjelasan: "'Should' dipakai untuk saran yang kuat." },
  { id: "gr-b1-006", skill: "grammar", subSkill: "relative-clause", level: "B1", tipe: "mcq", prompt: "This is the house ___ I grew up.", opsi: ["which", "where", "who", "whom"], jawaban: "where", penjelasan: "'Where' merujuk pada tempat." },
  { id: "gr-b1-007", skill: "grammar", subSkill: "passive-voice", level: "B1", tipe: "gap", prompt: "English ___ (speak) in many countries.", jawaban: "is spoken", caseSensitive: false, penjelasan: "Passive voice present simple: is/are + past participle." },
  { id: "gr-b1-008", skill: "grammar", subSkill: "modals", level: "B1", tipe: "mcq", prompt: "It ___ rain later, take an umbrella just in case.", opsi: ["might", "must", "should", "can"], jawaban: "might", penjelasan: "'Might' menyatakan kemungkinan, bukan kepastian." },
  { id: "gr-b1-009", skill: "grammar", subSkill: "tenses-lanjut", level: "B1", tipe: "gap", prompt: "By the time we arrived, the meeting ___ (already / start).", jawaban: "had already started", caseSensitive: false, penjelasan: "Past perfect untuk kejadian yang selesai sebelum kejadian lampau lain." },
  { id: "gr-b1-010", skill: "grammar", subSkill: "word-form", level: "B1", tipe: "gap", prompt: "The company needs a more ___ (efficient) system.", jawaban: "efficient", caseSensitive: false, penjelasan: "Kata sifat 'efficient' langsung dipakai sebelum kata benda 'system'." },
  // B2 (10)
  { id: "gr-b2-001", skill: "grammar", subSkill: "conditionals", level: "B2", tipe: "gap", prompt: "If I ___ (know) earlier, I would have told you.", jawaban: "had known", caseSensitive: false, penjelasan: "Third conditional: if + past perfect, would have + past participle." },
  { id: "gr-b2-002", skill: "grammar", subSkill: "conditionals", level: "B2", tipe: "gap", prompt: "If it rains tomorrow, we ___ (cancel) the trip.", jawaban: "will cancel", caseSensitive: false, penjelasan: "First conditional: if + present simple, will + kata kerja dasar." },
  { id: "gr-b2-003", skill: "grammar", subSkill: "complex-sentence", level: "B2", tipe: "mcq", prompt: "___ he was tired, he kept working.", opsi: ["Although", "Because", "So", "Unless"], jawaban: "Although", penjelasan: "'Although' menghubungkan dua ide yang kontras." },
  { id: "gr-b2-004", skill: "grammar", subSkill: "modals", level: "B2", tipe: "mcq", prompt: "She ___ have missed the bus; she's not here yet.", opsi: ["must", "can", "should", "would"], jawaban: "must", penjelasan: "'Must have' menyatakan deduksi kuat tentang masa lalu." },
  { id: "gr-b2-005", skill: "grammar", subSkill: "passive-voice", level: "B2", tipe: "gap", prompt: "The bridge ___ (build) by next year.", jawaban: "will have been built", caseSensitive: false, penjelasan: "Future perfect passive: will have been + past participle." },
  { id: "gr-b2-006", skill: "grammar", subSkill: "relative-clause", level: "B2", tipe: "mcq", prompt: "The report, ___ was submitted late, contained errors.", opsi: ["which", "who", "where", "whom"], jawaban: "which", penjelasan: "Non-defining relative clause untuk benda memakai 'which'." },
  { id: "gr-b2-007", skill: "grammar", subSkill: "complex-sentence", level: "B2", tipe: "mcq", prompt: "___ the heavy rain, the match continued.", opsi: ["Despite", "Although", "Because", "Unless"], jawaban: "Despite", penjelasan: "'Despite' diikuti frasa benda (noun phrase), bukan klausa penuh." },
  { id: "gr-b2-008", skill: "grammar", subSkill: "conditionals", level: "B2", tipe: "gap", prompt: "Unless you ___ (study) harder, you will fail.", jawaban: "study", caseSensitive: false, penjelasan: "'Unless' + present simple, setara dengan 'if...not'." },
  { id: "gr-b2-009", skill: "grammar", subSkill: "modals", level: "B2", tipe: "mcq", prompt: "You ___ have called me — I was worried!", opsi: ["should", "could", "must", "might"], jawaban: "should", penjelasan: "'Should have' menyatakan penyesalan atas sesuatu yang tidak dilakukan." },
  { id: "gr-b2-010", skill: "grammar", subSkill: "word-form", level: "B2", tipe: "gap", prompt: "His argument was based on false ___ (assume).", jawaban: "assumptions", caseSensitive: false, penjelasan: "Bentuk kata benda jamak dari 'assume' adalah 'assumptions'." },
];

const passages = [
  {
    id: "rd-p-001",
    section: 1,
    judul: "Riverside Community Centre — Membership Notice",
    sumber: "buatan sendiri",
    teks: `Riverside Community Centre offers three types of membership: Standard, Family, and Student. Standard membership costs $40 per month and includes access to the gym, swimming pool, and group fitness classes. Family membership costs $70 per month and covers up to two adults and three children under 16. Student membership costs $25 per month and requires a valid student ID at check-in.

All members must complete a short health questionnaire before their first visit. The centre is open Monday to Friday from 6 a.m. to 10 p.m., and on weekends from 8 a.m. to 6 p.m. Public holiday hours may vary — please check the noticeboard at the entrance.

Members can freeze their membership for up to two months per year at no extra charge, but must give at least seven days' written notice to the front desk. Membership fees are non-refundable once a session has started.

For lost membership cards, a replacement fee of $10 applies. New cards are usually issued within three working days.`,
  },
  {
    id: "rd-p-002",
    section: 2,
    judul: "Employee Handbook — Annual Leave Policy",
    sumber: "buatan sendiri",
    teks: `All full-time employees are entitled to 15 days of paid annual leave per calendar year, accrued monthly. Part-time employees receive leave on a pro-rata basis according to their contracted hours.

Leave requests must be submitted through the online portal at least two weeks in advance, except in cases of emergency. Requests during December are subject to approval based on department staffing levels, since this is typically the busiest period for client requests.

Unused leave may be carried over to the following year, up to a maximum of five days. Any leave beyond this limit will be forfeited unless otherwise agreed with a manager in writing.

Employees who resign will be paid for any accrued but unused leave in their final paycheque. Sick leave is recorded separately and does not count against the annual leave balance.

New employees become eligible to take leave after completing a three-month probation period, although leave will continue to accrue from their first day of employment.`,
  },
  {
    id: "rd-p-003",
    section: 3,
    judul: "The Rise of Remote Work",
    sumber: "buatan sendiri",
    teks: `Over the past decade, remote work has shifted from a rare perk to a mainstream way of working. Advances in video conferencing, cloud storage, and messaging tools have made it possible for many office-based roles to be performed from almost anywhere with a stable internet connection.

Supporters of remote work point to several advantages. Employees often report saving significant time and money by avoiding daily commutes. Many also describe greater flexibility in managing their schedules, which can make it easier to balance work with family responsibilities. Employers, meanwhile, sometimes reduce costs associated with office space and utilities.

However, remote work is not without its challenges. Some employees find it harder to separate work life from home life, leading to longer, less structured working hours. Others report feeling isolated without the informal conversations that naturally happen in a shared office. Communication that once took a thirty-second conversation can turn into a lengthy email exchange, slowing down decisions.

Many organisations have responded by adopting hybrid arrangements, where employees split their time between the office and home. This model aims to combine the flexibility of remote work with the collaboration benefits of in-person contact. Early evidence suggests that hybrid arrangements are becoming the preferred choice for a majority of employees who have the option, rather than fully remote or fully office-based work.

Whether remote work continues to grow, stabilises, or declines will likely depend on factors such as industry norms, management preferences, and how well organisations manage the challenges of communication and company culture across distributed teams.`,
  },
];

const readingQuestions: SeedQuestion[] = [
  { id: "rd-001", skill: "reading", subSkill: "tfng", level: "A2", tipe: "tfng", passageId: "rd-p-001", prompt: "Family membership includes up to two adults and three children.", opsi: ["True", "False", "Not Given"], jawaban: "True", penjelasan: "Disebutkan langsung: 'covers up to two adults and three children under 16'." },
  { id: "rd-002", skill: "reading", subSkill: "tfng", level: "A2", tipe: "tfng", passageId: "rd-p-001", prompt: "Student membership does not require an ID.", opsi: ["True", "False", "Not Given"], jawaban: "False", penjelasan: "Teks bilang 'requires a valid student ID at check-in' — kebalikan dari pernyataan." },
  { id: "rd-003", skill: "reading", subSkill: "tfng", level: "B1", tipe: "tfng", passageId: "rd-p-001", prompt: "The centre's Sunday hours are the same as weekday hours.", opsi: ["True", "False", "Not Given"], jawaban: "False", penjelasan: "Weekday 6am-10pm, weekend 8am-6pm — berbeda." },
  { id: "rd-004", skill: "reading", subSkill: "tfng", level: "B1", tipe: "tfng", passageId: "rd-p-001", prompt: "Members can freeze their membership for two months every year without paying extra.", opsi: ["True", "False", "Not Given"], jawaban: "True", penjelasan: "'freeze their membership for up to two months per year at no extra charge'." },
  { id: "rd-005", skill: "reading", subSkill: "tfng", level: "A2", tipe: "tfng", passageId: "rd-p-001", prompt: "A replacement membership card is free of charge.", opsi: ["True", "False", "Not Given"], jawaban: "False", penjelasan: "Ada biaya $10 untuk kartu pengganti." },
  { id: "rd-006", skill: "reading", subSkill: "tfng", level: "B1", tipe: "tfng", passageId: "rd-p-002", prompt: "Part-time staff get the same 15 days of leave as full-time staff.", opsi: ["True", "False", "Not Given"], jawaban: "False", penjelasan: "Part-time menerima leave secara pro-rata, bukan 15 hari penuh." },
  { id: "rd-007", skill: "reading", subSkill: "tfng", level: "B1", tipe: "tfng", passageId: "rd-p-002", prompt: "A maximum of five unused leave days can be carried over to the next year.", opsi: ["True", "False", "Not Given"], jawaban: "True", penjelasan: "'carried over to the following year, up to a maximum of five days'." },
  { id: "rd-008", skill: "reading", subSkill: "sentence-summary-completion", level: "B1", tipe: "gap", passageId: "rd-p-002", prompt: "New employees can only start taking leave after finishing a ___ probation period.", jawaban: "three-month", caseSensitive: false, penjelasan: "Teks: 'eligible to take leave after completing a three-month probation period'." },
  { id: "rd-009", skill: "reading", subSkill: "sentence-summary-completion", level: "B1", tipe: "gap", passageId: "rd-p-002", prompt: "Leave requests should normally be submitted at least ___ in advance.", jawaban: "two weeks", caseSensitive: false, penjelasan: "Teks: 'submitted through the online portal at least two weeks in advance'." },
  { id: "rd-010", skill: "reading", subSkill: "multiple-choice", level: "B2", tipe: "mcq", passageId: "rd-p-003", prompt: "According to the passage, what is one benefit of remote work mentioned for employees?", opsi: ["Saving time and money on commuting", "Guaranteed promotions", "Free office equipment", "Unlimited paid leave"], jawaban: "Saving time and money on commuting", penjelasan: "Disebutkan: 'saving significant time and money by avoiding daily commutes'." },
  { id: "rd-011", skill: "reading", subSkill: "multiple-choice", level: "B2", tipe: "mcq", passageId: "rd-p-003", prompt: "What problem do some remote workers experience regarding work-life balance?", opsi: ["Working shorter hours", "Difficulty separating work from home life", "Too many in-person meetings", "Lack of internet access"], jawaban: "Difficulty separating work from home life", penjelasan: "'find it harder to separate work life from home life'." },
  { id: "rd-012", skill: "reading", subSkill: "multiple-choice", level: "B2", tipe: "mcq", passageId: "rd-p-003", prompt: "What is a hybrid work arrangement, according to the passage?", opsi: ["Working only from home", "Working only in the office", "Splitting time between office and home", "Working different jobs simultaneously"], jawaban: "Splitting time between office and home", penjelasan: "'employees split their time between the office and home'." },
  { id: "rd-013", skill: "reading", subSkill: "sentence-summary-completion", level: "B2", tipe: "gap", passageId: "rd-p-003", prompt: "Early evidence suggests hybrid work is becoming the ___ choice for many employees with the option to choose.", jawaban: "preferred", caseSensitive: false, penjelasan: "Teks: 'becoming the preferred choice for a majority of employees who have the option'." },
];

// Catatan keterbatasan (lihat RANCANGAN-WEBSITE-BELAJAR-IELTS.md 11.4): Claude tidak bisa
// membuat file audio asli. Field `audio` sengaja null — transkrip singkat dimasukkan ke
// `prompt` supaya diagnostic tetap bisa dijalankan, tapi ini BUKAN pengganti audio asli
// (IELTS Listening rekaman hanya diputar sekali, dengan aksen & keraguan bicara alami).
// Sebelum dipakai serius, ganti `audio` dengan path file dari British Council free practice
// dan pangkas `prompt` supaya tidak lagi menyertakan transkrip.
const listeningQuestions: SeedQuestion[] = [
  { id: "ls-001", skill: "listening", subSkill: "angka-tanggal-ejaan", level: "A2", tipe: "gap", audio: null, prompt: '[Transkrip sementara — belum ada audio] "Can I take your name please?" "Yes, it\'s Sarah — S-A-R-A-H." "And your phone number?" "It\'s 0412 558 903." Berapa nomor telepon yang disebutkan?', jawaban: "0412 558 903", caseSensitive: false, penjelasan: "Nomor disebutkan langsung dalam transkrip: 0412 558 903." },
  { id: "ls-002", skill: "listening", subSkill: "form-completion", level: "A2", tipe: "gap", audio: null, prompt: '[Transkrip sementara] "We\'d like to book a table for four people, this Friday at 7pm, under the name Wilson." Hari apa reservasi ini dibuat?', jawaban: "Friday", caseSensitive: false, penjelasan: "Disebutkan 'this Friday at 7pm'." },
  { id: "ls-003", skill: "listening", subSkill: "angka-tanggal-ejaan", level: "B1", tipe: "gap", audio: null, prompt: '[Transkrip sementara] "What\'s your date of birth?" "It\'s the 3rd of March, 1994." Apa tanggal lahir penelepon?', jawaban: ["3 march 1994", "march 3 1994", "3rd march 1994"], caseSensitive: false, penjelasan: "Tanggal lahir: 3 Maret 1994." },
  { id: "ls-004", skill: "listening", subSkill: "form-completion", level: "A2", tipe: "mcq", audio: null, prompt: '[Transkrip sementara] "Could I get your postcode?" "It\'s 2010." Berapa kode pos pelanggan?', opsi: ["2010", "2001", "2100", "1020"], jawaban: "2010", penjelasan: "Disebutkan langsung: 2010." },
  { id: "ls-005", skill: "listening", subSkill: "multiple-choice", level: "B1", tipe: "mcq", audio: null, prompt: '[Transkrip sementara] Tour guide: "The museum closes at 5pm on weekdays, but on Saturdays it stays open until 8pm for evening visitors." Kapan museum tutup pada hari Sabtu?', opsi: ["5pm", "6pm", "7pm", "8pm"], jawaban: "8pm", penjelasan: "'on Saturdays it stays open until 8pm'." },
  { id: "ls-006", skill: "listening", subSkill: "map-diagram-labelling", level: "B1", tipe: "mcq", audio: null, prompt: '[Transkrip sementara] "Go past the fountain, and the information desk is on your right, just before the main entrance." Di mana letak meja informasi?', opsi: ["Left of the fountain", "Right of the fountain, before the entrance", "Inside the entrance", "Behind the fountain"], jawaban: "Right of the fountain, before the entrance", penjelasan: "'on your right, just before the main entrance', setelah melewati air mancur." },
  { id: "ls-007", skill: "listening", subSkill: "multiple-choice", level: "B1", tipe: "mcq", audio: null, prompt: '[Transkrip sementara] "Actually, the workshop has moved from Room 12 to Room 15 due to a scheduling clash." Sekarang workshop berada di ruangan mana?', opsi: ["Room 12", "Room 15", "Room 5", "Room 21"], jawaban: "Room 15", penjelasan: "Kata 'Actually' menandai koreksi — ruangan yang benar adalah 15, bukan 12." },
  { id: "ls-008", skill: "listening", subSkill: "note-summary-completion", level: "B2", tipe: "gap", audio: null, prompt: '[Transkrip sementara] "Today\'s lecture will focus on three main causes of soil erosion: deforestation, overgrazing, and poor irrigation practices." Berapa penyebab utama yang disebutkan dosen?', jawaban: ["3", "three"], caseSensitive: false, penjelasan: "Disebutkan langsung: 'three main causes'." },
  { id: "ls-009", skill: "listening", subSkill: "note-summary-completion", level: "B2", tipe: "gap", audio: null, prompt: '[Transkrip sementara] "The first phase of the project is expected to be completed within six months, followed by a three-month evaluation period." Berapa lama periode evaluasi?', jawaban: ["3 months", "three months"], caseSensitive: false, penjelasan: "'followed by a three-month evaluation period'." },
  { id: "ls-010", skill: "listening", subSkill: "matching", level: "B1", tipe: "mcq", audio: null, prompt: '[Transkrip sementara] "Sorry, I meant Tuesday, not Thursday, for the site visit." Hari apa sebenarnya kunjungan lokasi dilakukan?', opsi: ["Monday", "Tuesday", "Wednesday", "Thursday"], jawaban: "Tuesday", penjelasan: "'Sorry, I meant...' menandai ralat pembicara — jawaban benar Tuesday." },
];

const lessons = [
  { id: "ls-fase0-01", urutan: 1, fase: 0, judul: "Bunyi & Pengucapan Dasar", kontenMd: "44 fonem Inggris + IPA dasar + minimal pairs (ship/sheep, bad/bed). Sumber: buku/kanal yang dicatat di `sumber-terkunci.md`." },
  { id: "ls-fase0-02", urutan: 2, fase: 0, judul: "Alfabet & Ejaan", kontenMd: "Latihan spelling huruf demi huruf — penting untuk Listening (nama, kode pos, nomor telepon dieja lisan)." },
  { id: "ls-fase0-03", urutan: 3, fase: 0, judul: "Angka & Waktu", kontenMd: "Nomor telepon, harga, tanggal, jam, tahun, bilangan ordinal." },
  { id: "ls-fase0-04", urutan: 4, fase: 0, judul: "Kalimat Inti: S-V-O, To Be, Have/Has", kontenMd: "Pola kalimat dasar bahasa Inggris + there is/are." },
  { id: "ls-fase0-05", urutan: 5, fase: 0, judul: "Present & Past Simple", kontenMd: "Kata kerja beraturan + 100 irregular verbs paling sering muncul." },
];

async function main() {
  await pool.query(
    `INSERT INTO users (id, target_band) VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    ["adrian", 6.0]
  );

  for (const p of passages) {
    await pool.query(
      `INSERT INTO passages (id, section, judul, teks, sumber) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET section = EXCLUDED.section, judul = EXCLUDED.judul,
                                        teks = EXCLUDED.teks, sumber = EXCLUDED.sumber`,
      [p.id, p.section, p.judul, p.teks, p.sumber]
    );
  }

  const allQuestions = [...grammarQuestions, ...readingQuestions, ...listeningQuestions];
  for (const q of allQuestions) {
    await pool.query(
      `INSERT INTO questions (id, skill, sub_skill, level, tipe, prompt, audio, passage_id, opsi, jawaban, case_sensitive, penjelasan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET skill = EXCLUDED.skill, sub_skill = EXCLUDED.sub_skill,
         level = EXCLUDED.level, tipe = EXCLUDED.tipe, prompt = EXCLUDED.prompt, audio = EXCLUDED.audio,
         passage_id = EXCLUDED.passage_id, opsi = EXCLUDED.opsi, jawaban = EXCLUDED.jawaban,
         case_sensitive = EXCLUDED.case_sensitive, penjelasan = EXCLUDED.penjelasan`,
      [
        q.id,
        q.skill,
        q.subSkill,
        q.level,
        q.tipe,
        q.prompt,
        q.audio ?? null,
        q.passageId ?? null,
        q.opsi ? JSON.stringify(q.opsi) : null,
        JSON.stringify(q.jawaban),
        q.caseSensitive ?? false,
        q.penjelasan,
      ]
    );
  }

  for (const l of lessons) {
    await pool.query(
      `INSERT INTO lessons (id, urutan, judul, konten_md, fase) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET urutan = EXCLUDED.urutan, judul = EXCLUDED.judul,
                                        konten_md = EXCLUDED.konten_md, fase = EXCLUDED.fase`,
      [l.id, l.urutan, l.judul, l.kontenMd, l.fase]
    );
  }

  console.log(
    `Seed selesai: ${passages.length} passage, ${allQuestions.length} soal, ${lessons.length} lesson.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
