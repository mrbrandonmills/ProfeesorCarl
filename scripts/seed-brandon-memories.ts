import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { execute } from '../lib/db/postgres'
import { generateEmbedding } from '../lib/ai/embeddings'
import { calculateMemoryStrength } from '../lib/memory/hume-emotions'

interface Memory {
  content: string
  summary: string
  category: string
  emotional_arousal: number
  emotional_valence: number
  dominant_emotion: string
  llm_importance: number
  granularity: 'utterance' | 'turn' | 'session'
}

const brandonMemories: Memory[] = [
  // Identity & Background
  {
    content: "Brandon Mills is a 45-year-old model, actor, martial artist, and cognitive science researcher. He combines resilience with innovation in his journey from challenging beginnings to academic and professional accomplishments.",
    summary: "45yo model, actor, martial artist, cognitive science researcher",
    category: "personal_fact",
    emotional_arousal: 0.7,
    emotional_valence: 0.6,
    dominant_emotion: "determination",
    llm_importance: 0.95,
    granularity: "session"
  },
  {
    content: "Brandon is neurodivergent, has ADHD, and has two dogs.",
    summary: "Neurodivergent with ADHD, has two dogs",
    category: "personal_fact",
    emotional_arousal: 0.5,
    emotional_valence: 0.3,
    dominant_emotion: "neutral",
    llm_importance: 0.9,
    granularity: "utterance"
  },
  {
    content: "Brandon is 6 feet 4.5 inches tall. His shoulder measurement is 51 inches, waist 32 inches at pant line, 34 inches at upper waist.",
    summary: "6'4.5\" tall, 51\" shoulders, 32-34\" waist",
    category: "personal_fact",
    emotional_arousal: 0.3,
    emotional_valence: 0.2,
    dominant_emotion: "neutral",
    llm_importance: 0.4,
    granularity: "utterance"
  },
  {
    content: "Brandon is a man.",
    summary: "Male gender",
    category: "personal_fact",
    emotional_arousal: 0.2,
    emotional_valence: 0.1,
    dominant_emotion: "neutral",
    llm_importance: 0.5,
    granularity: "utterance"
  },

  // Education & Academic
  {
    content: "Brandon achieved top marks in cognitive science at San Diego City College, where he is exploring consciousness and self-actualization as potential quantum-coherent brain states through his research paper 'Self-Actualization as a Quantum-Coherent State.'",
    summary: "Top marks in cognitive science at SDCC, researching quantum consciousness",
    category: "achievement",
    emotional_arousal: 0.8,
    emotional_valence: 0.8,
    dominant_emotion: "pride",
    llm_importance: 0.9,
    granularity: "session"
  },
  {
    content: "Brandon wrote a paper titled 'Self-Actualization as a Quantum-Coherent State: Bridging Neuroscience and Quantum Mechanics' for San Diego City College on October 28, 2024. It explores self-actualization as a potential quantum-coherent state within the brain.",
    summary: "Wrote quantum consciousness research paper Oct 2024",
    category: "achievement",
    emotional_arousal: 0.8,
    emotional_valence: 0.7,
    dominant_emotion: "pride",
    llm_importance: 0.85,
    granularity: "session"
  },
  {
    content: "Brandon is seeking a bachelor's degree that is interdisciplinary, psychology- or cognitive science-oriented, and based in a beautiful, culturally rich location. His ideal path includes continuing to a master's program in AI, cognitive science, or a related field. The Sciences Po-Columbia Dual BA Program is currently his top choice.",
    summary: "Seeking interdisciplinary bachelor's, Sciences Po-Columbia top choice",
    category: "goal",
    emotional_arousal: 0.7,
    emotional_valence: 0.6,
    dominant_emotion: "determination",
    llm_importance: 0.9,
    granularity: "session"
  },
  {
    content: "Brandon was rejected from Pomona College, which was deeply disappointing given his exceptional academic and extracurricular achievements. He is now seeking a prestigious, Ivy League-level university—ideally in Europe with a Mediterranean climate—where he can study cognitive science in English.",
    summary: "Rejected from Pomona, seeking elite European university",
    category: "experience",
    emotional_arousal: 0.75,
    emotional_valence: -0.4,
    dominant_emotion: "determination",
    llm_importance: 0.8,
    granularity: "session"
  },
  {
    content: "Brandon's fall semester schedule includes seven classes, with four starting on August 25 and three shorter classes starting on October 20.",
    summary: "Fall semester: 7 classes total",
    category: "routine",
    emotional_arousal: 0.5,
    emotional_valence: 0.3,
    dominant_emotion: "determination",
    llm_importance: 0.6,
    granularity: "utterance"
  },
  {
    content: "Brandon is a DSPS (Disabled Students Programs and Services) student. He experiences difficulties with Canvas platform when using phone or trackpad, as scrolling can unintentionally change answers.",
    summary: "DSPS student, Canvas accessibility issues",
    category: "personal_fact",
    emotional_arousal: 0.5,
    emotional_valence: -0.2,
    dominant_emotion: "frustration",
    llm_importance: 0.7,
    granularity: "utterance"
  },
  {
    content: "Brandon is currently a part of the Psi Beta National Society for Psychology and Phi Theta Kappa Honor Society.",
    summary: "Member of Psi Beta and Phi Theta Kappa honor societies",
    category: "achievement",
    emotional_arousal: 0.6,
    emotional_valence: 0.7,
    dominant_emotion: "pride",
    llm_importance: 0.7,
    granularity: "utterance"
  },
  {
    content: "Completed UBC Psych.1x AP Psychology course and holds a Counseling Hypnotherapy diploma. Scored 100% in Psych 160 at San Diego City College.",
    summary: "UBC Psych course, Hypnotherapy diploma, 100% in Psych 160",
    category: "achievement",
    emotional_arousal: 0.7,
    emotional_valence: 0.8,
    dominant_emotion: "pride",
    llm_importance: 0.75,
    granularity: "utterance"
  },

  // Learning Style
  {
    content: "Brandon prefers to learn through analogies, building his own visual representations to understand and explain complex concepts. This approach helps him process and retain information effectively.",
    summary: "Learns through analogies and visual representations",
    category: "preference",
    emotional_arousal: 0.6,
    emotional_valence: 0.5,
    dominant_emotion: "curiosity",
    llm_importance: 0.9,
    granularity: "session"
  },
  {
    content: "Brandon prefers educational tools that allow for a reverse engineering approach, where he can repeatedly take tests or engage in active problem-solving to learn and master material. He finds reading entire textbooks anxiety-inducing and learns best by taking tests multiple times through trial and error.",
    summary: "Learns by reverse engineering, test-taking, trial and error",
    category: "preference",
    emotional_arousal: 0.6,
    emotional_valence: 0.4,
    dominant_emotion: "curiosity",
    llm_importance: 0.85,
    granularity: "session"
  },
  {
    content: "Brandon wants to maintain his current writing style for all college work, ensuring it reflects his personal voice, intellectual depth, and use of 'I' statements. His writing should integrate his experiences in martial arts, AI, and self-actualization while maintaining academic rigor.",
    summary: "Maintains personal voice in academic writing with I statements",
    category: "preference",
    emotional_arousal: 0.5,
    emotional_valence: 0.5,
    dominant_emotion: "determination",
    llm_importance: 0.7,
    granularity: "utterance"
  },

  // Research & PhD
  {
    content: "Brandon's research focuses on the relationship between dopamine sources, brain coherence, self-actualization, addiction, and mental health. He is interested in how different dopamine hits impact brain function and coherence. His PhD will likely be in philosophy, tying these concepts together with empirical evidence.",
    summary: "PhD research: dopamine, coherence, self-actualization, addiction",
    category: "goal",
    emotional_arousal: 0.8,
    emotional_valence: 0.7,
    dominant_emotion: "determination",
    llm_importance: 0.95,
    granularity: "session"
  },
  {
    content: "Brandon's goal is to develop technology for monitoring brain coherence to promote self-awareness, positive behavior, and combat addictive behaviors. He wants to demonstrate that real-time brain coherence monitoring can lead to better decision-making, higher self-actualization, and a healthier society.",
    summary: "Goal: brain coherence monitoring tech for self-actualization",
    category: "goal",
    emotional_arousal: 0.85,
    emotional_valence: 0.8,
    dominant_emotion: "excitement",
    llm_importance: 0.9,
    granularity: "session"
  },
  {
    content: "Brandon's vision involves developing a machine learning AI that uses health data from devices like Fitbit and Oura Ring, as well as other behavioral data, to create a self-actualization metric. This AI would tailor itself to each individual, analyzing their actions to guide them toward self-actualization.",
    summary: "Vision: ML-based self-actualization metric using health data",
    category: "goal",
    emotional_arousal: 0.8,
    emotional_valence: 0.7,
    dominant_emotion: "excitement",
    llm_importance: 0.85,
    granularity: "session"
  },
  {
    content: "Brandon is interested in becoming a psychoanalyst and is inquiring about top-rated psychoanalytic institutes, the duration of the process, and the possibility of pursuing this training concurrently with his bachelor's degree.",
    summary: "Interested in becoming psychoanalyst",
    category: "goal",
    emotional_arousal: 0.6,
    emotional_valence: 0.5,
    dominant_emotion: "curiosity",
    llm_importance: 0.7,
    granularity: "utterance"
  },

  // Self-Actualization Framework
  {
    content: "Brandon envisions a mind map centering on self-actualization and its dynamic connections to various societal aspects such as education, government, healthcare, addiction, and labor class distinctions. He plans to use this as a visual tool for his essays and eBooks.",
    summary: "Self-actualization mind map connecting societal pillars",
    category: "goal",
    emotional_arousal: 0.7,
    emotional_valence: 0.6,
    dominant_emotion: "excitement",
    llm_importance: 0.8,
    granularity: "session"
  },
  {
    content: "Brandon has a strong interest in the anthropology of education and how self-actualization can drive societal evolution. He sees AI as a crucial tool for individualizing education and accelerating the timeline toward a more informed and self-correcting society.",
    summary: "AI for individualized education and societal self-actualization",
    category: "belief",
    emotional_arousal: 0.75,
    emotional_valence: 0.7,
    dominant_emotion: "determination",
    llm_importance: 0.85,
    granularity: "session"
  },
  {
    content: "Brandon recognizes the importance of including religion as a societal pillar, particularly Buddhism and its philosophical connections to self-actualization. He also wants to address sociological issues such as racism, conspiracy theories, and mental health.",
    summary: "Buddhism connection to self-actualization, addressing social issues",
    category: "belief",
    emotional_arousal: 0.6,
    emotional_valence: 0.4,
    dominant_emotion: "curiosity",
    llm_importance: 0.7,
    granularity: "turn"
  },

  // Professor Carl Project
  {
    content: "Brandon is developing a full-featured educational AI tutor named 'Professor Carl' using the MCP framework on Vercel. The agent emphasizes Socratic questioning, contextual learning, and a warm yet challenging teaching style. Built in TypeScript with Next.js 15, Claude Haiku, and Tailwind CSS.",
    summary: "Building Professor Carl AI tutor with Socratic method",
    category: "goal",
    emotional_arousal: 0.8,
    emotional_valence: 0.8,
    dominant_emotion: "excitement",
    llm_importance: 0.9,
    granularity: "session"
  },
  {
    content: "Brandon wants Professor Carl's responses to be sophisticated, context-aware, and dynamic. He expects the tutor to offer varied, intelligent follow-ups—like examples, analogies, or escalated teaching strategies—and to avoid robotic or repetitive replies.",
    summary: "Wants Professor Carl to be dynamic and context-aware",
    category: "preference",
    emotional_arousal: 0.7,
    emotional_valence: 0.6,
    dominant_emotion: "determination",
    llm_importance: 0.85,
    granularity: "turn"
  },

  // eBook Project with Jesse
  {
    content: "Brandon and his best friend Jesse plan to create a series of eBooks titled 'Random Acts of Self-Actualization.' Jesse is an insurance agent who transitioned from trucking and now runs a successful half-million-dollar insurance business. They will pick topics and discuss them in recorded conversations.",
    summary: "eBook series 'Random Acts of Self-Actualization' with Jesse",
    category: "goal",
    emotional_arousal: 0.7,
    emotional_valence: 0.7,
    dominant_emotion: "excitement",
    llm_importance: 0.8,
    granularity: "session"
  },
  {
    content: "Brandon deeply admires Jesse's high character. Jesse has achieved self-actualization despite working in a toxic environment. They recorded their first eBook on self-actualization using couples' communication problems to explore personal growth.",
    summary: "Admires Jesse's character, first eBook on couples communication",
    category: "relationship",
    emotional_arousal: 0.7,
    emotional_valence: 0.8,
    dominant_emotion: "warmth",
    llm_importance: 0.75,
    granularity: "turn"
  },

  // Uncle Randell Mills
  {
    content: "Brandon worked on content related to his uncle Randell Mills, whose theories on consciousness align with Brandon's research. He received Mills's paper on consciousness and is planning to understand the vocabulary and create analogies.",
    summary: "Uncle Randell Mills has consciousness theories aligned with research",
    category: "relationship",
    emotional_arousal: 0.7,
    emotional_valence: 0.6,
    dominant_emotion: "curiosity",
    llm_importance: 0.8,
    granularity: "session"
  },
  {
    content: "Brandon is exploring Mills's theories vs. quantum mechanics, focusing on consciousness, superposition, and observer effects, curious about deterministic vs. mystical implications.",
    summary: "Exploring uncle's theories vs quantum mechanics",
    category: "goal",
    emotional_arousal: 0.7,
    emotional_valence: 0.5,
    dominant_emotion: "curiosity",
    llm_importance: 0.75,
    granularity: "turn"
  },

  // Martial Arts
  {
    content: "Brandon is a lifelong martial artist inspired by Bruce Lee. He trained extensively in ninjutsu, Muay Thai kickboxing in Thailand, and jiu-jitsu. Added Krav Maga in his 40s for weapon defense. His martial arts journey reflects dedication to self-expression, resilience, and personal growth.",
    summary: "Lifelong martial artist: ninjutsu, Muay Thai, jiu-jitsu, Krav Maga",
    category: "experience",
    emotional_arousal: 0.75,
    emotional_valence: 0.7,
    dominant_emotion: "pride",
    llm_importance: 0.8,
    granularity: "session"
  },

  // Modeling & Acting
  {
    content: "Brandon is a 44-year-old model, actor, and martial artist, recently returning to modeling and acting after a hiatus due to cancer. Previously worked with Innovative Artists but developed a deeper connection to acting post-recovery and through coaching.",
    summary: "Returning to modeling/acting after cancer, deeper connection now",
    category: "experience",
    emotional_arousal: 0.8,
    emotional_valence: 0.5,
    dominant_emotion: "determination",
    llm_importance: 0.85,
    granularity: "session"
  },
  {
    content: "Brandon is signed as an actor in Los Angeles and actively building his social media profile to support his modeling and acting career. His journey reflects resilience and dedication to self-expression and growth.",
    summary: "Signed actor in LA, building social media presence",
    category: "experience",
    emotional_arousal: 0.6,
    emotional_valence: 0.6,
    dominant_emotion: "determination",
    llm_importance: 0.7,
    granularity: "utterance"
  },

  // Health & Wellness
  {
    content: "Brandon follows Ayurvedic dietary habits, eating until half to three-quarters full and avoiding overeating. Has a fast metabolism, making intermittent fasting unsuitable. Drinks a daily shake (~1000-1500 calories) with granola, yogurt, fruits, berries, kale, whey protein, beetroot, acai, and goji berries.",
    summary: "Ayurvedic diet, fast metabolism, daily 1000-1500 cal shake",
    category: "routine",
    emotional_arousal: 0.5,
    emotional_valence: 0.5,
    dominant_emotion: "neutral",
    llm_importance: 0.6,
    granularity: "utterance"
  },
  {
    content: "Brandon completed 500 hours in yoga and meditation teacher training. Holds first aid, CPR, and hiking CPR certifications.",
    summary: "500hr yoga/meditation training, first aid/CPR certified",
    category: "skill",
    emotional_arousal: 0.5,
    emotional_valence: 0.6,
    dominant_emotion: "pride",
    llm_importance: 0.6,
    granularity: "utterance"
  },
  {
    content: "Brandon uses cannabis oil for relaxation, pain management from a car accident, and assistance with school. He wants to use cannabis more intentionally and effectively as a medication rather than habitually.",
    summary: "Uses cannabis medicinally for pain and focus",
    category: "routine",
    emotional_arousal: 0.5,
    emotional_valence: 0.3,
    dominant_emotion: "neutral",
    llm_importance: 0.6,
    granularity: "utterance"
  },
  {
    content: "Brandon prefers to use rosin extraction for health and taste reasons, avoiding solvents like ethanol or butane. He previously developed a complex solvent-based process using dry ice, liquid nitrogen, and ethanol.",
    summary: "Prefers solventless rosin extraction for cannabis",
    category: "preference",
    emotional_arousal: 0.4,
    emotional_valence: 0.4,
    dominant_emotion: "neutral",
    llm_importance: 0.5,
    granularity: "utterance"
  },

  // Leadership & Advocacy
  {
    content: "Brandon was Former Vice President of ASG at San Diego City College, advocating for students and creating an electric bike initiative for sustainable transportation. Advocates for mental health and student support.",
    summary: "Former VP of ASG at SDCC, created e-bike initiative",
    category: "achievement",
    emotional_arousal: 0.7,
    emotional_valence: 0.7,
    dominant_emotion: "pride",
    llm_importance: 0.75,
    granularity: "utterance"
  },
  {
    content: "Brandon volunteers yearly at a homeless shelter on Christmas with friends.",
    summary: "Volunteers at homeless shelter on Christmas yearly",
    category: "routine",
    emotional_arousal: 0.6,
    emotional_valence: 0.8,
    dominant_emotion: "warmth",
    llm_importance: 0.6,
    granularity: "utterance"
  },

  // Skills
  {
    content: "Brandon is skilled in beginner stunt training and professional course driving. Expert in basketball, football, baseball, hockey, and volleyball. Worked in various restaurant roles: general manager, bartender, chef, and server.",
    summary: "Stunt training, driving, sports expert, restaurant experience",
    category: "skill",
    emotional_arousal: 0.5,
    emotional_valence: 0.5,
    dominant_emotion: "neutral",
    llm_importance: 0.6,
    granularity: "utterance"
  },
  {
    content: "Brandon has strong computer skills, also working as a prompt engineer and AI developer.",
    summary: "Prompt engineer and AI developer",
    category: "skill",
    emotional_arousal: 0.6,
    emotional_valence: 0.6,
    dominant_emotion: "pride",
    llm_importance: 0.7,
    granularity: "utterance"
  },

  // Trading Bot Project
  {
    content: "Brandon wants to develop an advanced trading bot with a target of 90% accuracy using machine learning, LSTMs, sequential models, and cutting-edge AI techniques. The bot should trade via Alpaca, starting with paper trading before moving to live trading.",
    summary: "Building 90% accuracy ML trading bot with Alpaca",
    category: "goal",
    emotional_arousal: 0.7,
    emotional_valence: 0.6,
    dominant_emotion: "determination",
    llm_importance: 0.7,
    granularity: "session"
  },
  {
    content: "Brandon created a machine image named 'quantum-hpt-backup-image1' as a stable backup point for the trading system, marking the transition from paper model demonstration to real-money trading.",
    summary: "Created quantum-hpt-backup-image1 for trading system",
    category: "achievement",
    emotional_arousal: 0.6,
    emotional_valence: 0.6,
    dominant_emotion: "pride",
    llm_importance: 0.5,
    granularity: "utterance"
  },

  // Writing & Essays
  {
    content: "Brandon is writing original essays for Medium that reflect his personal insights and intellectual voice. He prefers to lead with his own ideas rather than regurgitate mainstream content and wants citations to support the neuroscience concepts he explores.",
    summary: "Writing original Medium essays with personal voice",
    category: "goal",
    emotional_arousal: 0.6,
    emotional_valence: 0.6,
    dominant_emotion: "determination",
    llm_importance: 0.65,
    granularity: "utterance"
  },
  {
    content: "Brandon is developing a nuanced thesis around the idea that modern society has created widespread addiction to information, particularly in how people consume and discuss news and political events.",
    summary: "Thesis on information addiction in modern society",
    category: "goal",
    emotional_arousal: 0.7,
    emotional_valence: 0.4,
    dominant_emotion: "determination",
    llm_importance: 0.7,
    granularity: "turn"
  },
  {
    content: "Brandon wants to develop a 'Human Authorship Defense Toolkit' to help students and researchers defend their original work from false AI-authorship accusations. He envisions this as a possible eBook add-on or campus resource.",
    summary: "Developing Human Authorship Defense Toolkit",
    category: "goal",
    emotional_arousal: 0.6,
    emotional_valence: 0.5,
    dominant_emotion: "determination",
    llm_importance: 0.65,
    granularity: "utterance"
  },

  // Gardening & Property
  {
    content: "Brandon has taken over as the gardener for his new front yard to save money on rent. He is learning to manage the lawn using permaculture principles and wants to integrate fruit and vegetable plants, considering his dogs in the design.",
    summary: "Learning permaculture gardening to save rent",
    category: "goal",
    emotional_arousal: 0.5,
    emotional_valence: 0.5,
    dominant_emotion: "curiosity",
    llm_importance: 0.5,
    granularity: "turn"
  },
  {
    content: "Brandon is designing his front yard in San Diego using permaculture principles with a focus on low-cost, science-informed decisions. He is planting passionfruit in the backyard and wants to incorporate fruiting plants for an Airbnb setting.",
    summary: "Designing permaculture garden for Airbnb in San Diego",
    category: "goal",
    emotional_arousal: 0.5,
    emotional_valence: 0.5,
    dominant_emotion: "curiosity",
    llm_importance: 0.5,
    granularity: "turn"
  },
  {
    content: "Brandon wants to focus on launching the Airbnb business as a primary source of income to replace DoorDash. He aims to have the Airbnb ready to book as soon as the tenants move out in November or December.",
    summary: "Launching Airbnb to replace DoorDash income",
    category: "goal",
    emotional_arousal: 0.6,
    emotional_valence: 0.5,
    dominant_emotion: "determination",
    llm_importance: 0.6,
    granularity: "utterance"
  },

  // Inspiration & Philosophy
  {
    content: "Brandon finds inspiration in Leonardo da Vinci's interdisciplinary approach, curiosity, and ability to connect deeply with human psychology through art. He sees parallels between his own work and da Vinci's exploration of human experience.",
    summary: "Inspired by da Vinci's interdisciplinary approach",
    category: "belief",
    emotional_arousal: 0.7,
    emotional_valence: 0.7,
    dominant_emotion: "curiosity",
    llm_importance: 0.7,
    granularity: "turn"
  },
  {
    content: "Brandon experienced a profound realization on longevity and human evolution through self-awareness, planning to integrate these ideas into his PhD research. Interested in how a supportive environment and purpose impact longevity, inspired by Carl Jung's ideas on self-actualization.",
    summary: "Integrating longevity and Jung into PhD research",
    category: "belief",
    emotional_arousal: 0.75,
    emotional_valence: 0.7,
    dominant_emotion: "excitement",
    llm_importance: 0.8,
    granularity: "session"
  },
  {
    content: "Brandon's academic and life experiences are influenced by his grandfather's mentorship, inspiring him to bridge science and art.",
    summary: "Grandfather's mentorship bridges science and art",
    category: "relationship",
    emotional_arousal: 0.7,
    emotional_valence: 0.8,
    dominant_emotion: "warmth",
    llm_importance: 0.75,
    granularity: "utterance"
  },

  // Personal Struggles & Growth
  {
    content: "Brandon expressed feeling sad and lonely due to his unique perspective and complex thinking. His ability to deeply analyze human behavior makes it challenging to connect with others on a typical level, leading to isolation.",
    summary: "Feels isolated due to complex analytical thinking",
    category: "struggle",
    emotional_arousal: 0.7,
    emotional_valence: -0.5,
    dominant_emotion: "sadness",
    llm_importance: 0.8,
    granularity: "session"
  },
  {
    content: "Brandon is realizing the importance of maintaining relationships and connection to humanity in his life. He recognizes the need for inspiration from relationships to motivate his work in solving existential problems.",
    summary: "Values relationships for motivation and inspiration",
    category: "belief",
    emotional_arousal: 0.7,
    emotional_valence: 0.4,
    dominant_emotion: "warmth",
    llm_importance: 0.8,
    granularity: "session"
  },
  {
    content: "Brandon successfully navigated a miscommunication with his agent about an audition by taking a neutral, accountable tone. He learned that owning mistakes while communicating respectfully can strengthen relationships.",
    summary: "Learned professional communication with agent",
    category: "experience",
    emotional_arousal: 0.5,
    emotional_valence: 0.5,
    dominant_emotion: "relief",
    llm_importance: 0.5,
    granularity: "turn"
  },

  // NASA & Career Transition
  {
    content: "Brandon is transitioning out of an intense NASA program and re-centering his focus on personal, financial, and academic responsibilities. He has major expenses coming up, including rent, credit card payments, laptop repair, and costs for returning to school.",
    summary: "Transitioning from NASA, managing finances for school",
    category: "experience",
    emotional_arousal: 0.6,
    emotional_valence: 0.3,
    dominant_emotion: "determination",
    llm_importance: 0.7,
    granularity: "session"
  },

  // Cultural Interests
  {
    content: "Brandon is watching Ken Burns's documentary on jazz, finding it an impactful crash course on American history that complements his Black History studies from community college.",
    summary: "Watching Ken Burns jazz documentary for history",
    category: "experience",
    emotional_arousal: 0.5,
    emotional_valence: 0.6,
    dominant_emotion: "curiosity",
    llm_importance: 0.4,
    granularity: "utterance"
  },
  {
    content: "Brandon uses Instagram (not YouTube) for his culinary content. Creating a cooking show on Instagram stories; considering the name 'Mills MasterChef'.",
    summary: "Instagram cooking show 'Mills MasterChef'",
    category: "goal",
    emotional_arousal: 0.5,
    emotional_valence: 0.6,
    dominant_emotion: "excitement",
    llm_importance: 0.5,
    granularity: "utterance"
  },

  // Technical Preferences
  {
    content: "Brandon needs to use the 'cat' command to go through terminal.",
    summary: "Uses cat command in terminal",
    category: "preference",
    emotional_arousal: 0.2,
    emotional_valence: 0.1,
    dominant_emotion: "neutral",
    llm_importance: 0.3,
    granularity: "utterance"
  },
  {
    content: "Brandon is using a Mac with an M1 chip and is open to upgrading hardware as his systems progress.",
    summary: "Uses Mac M1, open to hardware upgrades",
    category: "personal_fact",
    emotional_arousal: 0.3,
    emotional_valence: 0.3,
    dominant_emotion: "neutral",
    llm_importance: 0.4,
    granularity: "utterance"
  },

  // Trust & Verification
  {
    content: "Brandon does not want recommendations for sources, websites, or vendors that might be scams or low-quality services. He wants only well-vetted, reputable, and legitimate options so he doesn't have to double-verify.",
    summary: "Only wants vetted, reputable recommendations",
    category: "preference",
    emotional_arousal: 0.5,
    emotional_valence: 0.3,
    dominant_emotion: "determination",
    llm_importance: 0.7,
    granularity: "utterance"
  },

  // Interview & Public Work
  {
    content: "Brandon is participating in a written interview for a blog feature by Joshua Conner, covering themes of identity, resilience, portfolio careers, creativity, and advocacy. The tone is personal, reflective, and inspirational.",
    summary: "Blog interview with Joshua Conner on identity and resilience",
    category: "experience",
    emotional_arousal: 0.6,
    emotional_valence: 0.6,
    dominant_emotion: "pride",
    llm_importance: 0.5,
    granularity: "utterance"
  }
]

