import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ARTICLES = [
  {
    title: "Why We Started SaveCounterStrike",
    slug: "why-we-started-savecounterstrike",
    excerpt:
      "The story behind the petition — why the CS2 community needs to unite and demand better anti-cheat from Valve.",
    coverImage:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=630&fit=crop",
    featured: true,
    tags: ["Anti-Cheat", "Community", "Open Letter"],
    content: `
<h2>The Breaking Point</h2>
<p>If you've played Counter-Strike 2 in the past year, you already know. The spinbotters in Premier. The wallhackers in casual. The aim-assisted "legit cheaters" who somehow hit every shot through smoke. It's not a new problem — but it's never been this bad.</p>

<p>We started SaveCounterStrike because we hit our breaking point. After thousands of hours invested in this game — the game that defined competitive FPS — we couldn't keep pretending everything was fine. <strong>Counter-Strike deserves better. The community deserves better.</strong></p>

<h2>The Numbers Tell the Story</h2>
<p>Let's talk facts:</p>
<ul>
  <li>CS2 generates an estimated <strong>$2.8 billion annually</strong> through case keys, Steam Market fees, and operations</li>
  <li>VAC bans are at an all-time high — not because the anti-cheat is better, but because there are <strong>more cheaters than ever</strong></li>
  <li>Free-to-play CS2 accounts can be created in minutes, meaning banned cheaters are back in your games within the hour</li>
  <li>Meanwhile, competitors like Valorant launched with kernel-level anti-cheat from day one — and it works</li>
</ul>

<p>Valve is making billions from Counter-Strike while investing the bare minimum in protecting the competitive integrity of the game. That's not just disappointing — it's disrespectful to every player who takes the game seriously.</p>

<h2>What Is SaveCounterStrike?</h2>
<p>This isn't just a website. It's a <strong>community-driven movement</strong> with one clear goal: get Valve to invest in a modern anti-cheat system for CS2.</p>

<p>Here's what we're doing:</p>
<ul>
  <li><strong>The Petition</strong> — Sign with your Steam account. Every signature is verified and goes into the open letter.</li>
  <li><strong>The Open Letter</strong> — A formal letter to Valve, backed by thousands of signatures, delivered on <strong>August 31, 2026</strong>.</li>
  <li><strong>Community Opinions</strong> — Vote on the issues that matter most. The top-voted concerns go into the letter.</li>
  <li><strong>Media Evidence</strong> — Share clips and screenshots of cheaters. Document the epidemic.</li>
  <li><strong>Revenue Tracker</strong> — Real-time estimates of how much Valve earns while cheaters go unpunished.</li>
</ul>

<h2>The Open Letter — August 31, 2026</h2>
<p>Every signature on this petition becomes part of an open letter delivered directly to Valve Corporation. This isn't a Reddit post that gets buried. This isn't a Twitter thread that gets forgotten. This is a <strong>formal, organized demand</strong> from the community.</p>

<p>The letter will include:</p>
<ul>
  <li>The total number of signatures and who signed</li>
  <li>The community's top-voted issues and requests</li>
  <li>Revenue data showing what Valve earns vs. what they invest in anti-cheat</li>
  <li>A clear set of demands for improvement</li>
</ul>

<h2>This Is Open Source</h2>
<p>SaveCounterStrike is completely open source. Every line of code is on <a href="https://github.com/KasheK420/savecounterstrike" target="_blank" rel="noopener noreferrer">GitHub</a>. We have nothing to hide. No hidden agendas. No monetization. Just a community that loves Counter-Strike and refuses to watch it die to cheaters.</p>

<p>If you're a developer, designer, or content creator — we welcome contributions. This is <em>our</em> project, built by the community, for the community.</p>

<h2>What You Can Do Right Now</h2>
<ol>
  <li><strong>Sign the petition</strong> — It takes 10 seconds with your Steam account</li>
  <li><strong>Share this site</strong> — Every signature matters. Tell your friends, your team, your Discord</li>
  <li><strong>Submit your opinion</strong> — What do you want Valve to fix? Vote on what matters most</li>
  <li><strong>Upload evidence</strong> — Got a clip of a blatant cheater? Share it</li>
</ol>

<p>Counter-Strike has been the king of competitive FPS for over 20 years. We're not ready to let it die because Valve won't invest in anti-cheat. <strong>Are you?</strong></p>
    `.trim(),
  },
  {
    title: "CS2 Anti-Cheat: What Valve Could Do (But Won't)",
    slug: "cs2-anti-cheat-what-valve-could-do",
    excerpt:
      "A technical breakdown of modern anti-cheat solutions and why Valve's VAC system falls behind every major competitor.",
    coverImage:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop",
    featured: false,
    tags: ["Anti-Cheat", "VAC", "Analysis"],
    content: `
<h2>The State of VAC in 2026</h2>
<p>Valve Anti-Cheat (VAC) was revolutionary when it launched in 2002. It was one of the first automated anti-cheat systems in online gaming. But that was <strong>24 years ago</strong>. The cheating landscape has evolved dramatically — and VAC hasn't kept up.</p>

<p>VAC operates primarily as a <strong>signature-based detection system</strong>. It scans for known cheat signatures in memory — essentially an antivirus for game cheats. The problem? Modern cheats are polymorphic, kernel-level, and constantly updated. By the time VAC detects a cheat, thousands of players have already been affected.</p>

<h2>What the Competition Does Better</h2>

<h3>Riot Vanguard (Valorant)</h3>
<p>Love it or hate it, Riot's Vanguard is effective. It runs at the <strong>kernel level</strong>, starting at boot time, which means:</p>
<ul>
  <li>It can detect cheats that operate below the game's process</li>
  <li>Hardware-level identification makes ban evasion extremely difficult</li>
  <li>Real-time monitoring catches cheats before they can affect gameplay</li>
</ul>
<p>The result? Valorant's competitive integrity is significantly better than CS2's. You <em>can</em> encounter cheaters, but it's rare compared to the epidemic in CS2.</p>

<h3>Easy Anti-Cheat (Fortnite, Apex Legends)</h3>
<p>EAC combines kernel-level detection with behavioral analysis. It doesn't just look for known cheats — it looks for <strong>impossible behavior</strong>. Inhuman reaction times, perfect tracking through walls, statistical anomalies that no legitimate player would produce.</p>

<h3>BattlEye (PUBG, Rainbow Six Siege)</h3>
<p>BattlEye takes a similar approach with deep system scanning and hardware fingerprinting. When you get banned in Siege, your <strong>hardware ID</strong> is flagged — making it extremely costly to create a new account.</p>

<h2>What Valve Could Implement Tomorrow</h2>

<h3>1. Kernel-Level Anti-Cheat</h3>
<p>This is the elephant in the room. Every major competitive FPS except CS2 uses kernel-level anti-cheat. Valve has the resources — they just haven't done it.</p>
<p>The privacy argument doesn't hold water anymore. Millions of players voluntarily run Vanguard, EAC, and BattlEye. The gaming community has shown that they're willing to accept kernel-level anti-cheat for a fair competitive experience.</p>

<h3>2. Hardware Bans</h3>
<p>Currently, a banned CS2 cheater can create a new free account and be back in competitive within minutes. <strong>Hardware bans</strong> would link bans to the physical components of a player's machine — motherboard, GPU, network adapter.</p>
<p>Yes, hardware IDs can be spoofed. But it raises the barrier from "click a button" to "need specialized tools and knowledge," which eliminates the vast majority of casual cheaters.</p>

<h3>3. Phone Number Verification for Competitive</h3>
<p>Valve already has Prime status, but it's not enough. Requiring a <strong>unique phone number</strong> tied to a mobile carrier (not VoIP) for competitive play would dramatically reduce smurf and cheater accounts.</p>

<h3>4. AI-Powered Behavioral Analysis</h3>
<p>Machine learning has advanced enormously. Valve could implement systems that analyze:</p>
<ul>
  <li><strong>Aim patterns</strong> — distinguishing human micro-corrections from aimbot snapping</li>
  <li><strong>Information usage</strong> — detecting when players consistently act on information they shouldn't have (wallhack detection)</li>
  <li><strong>Statistical anomalies</strong> — flagging accounts with impossibly high headshot rates or win streaks</li>
</ul>
<p>This wouldn't replace VAC — it would supplement it, catching "legit cheaters" who currently fly under the radar.</p>

<h3>5. Overwatch 2.0</h3>
<p>CS:GO's Overwatch system was community-powered review of reported players. It worked, but Valve abandoned it in CS2. A modernized version with:</p>
<ul>
  <li>AI pre-screening to prioritize obvious cases</li>
  <li>Replay system with X-ray and statistics overlay</li>
  <li>Rewards for accurate reviewers</li>
  <li>Faster turnaround from report to ban</li>
</ul>

<h2>Why Won't Valve Do It?</h2>
<p>The cynical answer: <strong>cheaters are profitable</strong>. Every banned account that buys a new Prime status, every cheater who opens cases on a fresh account, every ban wave that temporarily boosts the player count — it all generates revenue.</p>

<p>The charitable answer: Valve's flat organizational structure means projects only happen when employees choose to work on them. Anti-cheat is unglamorous, never-ending work. It's easier to ship a new weapon case than to fight an arms race with cheat developers.</p>

<p>Either way, the result is the same: <strong>CS2 players suffer while Valve profits</strong>.</p>

<h2>What We're Asking For</h2>
<p>We're not asking Valve to solve cheating overnight. We're asking them to <strong>invest seriously</strong> in the problem. Hire a dedicated anti-cheat team. Implement kernel-level detection. Add hardware bans. Use the billions CS2 generates to protect the game that generates those billions.</p>

<p>The technology exists. The solutions are proven. The only thing missing is Valve's willingness to act.</p>

<p><strong>Sign the petition. Make your voice heard. August 31, 2026.</strong></p>
    `.trim(),
  },
];

async function main() {
  console.log("Seeding articles...");

  for (const article of ARTICLES) {
    const existing = await db.article.findUnique({
      where: { slug: article.slug },
    });

    if (existing) {
      console.log(`  Skipping "${article.title}" — already exists`);
      continue;
    }

    await db.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        coverImage: article.coverImage,
        published: true,
        featured: article.featured,
        publishedAt: new Date(),
        tags: {
          connectOrCreate: article.tags.map((tag) => ({
            where: {
              slug: tag
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
            },
            create: {
              name: tag,
              slug: tag
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
            },
          })),
        },
      },
    });

    console.log(`  Created "${article.title}"`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
