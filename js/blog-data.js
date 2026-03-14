/**
 * WhisperMe Blog — article data
 * Used by blog.html and blog-article.html
 */
window.BLOG_AUTHORS = {
  'Avinash Saini': {
    name: 'Avinash Saini',
    role: 'Co-founder, WhisperMe',
    bio: 'Builder and designer focused on privacy-first communication. Previously led product at early-stage startups.',
    avatar: 'AS'
  },
  'WhisperMe Team': {
    name: 'WhisperMe Team',
    role: 'Product & Engineering',
    bio: 'The team building WhisperMe — a voice-first social platform for authentic human connection.',
    avatar: 'WM'
  },
  'Himanshu Kumar Sha': {
    name: 'Himanshu Kumar Sha',
    role: 'Writer & Community',
    bio: 'Obsessed with how technology shapes human behavior. Writes about privacy, identity, and the future of social.',
    avatar: 'HK'
  }
};

window.BLOG_POSTS = [
  {
    slug: 'anonymous-communication-future',
    category: 'Privacy',
    title: 'Why Anonymous Communication is the Future of Social Media',
    excerpt: "As identity-driven platforms hit their limits, a new wave of privacy-first social tools is emerging to give people their voice back.",
    author: 'Avinash Saini',
    authorKey: 'Avinash Saini',
    readTime: '5 min read',
    publishedDate: '2025-12-15',
    icon: '🔒',
    gradient: 'linear-gradient(135deg,#1C1A18,#3a1a2a)',
    body: `<p>For years, social media has been built on a simple premise: you are your identity. Your name, your face, your connections — these define who you are online. Every post is tied to your profile. Every like is public. Every comment can be traced back to you. But that model is cracking under its own weight.</p>
      <h2>The pressure to perform</h2>
      <p>Public shaming, cancel culture, and the pressure to perform have made many people afraid to speak honestly. They fear judgment from employers, strangers, and even friends. The result? Sanitized feeds, performative posts, and a growing sense that something essential has been lost. We've optimized for engagement at the cost of authenticity.</p>
      <blockquote>When identity is optional, people can explore ideas, share vulnerable moments, and connect without the weight of their reputation.</blockquote>
      <p>Anonymous and pseudonymous communication offers a different path. Communities form around shared interests rather than social graphs. The conversation shifts from "who said it" to "what was said." Ideas stand on their own. Voices matter more than profiles.</p>
      <hr>
      <h2>Why now</h2>
      <p>Gen Z grew up with screens but also with burnout from performative culture. Remote work normalized voice-first tools. Privacy regulations are forcing platforms to rethink data. The timing has never been better for a shift toward optional identity.</p>
      <h2>Building for the future</h2>
      <p>At WhisperMe, we're building for this future — one where voice carries emotion without carrying your LinkedIn profile. Because sometimes, the most authentic thing you can do is speak without a name. We're not asking people to hide. We're giving them the choice to show up as themselves, or as an idea, or as both.</p>`
  },
  {
    slug: 'voice-vs-text-audio-frontier',
    category: 'Social Media Future',
    title: 'Voice vs Text: Why Audio is the Next Frontier for Social Platforms',
    excerpt: "Text strips emotion. Voice carries humanity. Here's why voice-first social is ready to go mainstream in 2026.",
    author: 'WhisperMe Team',
    authorKey: 'WhisperMe Team',
    readTime: '4 min read',
    publishedDate: '2025-12-08',
    icon: '🎙️',
    gradient: 'linear-gradient(135deg,#1a2a3a,#2a1a4a)',
    body: `<p>Text has dominated the internet for decades. Emails, tweets, posts, DMs — we've trained ourselves to compress emotion into characters. We've learned to read between the lines, to decode tone from punctuation, to guess intent from context. But something is always lost in translation.</p>
      <h2>Why voice matters</h2>
      <p>Voice carries tone, pause, emphasis, and warmth. A simple "I'm fine" can mean entirely different things depending on how it's said. In text, we compensate with emojis, punctuation, and caps — but it's never quite the same. You can't hear the hesitation. You can't feel the smile. You can't sense when someone is holding back.</p>
      <blockquote>The future of connection isn't more characters — it's more humanity.</blockquote>
      <p>Voice-first social isn't new — podcasting and Clubhouse proved the appetite. What's changed is the technology. Better compression, lower latency, and mobile-first design have made real-time voice as easy as texting. The infrastructure is ready. The behavior is shifting.</p>
      <hr>
      <h2>The case for voice-first</h2>
      <p>Voice reduces friction. No typing, no editing, no second-guessing every word. It's faster for long-form expression. It's more inclusive for those who struggle with text. And when combined with optional identity, it creates a space where people speak more freely than they ever could in a feed.</p>
      <h2>What comes next</h2>
      <p>The next generation of social apps will default to speaking, with text as a fallback, not the other way around. We're building WhisperMe to be part of that shift. Not replacing text — augmenting it. Giving people another way to connect when words on a screen aren't enough.</p>`
  },
  {
    slug: 'building-whisperme-90-days',
    category: 'Startup Journey',
    title: 'Building WhisperMe: What We Learned in the First 90 Days',
    excerpt: "A behind-the-scenes look at the challenges, pivots, and breakthroughs of building a voice-first social startup from scratch.",
    author: 'Avinash Saini',
    authorKey: 'Avinash Saini',
    readTime: '6 min read',
    publishedDate: '2025-11-28',
    icon: '🚀',
    gradient: 'linear-gradient(135deg,#1a3a2a,#2a4a1a)',
    body: `<p>Day one felt like jumping off a cliff. Two founders, a Figma file, and a lot of conviction. No code, no users, no proof that anyone would care. Ninety days later, we have a working beta, real users, and a list of lessons that would fill another post. Here are the three that changed everything.</p>
      <h2>Lesson one: voice is harder than text</h2>
      <p>Every platform optimizes for text — keyboards, autocorrect, copy-paste. Voice requires new UI patterns, new performance budgets, and new user expectations. We spent weeks on things that would be trivial in a text app: latency, echo cancellation, background noise, network drops. Users notice 100ms of delay. They notice when their voice sounds robotic. We learned to obsess over details that text apps never had to consider.</p>
      <h2>Lesson two: privacy sells</h2>
      <p>When we added anonymous voice rooms, engagement didn't just increase — it transformed. People who never spoke in identity-based rooms opened up. The same users who lurked in other apps were leading conversations here. We hadn't expected it to matter that much. We were wrong.</p>
      <blockquote>The product validated itself the moment we made identity optional.</blockquote>
      <p>Privacy wasn't a feature. It was the foundation. Once we understood that, everything else fell into place.</p>
      <hr>
      <h2>Lesson three: community takes time</h2>
      <p>We launched too early. We learned from feedback. We iterated. The best features came from users who believed in the vision before we did. The first 100 users taught us more than any roadmap. Here's to the next 90 days — and to everyone who showed up when we had nothing but a promise.</p>`
  },
  {
    slug: 'whisperme-private-beta',
    category: 'Product Updates',
    title: "WhisperMe Private Beta: What's Inside and What's Coming Next",
    excerpt: "An early look at our beta features — anonymous voice rooms, whisper threads, and the community tools we're shipping next.",
    author: 'WhisperMe Team',
    authorKey: 'WhisperMe Team',
    readTime: '3 min read',
    publishedDate: '2025-11-15',
    icon: '✨',
    gradient: 'linear-gradient(135deg,#2a1a1a,#4a2a1a)',
    body: `<p>Our private beta is live, and we're excited to share what's in it and what's on the roadmap. If you're reading this, you're either in the beta or thinking about joining. Here's what you can expect.</p>
      <h2>Anonymous Voice Rooms</h2>
      <p>Join a room, pick a voice, and speak. No profile, no history, no judgment. Conversations reset when you leave. This is the core of WhisperMe: ephemeral, authentic, human. You show up as a voice. You leave as a memory. Nothing is stored, nothing is searchable, nothing follows you.</p>
      <h2>Whisper Threads</h2>
      <p>Voice messages that feel like a private conversation. Send a whisper to a thread; others can listen and reply in kind. Think of it as a voice-first Reddit or Discord, but lighter. Topics, not identities. Ideas, not clout. Threads that disappear when the conversation is done.</p>
      <blockquote>If you're in the beta, your feedback is shaping the product. Thank you.</blockquote>
      <p>Every bug report, every feature request, every "this would be better if" — we're listening. The product you're using today is different because of the people who showed up early.</p>
      <hr>
      <h2>What's next</h2>
      <p>We're working on mood-based discovery, better moderation tools, and integrations that keep your identity separate from your expression. We're also exploring ways to make rooms more discoverable without sacrificing privacy. The roadmap is fluid. The principles aren't. Voice first. Identity optional. Always.</p>`
  },
  {
    slug: 'toxicity-problem-social-reset',
    category: 'Privacy',
    title: 'The Toxicity Problem: Why Social Media Needs a Reset',
    excerpt: "Public shaming, cancel culture, and identity exposure have made people afraid to speak online. It's time for something different.",
    author: 'Himanshu Kumar Sha',
    authorKey: 'Himanshu Kumar Sha',
    readTime: '7 min read',
    publishedDate: '2025-11-02',
    icon: '💭',
    gradient: 'linear-gradient(135deg,#1a1a3a,#3a1a5a)',
    body: `<p>The internet was supposed to connect us. Instead, it's made many of us more isolated, more anxious, and more afraid to speak our minds.</p>
      <h2>Weaponized shaming</h2>
      <p>Public shaming isn't new — but social media has weaponized it. A single tweet can end a career. A viral screenshot can follow you for years. The permanent, searchable nature of identity-based platforms means that mistakes — or even unpopular opinions — can have lasting consequences.</p>
      <blockquote>Cancel culture is a symptom, not the disease. The disease is a system built on permanent identity and algorithmic amplification of conflict.</blockquote>
      <h2>Toward a reset</h2>
      <p>A reset doesn't mean abandoning accountability. It means creating spaces where people can explore, stumble, and grow without fear of a permanent record. That's what we're building.</p>`
  },
  {
    slug: 'two-founders-one-vision',
    category: 'Startup Journey',
    title: 'Two Founders, One Vision: The WhisperMe Origin Story',
    excerpt: "How two builders from India decided to tackle one of the internet's biggest unsolved problems — authentic human expression.",
    author: 'Avinash Saini',
    authorKey: 'Avinash Saini',
    readTime: '5 min read',
    publishedDate: '2025-10-20',
    icon: '🌍',
    gradient: 'linear-gradient(135deg,#2a3a1a,#1a4a2a)',
    body: `<p>It started with a frustration we couldn't shake: the best conversations we'd ever had were voice-to-voice, often anonymous, always ephemeral. Text and identity-based social platforms never captured that.</p>
      <h2>Two builders from India</h2>
      <p>We're two builders from India — different backgrounds, same obsession. We'd both seen how voice changes the dynamics of communication. In voice, you can't edit yourself into perfection. You show up as you are. And when identity is optional, people show up more honestly.</p>
      <blockquote>Build a place where voice comes first and identity comes second. Where connection matters more than clout.</blockquote>
      <hr>
      <h2>The vision</h2>
      <p>That vision became WhisperMe. We're still early. But we're building in public, and we're building for the future we want to see. Thanks for being here.</p>`
  }
];

/** Get related posts (same category or random) excluding current slug */
window.getRelatedPosts = function(slug, limit) {
  limit = limit || 3;
  var current = window.BLOG_POSTS.find(function(p) { return p.slug === slug; });
  if (!current) return window.BLOG_POSTS.slice(0, limit);
  var sameCat = window.BLOG_POSTS.filter(function(p) {
    return p.slug !== slug && p.category === current.category;
  });
  var other = window.BLOG_POSTS.filter(function(p) {
    return p.slug !== slug && p.category !== current.category;
  });
  return sameCat.concat(other).slice(0, limit);
};
