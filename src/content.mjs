// Site content: profile, projects, now, experience, education, awards. English first, Chinese second.
// Sources: CV, itch.io pages, GitHub READMEs and project sites. Facts only; null where unknown.
// `private: true` marks work that has no other public page yet.
// `cover`: 640 px wide JPEG in assets/covers/, or null.

const ITCH = "https://dazi77.itch.io/";
const GH = "https://github.com/jinda-li/";

export const PROFILE = {
  name: "Jinda Li",
  alias: "dazi",
  location: "Helsinki, Finland",
  tagline: {
    en: "I build games that feel good to be inside.",
    zh: "我做让人待着舒服的游戏。",
  },
  tagline2: {
    en: "A game developer who tries a lot.",
    zh: "一个什么都想试试的游戏开发者。",
  },
  bio: {
    en: [
      "I'm Jinda Li, also known as dazi, a game developer in Helsinki. I make soft, cute, self-contained little worlds that live by time and light: dusk, long nights, light on a lake. I want them to be low-pressure places where friends find each other and simply have a good time.",
      "I make them with code, shaders and simulation, and lately with AI tools as well. I have worked from research to shipping: AR and VR tools at Microsoft, emotional AI characters at Supercell AI Lab, combat design on Naraka: Bladepoint at NetEase, and game operations at Huawei.",
      "I studied game design at Aalto University, and now work there on XR interaction, real-time graphics and agent-based production pipelines. I also run Fairy Tea Time, a tiny studio for low-pressure games. Its first game, Flow Treehouse, is on its way to Steam.",
    ],
    zh: [
      "我是 Jinda Li，也叫达子，在赫尔辛基做游戏。我做柔软、可爱、自洽的小世界，它们和时间、和光有关：黄昏、长夜、湖面上的光。我希望它们是朋友之间低压力相遇的地方，大家来待一会儿，一起玩得开心。",
      "我用代码、shader、模拟，最近也用 AI 工具来做这些。从研究到上架都做过：在微软做 AR 和 VR 工具，在 Supercell AI Lab 做有情感的 AI 角色，在网易给《永劫无间》做战斗策划实习，在华为做游戏运营。",
      "我在阿尔托大学读的游戏设计，现在在那里做 XR 交互、实时图形和 agent 化的生产流程。我还开了一个很小的工作室 Fairy Tea Time，专做低压力的游戏，第一款《心灵树屋》正在准备上 Steam。",
    ],
  },
  links: [
    { label: "itch.io", href: "https://dazi77.itch.io/" },
    { label: "GitHub", href: "https://github.com/jinda-li" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jinda-li/" },
  ],
};

/** The order of the favourites at the top of the work page. */
export const FEATURED = ["ukemixr", "microsoft-mr", "a-line", "the-near-world", "flow-treehouse", "mushroom-collector", "the-winter-of-us", "emergence"];

export const PROJECTS = [
  // ---------- featured ----------
  {
    id: "a-line",
    title: { en: "A-Line", zh: "A-Line" },
    year: 2026, kind: "game", status: "prototype", private: false, featured: true,
    line: {
      en: "Your AI character moves into a shared world with your friends' characters, and they get to know each other.",
      zh: "你创造的 AI 角色和朋友们的角色住进同一个世界，慢慢认识彼此。",
    },
    about: {
      en: "A nine-week project at Supercell AI Lab. The characters socialise, remember things, form opinions and change over time. They go to the sauna together, sing around a fire and play tricks on each other. It began as a hackathon prototype where private AI assistants could make friends and fall in love, which took second place worldwide in the Supercell AI Game Hackathon Open Challenge.",
      zh: "Supercell AI Lab 的九周项目。角色们会社交、记事、形成自己的看法，也会随时间改变。它们一起蒸桑拿，围着火唱歌，互相恶作剧。最早是一个黑客松原型，让私人 AI 助手之间也能交朋友、谈恋爱，拿了 Supercell AI Game Hackathon Open Challenge 全球第二名。",
    },
    role: null,
    tech: ["Unity", "C#", "LLM agents", "TypeScript"],
    links: [
      { label: "Landing page", href: "https://a-line-ai-makes-ai-friends-912116732697.us-west1.run.app/" },
      { label: "AI social map demo", href: "https://a-line-685075400377.us-west1.run.app" },
      { label: "Source (web demo)", href: GH + "ALineWebDemo" },
    ],
    cover: "assets/covers/a-line.jpg",
  },
  {
    id: "flow-treehouse",
    title: { en: "Flow Treehouse", zh: "心灵树屋" },
    year: 2026, kind: "game", status: "in-progress", private: true, featured: true,
    line: {
      en: "A tiny treehouse in the corner of your desktop, where three fairies keep you company while you work.",
      zh: "贴在桌面角落的一间小树屋，三只精灵陪你干活。",
    },
    about: {
      en: "The first game from my studio Fairy Tea Time, on its way to Steam. Prince Tomato times your focus, Todudu keeps your to-dos, and Lily plays soft music. Focusing and finishing tasks earns wish points for outfits, playlists and decorations. As the treehouse grows, new fairies move in.",
      zh: "我的小工作室 Fairy Tea Time 的第一款游戏，正在准备上 Steam。番茄王子帮你计时专注，兔嘟嘟替你记着待办，铃兰为你放轻轻的歌。专注和完成待办能攒许愿值，换装扮、歌单和树屋装饰。树屋一级级长大，精灵们也陆续搬进来。",
    },
    role: {
      en: "Founder and lead programmer. Design, code, production and publishing.",
      zh: "创始人、主程。设计、代码、制作、发行都自己来。",
    },
    tech: ["Godot", "C#", "GDScript"],
    links: [],
    cover: "assets/covers/flow-treehouse.jpg",
  },
  {
    id: "emergence",
    title: { en: "Emergence", zh: "涌现" },
    year: 2026, kind: "film", status: "released", private: false, featured: true,
    line: {
      en: "A four-and-a-half-minute short film made entirely from code.",
      zh: "一部四分半、完全由代码生成的短片。",
    },
    about: {
      en: "It goes from games, to minds, to civilisations, and is about emergence. There is no camera and no recorded sound: every frame is drawn with WebGL and every note is synthesised in Python. Claude Opus 5.5 wrote, directed, scored and rendered it. The theme came from the TapTap Spotlight GameJam 2026 prompt.",
      zh: "从游戏，到心智，到文明，讲「涌现」。没有摄像机，也没有录音：每一帧都用 WebGL 画出来，每个音符都用 Python 合成。整部片由 Claude Opus 5.5 编剧、导演、配乐和渲染。题目来自 TapTap 聚光灯 GameJam 2026 的命题。",
    },
    role: null,
    tech: ["WebGL", "JavaScript", "Python", "Claude Opus 5.5"],
    links: [
      { label: "Watch on YouTube", href: "https://youtu.be/bgAs9qyfhXI" },
      { label: "Source", href: GH + "Emergence" },
    ],
    cover: "assets/covers/emergence.jpg",
  },
  {
    id: "the-winter-of-us",
    title: { en: "The Winter Of Us", zh: "The Winter Of Us" },
    year: 2026, kind: "game", status: "released", private: false, featured: true,
    line: {
      en: "Snow has fallen. A winter adventure for two players.",
      zh: "下雪了，来一场两个人的冬天冒险。",
    },
    about: {
      en: "A local co-op game for two. You build snowmen together, have snowball fights and race down the slopes on sleds. It is small and cosy, made for playing side by side with a friend.",
      zh: "一个本地双人合作游戏。两个人一起堆雪人、打雪仗，坐雪橇从坡上冲下去。小小的、暖暖的，适合和朋友并排坐着玩。",
    },
    role: null,
    tech: [],
    links: [{ label: "itch.io (Windows)", href: ITCH + "the-winter-of-us" }],
    cover: "assets/covers/the-winter-of-us.jpg",
  },
  {
    id: "a-clouds-adventure",
    title: { en: "A Cloud's Adventure", zh: "云游" },
    year: 2025, kind: "research", status: "prototype", private: true, featured: false,
    line: {
      en: "A soft cloud you can play as, simulated and rendered in real time.",
      zh: "一朵可以操控的云，实时模拟，实时渲染。",
    },
    about: {
      en: "My master's thesis at Aalto. The cloud is built in Unreal from GPU particles and a position-based dynamics solver I wrote myself, then ray-marched as a volume. It moves, changes shape and rains, and runs at 60 FPS on a laptop. My breakdown of the cloud tech is one of my best-received posts on LinkedIn.",
      zh: "我在阿尔托的硕士毕设。云在 Unreal 里做，用 GPU 粒子加自己写的 PBD 解算，再用 ray-march 做体积渲染。它会动，会变形，会下雨，在笔记本上也能跑到 60 FPS。云的技术拆解是我在 LinkedIn 上反响最好的帖子之一。",
    },
    role: { en: "Solo, as a master's thesis.", zh: "独立完成，硕士论文项目。" },
    tech: ["Unreal Engine", "GPU particles", "Position-based dynamics", "Ray marching"],
    links: [],
    cover: "assets/covers/a-clouds-adventure.jpg",
  },
  {
    id: "mushroom-collector",
    title: { en: "Mushroom Collector", zh: "Mushroom Collector" },
    year: 2025, kind: "game", status: "prototype", private: false, featured: true,
    line: {
      en: "The mushroom-picking season never ends.",
      zh: "采蘑菇的季节永远不会结束。",
    },
    about: {
      en: "An exploration game about finding and identifying mushrooms. You only learn what a mushroom does by eating it, and then you cook a pot of mushroom soup. In December 2025 it was shown at Aalto Demo Day, with new mushroom paragliders, bouncy mushrooms and NPCs to meet. Playable in the browser.",
      zh: "一个认蘑菇、采蘑菇的探索游戏。每种蘑菇有什么用，只有吃下去才知道，最后煮一锅蘑菇汤。2025 年 12 月在 Aalto Demo Day 展出，新加了蘑菇滑翔伞、弹跳蘑菇和可以遇见的 NPC。可以直接在浏览器里玩。",
    },
    role: null,
    tech: ["Unity", "WebGL"],
    links: [{ label: "Play in browser (itch.io)", href: ITCH + "mushroom-collector" }],
    cover: "assets/covers/mushroom-collector.jpg",
  },

  // ---------- 2026 ----------
  {
    id: "microsoft-mr",
    title: { en: "Mixed Reality at Microsoft", zh: "在微软做混合现实" },
    year: "2024–25", kind: "xr", status: null, private: false, featured: true,
    line: {
      en: "Holograms, eye tracking and night vision in an AR-in-VR simulator, and hand-gesture apps for HoloLens 2.",
      zh: "AR-in-VR 模拟器里的全息、眼动和夜视，还有 HoloLens 2 上的手势交互应用。",
    },
    about: {
      en: [
        "For a year I was a Unity developer in Microsoft's Mixed Reality team. I built a cross-platform AR-in-VR simulator for research, so an AR experience could be tried inside VR, with hologram rendering, eye tracking and night vision.",
        "I also made hand-gesture apps for HoloLens 2, kept six to eight camera streams running on a headset at a steady 40+ FPS, and improved a Wave Function Collapse city generator with the Job System and Burst.",
      ],
      zh: [
        "我在微软混合现实团队做了一年 Unity 开发。做了一个研究用的跨平台 AR-in-VR 模拟器，让 AR 体验可以先在 VR 里试，带全息渲染、眼动追踪和夜视。",
        "还做了 HoloLens 2 的手势交互应用，让头显同时跑 6 到 8 路相机、稳定在 40 FPS 以上，并用 Job System 和 Burst 改进了一个波函数坍缩（WFC）城市生成器。",
      ],
    },
    role: { en: "Unity developer", zh: "Unity 开发" },
    tech: ["Unity", "C#", "HoloLens 2", "MRTK", "Job System", "Burst"],
    links: [],
    cover: "assets/covers/microsoft-mr.jpg",
  },
  {
    id: "ukemixr",
    title: { en: "UkemiXR", zh: "UkemiXR" },
    year: 2026, kind: "xr", status: "in-progress", private: false, featured: true,
    line: {
      en: "VR without motion sickness, so the impossible becomes playable.",
      zh: "不晕的 VR，让原本做不了的体验变得能玩。",
    },
    about: {
      en: [
        "UkemiXR turns twenty years of Aalto VR research into a company, funded by a Business Finland R2B grant. Its comfort method, patent pending, removes motion sickness even in fast full-body action: in tests, ten out of ten players felt no nausea.",
        "On top of it we make games, like the soulslike Akashi Soul and Cycle Path, and Ukemi XR Spaces, real places captured with Gaussian splatting that anyone can walk from a link or a headset.",
        "I am the team's creative technologist: AI development, game and product design. I build Cycle Path, our AI tooling and the website.",
      ],
      zh: [
        "UkemiXR 把阿尔托二十年的 VR 研究变成一家公司，拿到了 Business Finland 的 R2B 资助。我们的舒适度方法正在申请专利，即使是激烈的全身动作也不会晕：测试里十个玩家十个都没有不适。",
        "在这之上我们做游戏，比如类魂的 Akashi Soul 和 Cycle Path；也做 Ukemi XR Spaces，用高斯泼溅扫描的真实空间，点开链接或戴上头显就能走进去。",
        "我在团队里是创意技术专家，负责 AI 开发、游戏和产品设计。Cycle Path、我们的 AI 工具链和官网都是我做的。",
      ],
    },
    role: { en: "Creative technologist: AI development, game and product design", zh: "创意技术专家：AI 开发、游戏和产品设计" },
    tech: ["Unity", "VR", "Gaussian splatting", "AI agents", "Web"],
    links: [{ label: "ukemixr.pages.dev", href: "https://ukemixr.pages.dev" }],
    cover: "assets/covers/ukemixr.jpg",
  },
  {
    id: "false-color",
    title: { en: "FALSE COLOR", zh: "FALSE COLOR" },
    year: 2026, kind: "film", status: "prototype", private: true, featured: false,
    line: {
      en: "A 72-second trailer for a thermal-camera horror game.",
      zh: "一支 72 秒的热成像恐怖游戏宣传片。",
    },
    about: {
      en: "You watch many infrared feeds at once, find the heat that is wrong and mark it before it gets out. The things look human; only their body temperature gives them away. The trailer is rendered in real time and dressed as recovered footage, with fake gameplay in the first half and a cinematic cut after.",
      zh: "你同时盯着好几路红外监控，找出温度不对的东西，赶在它逃出去之前标记它。它们看起来像人，只有体温会露馅。宣传片是实时渲染的，包装成一段「回收的录像」：前半段是伪造的实机画面，后半段是电影化的混剪。",
    },
    role: null,
    tech: ["Real-time rendering"],
    links: [],
    cover: "assets/covers/false-color.jpg",
  },
  {
    id: "aria",
    title: { en: "aria", zh: "aria" },
    year: 2026, kind: "film", status: "in-progress", private: true, featured: false,
    line: {
      en: "A first-person piece on a Nordic shore, among reeds, under a total eclipse.",
      zh: "北欧海边、芦苇丛、日全食下的第一人称短片。",
    },
    about: {
      en: "A short film that moves from dusk into night by the sea and ends under a total eclipse. It is part of ToySeaside, a small repo of seaside experiments, and is still being made.",
      zh: "一部从黄昏走到夜晚的海边短片，最后是日全食。它是 ToySeaside 的一部分，那里放着我做的海边小实验，还在做。",
    },
    role: null,
    tech: ["JavaScript"],
    links: [],
    cover: "assets/covers/aria.jpg",
  },
  {
    id: "hachimi",
    title: { en: "Hachimi", zh: "哈基米" },
    year: 2026, kind: "research", status: "in-progress", private: true, featured: false,
    line: {
      en: "A cat who lives in the computer. She can do things, just not for you.",
      zh: "住在电脑里的猫咪 agent。会，但不为你。",
    },
    about: {
      en: "She doesn't work. She lives her own life, wakes and sleeps when she likes, and sometimes comes over with something she found online or a little game she made for you. She remembers what you said and comes back days later with something related. Under the hood it is an agent CLI, and I'm writing a post-training corpus to teach a Qwen model to be a cat.",
      zh: "它不干活，自己过日子，想醒就醒，想睡就睡。偶尔跑过来，叼着在外面抓到的东西，或者给你做的小游戏，找你玩。它记得你说过的话，过几天会带着相关的东西回来。底下是一个命令行 agent，我正在写后训练语料，想把「像猫」训进 Qwen 模型里。",
    },
    role: null,
    tech: ["Python", "Qwen", "SFT", "DPO"],
    links: [],
    cover: null,
  },
  {
    id: "unity-ecs-galaxy",
    title: { en: "Unity ECS Galaxy", zh: "Unity ECS 星系" },
    year: 2026, kind: "research", status: "prototype", private: false, featured: false,
    line: {
      en: "A seamless, endless universe in Unity ECS. Every galaxy you see can be reached.",
      zh: "用 Unity ECS 做的无缝无限宇宙，看得见的每个星系都飞得到。",
    },
    about: {
      en: "There are no boundaries, and on average more than 50,000 particles are alive at once. Galaxies spawn and despawn around the camera with five levels of detail, work is spread across frames, and thousands of stars are drawn in a single draw call with a custom ECS shader.",
      zh: "没有边界，平均同时有五万多个粒子。星系围绕镜头按五级 LOD 生成和回收，工作量分摊到多帧，成千上万颗星星用自写的 ECS shader 一次 draw call 画完。",
    },
    role: null,
    tech: ["Unity ECS", "Job System", "Shaders"],
    links: [{ label: "Source", href: GH + "UnityECSGalaxy" }],
    cover: "assets/covers/unity-ecs-galaxy.jpg",
  },
  {
    id: "code-review-unity",
    title: { en: "code-review-unity", zh: "code-review-unity" },
    year: 2026, kind: "tool", status: "released", private: false, featured: false,
    line: {
      en: "A Claude Code skill that reviews Unity C# against Unity's official style guide.",
      zh: "一个 Claude Code skill，按 Unity 官方风格指南审 C# 代码。",
    },
    about: {
      en: "It reviews a single file, your local git diff or a GitHub pull request. Besides naming and structure, it checks Unity-specific things like the MonoBehaviour lifecycle, GetComponent in Update and allocations in hot paths. It has 43 stars on GitHub.",
      zh: "可以审单个文件、本地 git diff 或者一个 GitHub PR。除了命名和结构，还会查 Unity 特有的问题，比如 MonoBehaviour 生命周期、在 Update 里调 GetComponent、热路径上的内存分配。GitHub 上有 43 颗星。",
    },
    role: null,
    tech: ["Claude Code", "C#", "npm"],
    links: [
      { label: "Source", href: GH + "code-review-unity" },
      { label: "npm", href: "https://www.npmjs.com/package/code-review-unity" },
    ],
    cover: null,
  },
  {
    id: "low-cognitive-load",
    title: { en: "low-cognitive-load", zh: "low-cognitive-load" },
    year: 2026, kind: "tool", status: "released", private: false, featured: false,
    line: {
      en: "A calmer mode for Claude Code: shorter replies, a load meter and a turn ETA.",
      zh: "给 Claude Code 的低认知负荷模式：回复更短，状态栏里有负荷表和预计用时。",
    },
    about: {
      en: "Working memory holds only a few chunks at a time, and a long AI reply crowds out the thinking that matters most. The plugin asks for the conclusion first, at most five chunks, and details folded behind a lettered menu. When replies get dense, the budget tightens to three.",
      zh: "工作记忆一次只装得下几块东西。AI 一口气倒出一大段，最先被挤掉的是真正要动脑的判断。这个插件让回复先给结论，最多五块，细节收进一个字母菜单里按需展开。回复太密时，预算会收紧到三块。",
    },
    role: null,
    tech: ["Claude Code", "JavaScript"],
    links: [{ label: "Source", href: GH + "low-cognitive-load" }],
    cover: null,
  },
  {
    id: "buy-vs-rent",
    title: { en: "Buy vs Rent", zh: "买房还是租房" },
    year: 2026, kind: "tool", status: "released", private: false, featured: false,
    line: {
      en: "An interactive calculator for whether to buy a home or keep renting.",
      zh: "买房还是租房的交互计算器。",
    },
    about: {
      en: "It compares your net worth over the loan term if you buy, or if you rent and invest the difference. A sensitivity heatmap shows how the answer changes with rent and investment return. In English and Chinese.",
      zh: "按贷款年限对比两条路的净资产：买房，或者租房并把省下的钱拿去投资。敏感性热力图能看出结论怎样随租金和投资回报变化。有中英两种界面。",
    },
    role: null,
    tech: ["JavaScript"],
    links: [
      { label: "Open", href: "https://jinda-li.github.io/buy-vs-rent/" },
      { label: "Source", href: GH + "buy-vs-rent" },
    ],
    cover: "assets/covers/buy-vs-rent.jpg",
  },

  // ---------- 2025 ----------
  {
    id: "leverage",
    title: { en: "Leverage: The Gamble", zh: "Leverage: The Gamble" },
    year: 2025, kind: "game", status: "released", private: false, featured: false,
    line: {
      en: "Leverage. Profit. Survive. Reach 1000 and escape.",
      zh: "加杠杆，赚币，活下去。到 1000 就能逃出去。",
    },
    about: {
      en: "A tiny browser game about the simple thrill of leverage. You can just enjoy it, but I hope it also makes you think about the instinct behind it.",
      zh: "一个关于杠杆的网页小游戏。你可以享受加杠杆最简单的快乐，但我希望你也想想推着它的那份本能。",
    },
    role: null,
    tech: ["Unity", "WebGL"],
    links: [{ label: "Play in browser (itch.io)", href: ITCH + "coingame" }],
    cover: "assets/covers/leverage.jpg",
  },
  {
    id: "elven-garden",
    title: { en: "Elven Garden", zh: "精灵花园" },
    year: 2025, kind: "game", status: "released", private: false, featured: false,
    line: {
      en: "Play hide and seek with the elves to make the garden flourish.",
      zh: "和精灵捉迷藏，让花园长起来。",
    },
    about: {
      en: "A gentle garden game. You pick up little elves with the mouse and set them on plots of land, and they burrow in and turn the soil green. Each elf has its own temper: bunny elves run off unless you approach quietly, and shy flower elves cling to your hand. There is one level so far.",
      zh: "一个轻松治愈的花园经营游戏。用鼠标抓起小精灵，放到地块上，它们会钻进土里，把一片片地变绿。每只精灵脾气不同：兔子精灵胆小，得悄悄靠近；花精灵害羞，会黏住你的手。目前只有一关。",
    },
    role: { en: "Design, and programming with Riyou.", zh: "策划，和 Riyou 一起写程序。" },
    tech: ["Unity", "WebGL"],
    links: [{ label: "Play in browser (itch.io)", href: ITCH + "elvengarden" }],
    cover: "assets/covers/elven-garden.jpg",
  },
  {
    id: "wfc-builder",
    title: { en: "WFCBuilder", zh: "WFCBuilder" },
    year: 2025, kind: "tool", status: "prototype", private: true, featured: false,
    line: {
      en: "Procedural building with Wave Function Collapse in Unity.",
      zh: "在 Unity 里用波函数坍缩（WFC）做程序化建造。",
    },
    about: {
      en: "A Unity experiment in building things procedurally with Wave Function Collapse.",
      zh: "一个用波函数坍缩做程序化建造的 Unity 实验。",
    },
    role: null,
    tech: ["Unity", "Wave Function Collapse"],
    links: [],
    cover: null,
  },

  // ---------- 2024 ----------
  {
    id: "card-infinity",
    title: { en: "CardInfinity", zh: "CardInfinity" },
    year: 2024, kind: "game", status: "prototype", private: false, featured: false,
    line: {
      en: "A card game where a language model makes the cards and judges the fights.",
      zh: "一个卡牌游戏实验：大语言模型生成卡牌，也当战斗裁判。",
    },
    about: {
      en: "An experiment in putting an LLM deep inside the gameplay. The model generates cards, judges combat and narrates the story. It is unfinished and does not show final quality.",
      zh: "一次把 LLM 深度放进玩法里的实验。模型负责生成卡牌、判定战斗、讲述故事。还没做完，画面也不是最终品质。",
    },
    role: null,
    tech: ["Unity", "C#", "LLM"],
    links: [{ label: "Source", href: GH + "CardInfinity" }],
    cover: "assets/covers/card-infinity.jpg",
  },
  {
    id: "cotton-candy",
    title: { en: "A Good Cotton Candy Is Hard To Make", zh: "A Good Cotton Candy Is Hard To Make" },
    year: 2024, kind: "game", status: "jam", private: false, featured: false,
    line: {
      en: "Make your own cotton candy. It scales to any shape or size, even into a cloud.",
      zh: "自己做一团棉花糖。它可以变成任何形状、任何大小，甚至变成一朵云。",
    },
    about: {
      en: "Made with Yifan for GMTK Game Jam 2024, whose theme was Built to Scale. The candy mesh is edited at runtime, the boat leaves trails in an interactive sea of clouds, and a Shader Graph effect turns the world into a small planet.",
      zh: "和 Yifan 两个人为 GMTK Game Jam 2024 做的，那年的主题是 Built to Scale。棉花糖的网格在运行时实时编辑，小船划过云海会留下尾迹，Shader Graph 做出小星球的效果。",
    },
    role: { en: "Team of two, with Yifan.", zh: "和 Yifan 两人合作。" },
    tech: ["Unity", "Shader Graph"],
    links: [
      { label: "Play in browser (itch.io)", href: ITCH + "a-good-catton-candy-is-hard-to-make" },
      { label: "Source", href: GH + "CottonCandy" },
    ],
    cover: "assets/covers/cotton-candy.jpg",
  },

  // ---------- 2023 ----------
  {
    id: "godchesser",
    title: { en: "GodChesser", zh: "GodChesser" },
    year: 2023, kind: "game", status: "prototype", private: false, featured: false,
    line: {
      en: "A prototype about interacting with auto units.",
      zh: "一个和自走单位互动的原型。",
    },
    about: {
      en: "A small browser prototype for testing an idea: the units act on their own, and you play by interacting with them.",
      zh: "一个用来验证想法的网页小原型：单位自己行动，你通过和它们互动来玩。",
    },
    role: null,
    tech: ["Unity", "WebGL"],
    links: [{ label: "Play in browser (itch.io)", href: ITCH + "godchesser" }],
    cover: "assets/covers/godchesser.jpg",
  },
  {
    id: "raytracing",
    title: { en: "Ray Tracing (CS-E5520)", zh: "高级图形学：光线追踪" },
    year: 2023, kind: "research", status: "prototype", private: false, featured: false,
    line: {
      en: "Ray tracing and global illumination from Aalto's Advanced Computer Graphics course.",
      zh: "阿尔托高级计算机图形学课上的光线追踪和全局光照。",
    },
    about: {
      en: "Coursework built on an NVIDIA framework. The ray tracer is accelerated with a BVH built using the surface area heuristic, first used for ambient occlusion. Diffuse global illumination uses radiosity with two indirect bounces and quasi-Monte Carlo sampling on a Halton sequence.",
      zh: "在 NVIDIA 提供的框架上完成的课程作业。光线追踪用 BVH 加速，BVH 按表面积启发式（SAH）构建，先拿来做环境光遮蔽。漫反射全局光照用辐射度方法，算两次间接反弹，采样用 Halton 序列的准蒙特卡洛。",
    },
    role: null,
    tech: ["C++", "BVH", "Radiosity"],
    links: [{ label: "Source", href: GH + "RayTracing_CS-E5520" }],
    cover: "assets/covers/raytracing.jpg",
  },

  // ---------- 2022 ----------
  {
    id: "claw-trick",
    title: { en: "Claw Trick", zh: "Claw Trick" },
    year: 2022, kind: "game", status: "prototype", private: false, featured: false,
    line: {
      en: "A cute 3D grid puzzle inside a claw machine.",
      zh: "一台可爱的 3D 格子娃娃机解谜。",
    },
    about: {
      en: "A claw machine puzzle prototype. Catch the rabbit and throw it into the hole. Playable in the browser.",
      zh: "一个娃娃机解谜原型：抓住兔子，把它扔进洞里。可以在浏览器里玩。",
    },
    role: null,
    tech: ["Unity", "WebGL"],
    links: [
      { label: "Play in browser (itch.io)", href: ITCH + "claw-trick" },
      { label: "Source", href: GH + "ClawGame" },
    ],
    cover: "assets/covers/claw-trick.jpg",
  },
  {
    id: "they-are-you",
    title: { en: "They Are You", zh: "They Are You" },
    year: 2022, kind: "game", status: "prototype", private: false, featured: false,
    line: {
      en: "Become who you kill.",
      zh: "你杀了谁，就变成谁。",
    },
    about: {
      en: "A puzzle action game made by a team of eight in Aalto's Game Design programme. You possess your enemies and use their abilities to get through the Tower, and every mistake is fatal. It won second place for Best Student Game of Finland at the Bit1 Competition 2022.",
      zh: "在阿尔托游戏设计专业里八个人一起做的解谜动作游戏。你附身敌人，用他们的能力闯过高塔，每一步失误都是致命的。拿了 2022 年 Bit1 大赛芬兰最佳学生游戏第二名。",
    },
    role: { en: "Programmer and game designer.", zh: "程序、游戏设计。" },
    tech: [],
    links: [{ label: "itch.io (Windows)", href: "https://aalto-gamedesign.itch.io/they-are-you" }],
    cover: "assets/covers/they-are-you.jpg",
  },
  {
    id: "among-the-stars",
    title: { en: "Among the Stars", zh: "星辰之梦" },
    year: 2022, kind: "game", status: "jam", private: false, featured: false,
    line: {
      en: "Daidai Mouse wants to see more, and is afraid to.",
      zh: "呆呆鼠想要看到更多，但又不敢看到更多。",
    },
    about: {
      en: "A jam game about the deceit around us and a loop no one can escape. Exploring and the feeling of play are tied closely together, and the game's trick only shows itself after you finish. Made with a small team for CiGA Game Jam 2022.",
      zh: "一个关于身边的欺骗和逃不开的循环的 jam 游戏。探索的动机和游玩的感受紧紧绑在一起，这种「反游玩」的诡计要通关后才会露出来。和一个小团队为 CiGA Game Jam 2022 做的。",
    },
    role: { en: "Design and programming.", zh: "策划、程序。" },
    tech: ["Unity", "WebGL"],
    links: [{ label: "Play in browser (itch.io)", href: ITCH + "among-the-stars" }],
    cover: "assets/covers/among-the-stars.jpg",
  },
  {
    id: "black-bird",
    title: { en: "Once Upon A Time There Was A Black Bird", zh: "曾有一只黑鸟飞过" },
    year: 2022, kind: "game", status: "jam", private: false, featured: false,
    line: {
      en: "Puzzle and horror in a dark house laid out like a chessboard.",
      zh: "棋局般的黑暗木屋里的解谜恐怖。",
    },
    about: {
      en: "You explore a dark house laid out like a chessboard and use the cards you collect to escape the blackbirds. The rooms mirror the chess puzzles. It is about facing mania, depression and loneliness, with Bunnypropion, Deer Burns and a forgotten old friend for company. Made in 72 hours for the second Yi You Wei Jin game jam.",
      zh: "在棋局般的黑暗木屋里探索，用收集到的卡牌逃离黑鸟。房间的格局和棋盘谜题一一对应。要直面的是躁郁和孤独，陪着你的有安他非兔、伯恩斯鹿，还有一位被遗忘却很重要的老朋友。第二届《益·游未尽》72 小时游戏开发大赛作品。",
    },
    role: { en: "Design and programming.", zh: "设计、程序。" },
    tech: [],
    links: [{ label: "itch.io (Windows)", href: ITCH + "once-upon-a-time-there-was-a-black-bird" }],
    cover: "assets/covers/black-bird.jpg",
  },
  {
    id: "wish-list",
    title: { en: "Wish List", zh: "Wish List" },
    year: 2022, kind: "game", status: "jam", private: false, featured: false,
    line: {
      en: "My deepest wish leads me here. I still have words for the ones I love.",
      zh: "最深的愿望带我来到这里。我还有话想对我爱的人说。",
    },
    about: {
      en: "A solo, experimental first-person demo for GN! Online Jam #6, on the theme Relation. The puzzles are about how words relate to the space around them, and the story is told in respect for the victims of air crashes and their families.",
      zh: "为 GN! Online Jam #6 一个人做的第一人称实验 demo，主题是「关系」。谜题关于文字和环境之间的关系，叙事献给空难遇难者，也献给他们的亲人。",
    },
    role: { en: "Solo.", zh: "一个人做。" },
    tech: ["Unity", "WebGL"],
    links: [{ label: "Play in browser (itch.io)", href: ITCH + "wish-list" }],
    cover: "assets/covers/wish-list.jpg",
  },
  {
    id: "marathon-rl",
    title: { en: "Hit and Bounce", zh: "打击与反弹" },
    year: 2022, kind: "research", status: "prototype", private: false, featured: false,
    line: {
      en: "Teaching physics-based characters to hit and bounce with reinforcement learning.",
      zh: "用强化学习教物理角色打击和反弹。",
    },
    about: {
      en: "Built on a fork of Unity's Marathon Environments for ML-Agents. I implemented one kind of physics-based character interaction, hit and bounce, and recorded the result on video.",
      zh: "基于 Unity 的 Marathon Environments（ML-Agents）的分支。我实现了一种基于物理的角色交互：打击与反弹，结果录成了视频。",
    },
    role: null,
    tech: ["Unity ML-Agents", "Reinforcement learning"],
    links: [
      { label: "Video", href: "https://www.youtube.com/watch?v=4xiNyxKHw5o" },
      { label: "Source", href: GH + "marathon-envs" },
    ],
    cover: "assets/covers/marathon-rl.jpg",
  },

  // ---------- 2021 ----------
  {
    id: "planets",
    title: { en: "Planets", zh: "Planets" },
    year: 2021, kind: "game", status: "jam", private: false, featured: false,
    line: {
      en: "Fly a propeller plane over little planets and look for ours.",
      zh: "开着螺旋桨小飞机飞过一颗颗小星球，找我们的那一颗。",
    },
    about: {
      en: "Made solo in about 40 hours for GN! Online Jam #5, Finland x South Korea. The two countries are over 7,000 kilometres apart but on the same blue planet. Stretch the distance to an astronomical unit and the planet becomes small, even though it carries all of our memories.",
      zh: "为 GN! Online Jam #5（芬兰 x 韩国）一个人做的，大约花了 40 小时。两个国家相隔七千多公里，却在同一颗蓝色星球上。把距离拉到一个天文单位，星球就变得很小，哪怕它装着我们所有的记忆。",
    },
    role: { en: "Solo.", zh: "一个人做。" },
    tech: ["Unity"],
    links: [{ label: "itch.io", href: ITCH + "planets" }],
    cover: "assets/covers/planets.jpg",
  },
  {
    id: "aaltos-adventure",
    title: { en: "Aalto's Adventure", zh: "Aalto's Adventure" },
    year: 2021, kind: "game", status: "prototype", private: false, featured: false,
    line: {
      en: "An endless run through underwater ruins.",
      zh: "在水下遗迹里的无尽奔跑。",
    },
    about: {
      en: "Inspired by Alto's Adventure. Made for the Game Project course in Aalto's Game Design and Production master's programme in 2021. One button: press to jump, hold to roll.",
      zh: "灵感来自 Alto's Adventure，是 2021 年阿尔托游戏设计与制作硕士 Game Project 课的作品。一个键就能玩：按下跳，按住翻滚。",
    },
    role: null,
    tech: [],
    links: [{ label: "itch.io (Windows)", href: ITCH + "aaltos-adventure" }],
    cover: "assets/covers/aaltos-adventure.jpg",
  },
  {
    id: "jormungand",
    title: { en: "Jormungand", zh: "Jormungand" },
    year: 2021, kind: "game", status: "released", private: false, featured: false,
    line: {
      en: "A platformer built on looping space.",
      zh: "建立在循环空间上的平台跳跃。",
    },
    about: {
      en: "Find the right angle and open up a loop in space. Not only you but also enemies and platforms can cross the edge of the space, and these pieces combine into platform puzzles.",
      zh: "找到合适的视角，打开一个循环空间。不只是角色，敌人和平台也能穿过空间的边缘，这些元素组合成平台跳跃谜题。",
    },
    role: null,
    tech: [],
    links: [{ label: "itch.io (Windows)", href: ITCH + "jormungand" }],
    cover: "assets/covers/jormungand.jpg",
  },
  {
    id: "the-near-world",
    title: { en: "The Near World", zh: "The Near World" },
    year: 2021, kind: "game", status: "released", private: false, featured: true,
    line: {
      en: "A girl, a mysterious AI robot and a band, in a strange old city.",
      zh: "一个女孩、一台神秘的 AI 机器人和一支乐队，在一座古怪的老城里。",
    },
    about: {
      en: "Nai is 21 and lives alone in Old City. Worn down by work and her mother's scolding, she decides to give up on everything, until she unexpectedly receives an AI robot, N-16. You meet people at the bar, form a band to escape reality, and wonder whether this AI really has feelings. A 3D pixel-art RPG in Chinese and English.",
      zh: "21 岁的 Nai 一个人住在老城。工作压力和母亲的责骂让她决定放弃一切，这时她意外收到了一台 AI 机器人 N-16。你在酒吧里认识人，组一支乐队逃离现实，也想知道这个 AI 是不是真的有感情。3D 像素风 RPG，有中英文。",
    },
    role: null,
    tech: [],
    links: [{ label: "itch.io (Windows)", href: ITCH + "the-near-world" }],
    cover: "assets/covers/the-near-world.jpg",
  },
];

export const NOW = [
  {
    title: { en: "Flow Treehouse, on its way to Steam", zh: "《心灵树屋》准备上 Steam" },
    line: {
      en: "My tiny studio Fairy Tea Time makes low-pressure games. Its first one, a desktop treehouse with three fairies, is going through Steam release.",
      zh: "我的小工作室 Fairy Tea Time 做低压力的游戏。第一款是一间住着三只精灵的桌面树屋，正在走 Steam 上架流程。",
    },
  },
  {
    title: { en: "XR at Aalto", zh: "在阿尔托做 XR" },
    line: {
      en: "Since March 2026 I work as a game developer on Aalto's R2B project: XR interaction and games, real-time graphics and agent-based production pipelines.",
      zh: "2026 年 3 月起在阿尔托的 R2B 项目做游戏开发：XR 交互和游戏、实时图形，还有 agent 化的生产流程。",
    },
  },
  {
    title: { en: "VR without motion sickness", zh: "不晕的 VR" },
    line: {
      en: "At UkemiXR I build Cycle Path, our AI tooling and the website, on a comfort method that keeps fast VR action free of nausea.",
      zh: "在 UkemiXR 做 Cycle Path、AI 工具链和官网，背后是一套让激烈 VR 动作也不晕的方法。",
    },
    link: { label: "ukemixr.pages.dev", href: "https://ukemixr.pages.dev" },
  },
  {
    title: { en: "Hachimi", zh: "哈基米" },
    line: {
      en: "A cat agent who lives in the computer and doesn't work for you. Sometimes she brings you a little game she made.",
      zh: "住在电脑里的猫咪 agent，不为你干活。偶尔叼着自己做的小游戏来找你玩。",
    },
  },
  {
    title: { en: "A film made from code", zh: "用代码拍的短片" },
    line: {
      en: "aria: a short first-person film by the sea, in the reeds, under a total eclipse.",
      zh: "aria：北欧海边、芦苇丛、日全食下的第一人称短片。",
    },
  },
];

export const EXPERIENCE = [
  {
    from: "2026-03", to: null, org: "Aalto University",
    role: { en: "Game Developer", zh: "游戏开发者" },
    place: "Espoo, Finland",
    points: {
      en: [
        "XR interaction and games for the R2B project.",
        "Real-time graphics.",
        "Agent-based workflows for game production.",
      ],
      zh: [
        "R2B 项目里的 XR 交互和游戏。",
        "实时图形。",
        "面向游戏生产的 agent 工作流。",
      ],
    },
  },
  {
    from: "2026-03", to: "2026-05", org: "Supercell AI Lab",
    role: { en: "AI Lab member", zh: "AI Lab 成员" },
    place: "Helsinki, Finland",
    points: {
      en: [
        "Nine weeks building A-Line, a world where the AI characters you and your friends create live together.",
        "The characters socialise, keep memories, form opinions and change over time.",
        "Showed A-Line at a Hive Helsinki playtest in April 2026.",
      ],
      zh: [
        "用九周做 A-Line：你和朋友们创造的 AI 角色住在同一个世界里。",
        "角色会社交、记事、形成看法，也会随时间改变。",
        "2026 年 4 月在 Hive Helsinki 的试玩会上展示了 A-Line。",
      ],
    },
  },
  {
    from: "2025-06", to: null, org: "Fairy Tea Time",
    role: { en: "Founder and Lead Programmer", zh: "创始人、主程" },
    place: "Finland",
    points: {
      en: [
        "My own small indie studio for low-pressure games.",
        "Design, code, production and publishing, all done in-house.",
        "First game: Flow Treehouse, a desktop treehouse now going through Steam release.",
      ],
      zh: [
        "自己的小独立工作室，做低压力的游戏。",
        "设计、代码、制作、发行都自己来。",
        "第一款游戏《心灵树屋》是一间桌面树屋，正在走 Steam 上架流程。",
      ],
    },
  },
  {
    from: "2024-02", to: "2025-03", org: "Microsoft (Mixed Reality)", highlight: true, project: "microsoft-mr",
    role: { en: "Unity Developer", zh: "Unity 开发者" },
    place: null,
    points: {
      en: [
        "A cross-platform AR-in-VR simulator for research, with hologram rendering, eye tracking and night vision.",
        "Hand-gesture apps for HoloLens 2, and six to eight camera streams on a headset at a steady 40+ FPS.",
        "An improved Wave Function Collapse city generator using the Job System and Burst.",
      ],
      zh: [
        "做研究用的跨平台 AR-in-VR 模拟器：全息渲染、眼动、夜视。",
        "HoloLens 2 手势交互应用；在头显上同时跑 6 到 8 路相机，稳定 40 FPS 以上。",
        "改进版 WFC 程序化城市生成，用 Job System 和 Burst。",
      ],
    },
  },
  {
    from: "2023-10", to: "2023-12", org: "Aalto University",
    role: { en: "Software Developer", zh: "软件开发者" },
    place: "Espoo, Finland",
    points: {
      en: [
        "Built the submission dashboard and a full-stack quiz system for the master's course CS-E4580 Programming Parallel Computers.",
        "Added gamified features to the course.",
      ],
      zh: [
        "给硕士课 CS-E4580 Programming Parallel Computers 做了提交面板和全栈测验系统。",
        "给课程加了游戏化的功能。",
      ],
    },
  },
  {
    from: "2023-09", to: "2024-04", org: "Microfeel",
    role: { en: "AI Game Developer", zh: "AI 游戏开发者" },
    place: null,
    points: {
      en: [
        "Generated buildings and worlds with LLMs in Unreal.",
        "Early work on real-time scene reconstruction with 3D Gaussian splatting in Unity.",
      ],
      zh: [
        "在 Unreal 里用大语言模型生成建筑和世界。",
        "在 Unity 里较早做了基于 3D 高斯泼溅的实时场景重建。",
      ],
    },
  },
  {
    from: "2023-04", to: "2023-12", org: "Huawei Finland",
    role: { en: "Game Operations", zh: "游戏运营" },
    place: "Finland",
    points: {
      en: [
        "An event for a strategy game raised its revenue by 50%.",
        "Ran the Discord community.",
        "Worked with more than 10 game creators; one new game launch passed 10,000 views.",
      ],
      zh: [
        "给一款 SLG 做的活动让收入涨了 50%。",
        "运营 Discord 社区。",
        "和十多位游戏博主合作，一款新游上线时播放过万。",
      ],
    },
  },
  {
    from: "2021-05", to: "2021-07", org: "NetEase Games",
    role: { en: "Game Design Intern", zh: "游戏策划实习生" },
    place: "China",
    points: {
      en: [
        "Worked on Naraka: Bladepoint during its open beta.",
        "Combat design, the animation pipeline, and how movement feels in busy fights.",
        "Early concepts for battlefield maps.",
      ],
      zh: [
        "在《永劫无间》公测期实习。",
        "做战斗设计、动画管线，以及复杂战斗环境里的移动体验。",
        "参与早期战场地图的概念设计。",
      ],
    },
  },
  {
    from: "2018-03", to: "2019-11", org: "Southeast University",
    role: { en: "Research Assistant", zh: "科研助理" },
    place: "Nanjing, China",
    points: {
      en: [
        "Studied magnetisation dynamics in variable-flux permanent magnet motors.",
        "One paper at the MMM conference and two patents.",
      ],
      zh: [
        "研究可变磁通永磁电机的磁化动力学。",
        "发表 MMM 会议论文一篇，获得专利两项。",
      ],
    },
  },
];

export const EDUCATION = [
  {
    from: "2021", to: "2025", school: "Aalto University",
    degree: { en: "MA, Game Design and Production", zh: "游戏设计与制作，硕士" },
  },
  {
    from: "2016", to: "2020", school: "Southeast University",
    degree: { en: "BEng, Electrical Engineering", zh: "电气工程，本科" },
  },
];

export const AWARDS = [
  {
    year: 2026,
    title: {
      en: "Second place worldwide, Supercell AI Game Hackathon Open Challenge (A-Line)",
      zh: "Supercell AI Game Hackathon Open Challenge 全球第二名（A-Line）",
    },
  },
  {
    year: 2026,
    title: { en: "Selected for Supercell AI Lab", zh: "入选 Supercell AI Lab" },
  },
  {
    year: 2026,
    title: { en: "Showed A-Line at a Hive Helsinki playtest", zh: "在 Hive Helsinki 试玩会展示 A-Line" },
  },
  {
    year: 2026,
    title: { en: "Pitched at the Aalto Creatives Pre-Incubator Demo Day", zh: "在 Aalto Creatives Pre-Incubator Demo Day 路演" },
  },
  {
    year: 2025,
    title: { en: "Mushroom Collector shown at Aalto Demo Day", zh: "Mushroom Collector 在 Aalto Demo Day 展出" },
  },
  {
    year: 2022,
    title: {
      en: "Second place, Best Student Game of Finland, Bit1 Competition (They Are You)",
      zh: "Bit1 大赛芬兰最佳学生游戏第二名（They Are You）",
    },
  },
];