async function main() {
  console.log('=== SEEDING BRANDON MEMORIES FROM CHATGPT ===\n')
  console.log(`Processing ${brandonMemories.length} memories...\n`)

  let saved = 0
  let failed = 0

  for (let i = 0; i < brandonMemories.length; i++) {
    const memory = brandonMemories[i]
    try {
      // Generate embedding
      const embedding = await generateEmbedding(memory.content)
      const embeddingStr = `[${embedding.join(',')}]`

      // Calculate memory strength
      const memoryStrength = calculateMemoryStrength({
        timesCited: 0,
        humeArousal: memory.emotional_arousal,
        textArousal: memory.emotional_arousal,
        llmImportance: memory.llm_importance,
        timesRetrievedUnused: 0,
      })

      // Insert into database
      await execute(`
        INSERT INTO user_memories
        (user_id, content, summary, category, embedding, confidence, source_type,
         emotional_arousal, emotional_valence, dominant_emotion, llm_importance,
         memory_strength, current_importance, granularity)
        VALUES ($1, $2, $3, $4, $5::vector, $6, 'imported',
                $7, $8, $9, $10, $11, $11, $12)
        ON CONFLICT DO NOTHING
      `, [
        'brandon',
        memory.content,
        memory.summary,
        memory.category,
        embeddingStr,
        0.95, // high confidence for imported memories
        memory.emotional_arousal,
        memory.emotional_valence,
        memory.dominant_emotion,
        memory.llm_importance,
        memoryStrength,
        memory.granularity,
      ])

      saved++
      process.stdout.write(`\rSaved: ${saved}/${brandonMemories.length}`)
    } catch (error) {
      failed++
      console.error(`\nFailed to save memory ${i + 1}: ${error}`)
    }
  }

  console.log(`\n\n=== COMPLETE ===`)
  console.log(`Saved: ${saved}`)
  console.log(`Failed: ${failed}`)

  process.exit(0)
}

main().catch(console.error)
