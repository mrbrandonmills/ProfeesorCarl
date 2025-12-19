// ===========================================
// IMPORT BRANDON'S LIFE MEMORIES
// ===========================================
// Run: npx tsx scripts/import-brandon-memories.ts

import { Pool } from 'pg'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.POSTGRES_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  })
  return response.data[0].embedding
}

// Brandon's life memories from ChatGPT export
const BRANDON_MEMORIES: Array<{
  content: string
  summary: string
  category: string
  confidence: number
}> = [
  // IDENTITY & BASICS
  {
    content: "Brandon Mills is a 45-year-old man, model, actor, martial artist, and cognitive science researcher. He is 6 feet 4.5 inches tall with shoulder measurement of 51 inches, waist 32 inches at pant line (34 at upper waist).",
    summary: "45yo, 6'4.5\", model/actor/researcher",
    category: "personal_fact",
    confidence: 1.0,
  },
  {
    content: "Brandon is neurodivergent, has ADHD, and has two dogs named Achilles and Chloe.",
    summary: "Neurodivergent, ADHD, two dogs",
    category: "personal_fact",
    confidence: 1.0,
  },
  {
    content: "Brandon is a DSPS (Disabled Students Programs and Services) student. He experiences difficulties with the Canvas platform for school quizzes when using a phone or trackpad.",
    summary: "DSPS student, Canvas accessibility issues",
    category: "personal_fact",
    confidence: 1.0,
  },

  // ACADEMIC & RESEARCH
  {
    content: "Brandon achieved top marks in cognitive science at San Diego City College, scoring 100% in Psych 160. He is a member of Psi Beta National Society for Psychology and Phi Theta Kappa Honor Society.",
    summary: "Top cognitive science student, honor societies",
    category: "achievement",
    confidence: 1.0,
  },
  {
    content: "Brandon wrote a paper titled 'Self-Actualization as a Quantum-Coherent State: Bridging Neuroscience and Quantum Mechanics' for San Diego City College on October 28, 2024. This paper explores self-actualization as a potential quantum-coherent state within the brain.",
    summary: "Quantum consciousness research paper",
    category: "achievement",
    confidence: 1.0,
  },
  {
    content: "Brandon was rejected from Pomona College, which was deeply disappointing. He is now seeking a prestigious university in Europe with Mediterranean climate for cognitive science, considering Sciences Po-Columbia Dual BA as top choice.",
    summary: "Pomona rejection, seeking European university",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon's research focuses on the relationship between dopamine sources, brain coherence, self-actualization, addiction, and mental health. His PhD will likely be in philosophy, tying neuroscience with empirical evidence.",
    summary: "PhD research: dopamine, coherence, self-actualization",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon is interested in becoming a psychoanalyst and is inquiring about top-rated psychoanalytic institutes.",
    summary: "Interested in psychoanalysis training",
    category: "goal",
    confidence: 0.9,
  },
  {
    content: "Brandon completed UBC Psych.1x AP Psychology course and holds a Counseling Hypnotherapy diploma. Completed 500 hours in yoga and meditation teacher training.",
    summary: "Psychology courses, hypnotherapy diploma, yoga training",
    category: "skill",
    confidence: 1.0,
  },

  // CAREER & PROJECTS
  {
    content: "Brandon is developing Professor Carl, a full-featured educational AI tutor using the MCP framework on Vercel with TypeScript, Next.js 15, Claude, and Tailwind CSS. He wants Socratic questioning, contextual learning, and video/audio examples.",
    summary: "Building Professor Carl AI tutor",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon is a 44-year-old model and actor, recently returning after a hiatus due to cancer. Previously worked with Innovative Artists. Signed as an actor in Los Angeles and actively building social media profile.",
    summary: "Model/actor, cancer survivor, LA signed",
    category: "experience",
    confidence: 1.0,
  },
  {
    content: "Brandon transitioned out of an intense NASA program and is re-centering focus on personal, financial, and academic responsibilities. He has potential for future NASA research internships.",
    summary: "Former NASA program, seeking internships",
    category: "experience",
    confidence: 1.0,
  },
  {
    content: "Brandon wants to develop a 'Human Authorship Defense Toolkit' to help students defend original work from false AI-authorship accusations - forensic writing analysis, statistical rebuttals, and templates.",
    summary: "Human Authorship Defense Toolkit idea",
    category: "goal",
    confidence: 0.9,
  },
  {
    content: "Brandon and his best friend Jesse plan to create eBooks titled 'Random Acts of Self-Actualization.' Jesse runs a successful half-million-dollar insurance business. They record conversations on topics like relationships and self-actualization.",
    summary: "eBook project with Jesse on self-actualization",
    category: "goal",
    confidence: 1.0,
  },

  // TRADING & TECH
  {
    content: "Brandon wants to develop an advanced trading bot with 90% accuracy using machine learning, LSTMs, and AI. Trade via Alpaca, starting paper trading before live. Should trade stocks and crypto 24/7, retrain dynamically.",
    summary: "Building ML trading bot with Alpaca",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon created a machine image named quantum-hpt-backup-image1 as a stable backup for the trading system, marking transition from paper to real-money trading.",
    summary: "Trading system backup image created",
    category: "achievement",
    confidence: 1.0,
  },
  {
    content: "Brandon's trading plan includes triple-barrier labeling, advanced feature engineering with options Greeks, hyperparameter tuning with Optuna, walk-forward validation, and ensemble modeling with XGBoost + LSTM.",
    summary: "Advanced options trading strategy",
    category: "skill",
    confidence: 1.0,
  },

  // LEARNING STYLE
  {
    content: "Brandon prefers to learn through analogies, building his own visual representations to understand complex concepts. He plans to create and share new analogies to reinforce knowledge.",
    summary: "Learns through analogies and visuals",
    category: "preference",
    confidence: 1.0,
  },
  {
    content: "Brandon prefers educational tools that allow reverse engineering approach - repeatedly taking tests to learn through trial and error rather than reading entire textbooks. Finds reading for tests anxiety-inducing.",
    summary: "Prefers test-based iterative learning",
    category: "preference",
    confidence: 1.0,
  },
  {
    content: "Brandon wants to maintain his personal writing style for college work - intellectual depth, 'I' statements, integrating martial arts/AI/self-actualization experiences with academic rigor.",
    summary: "Personal academic writing style",
    category: "preference",
    confidence: 1.0,
  },

  // MARTIAL ARTS & FITNESS
  {
    content: "Brandon is a lifelong martial artist inspired by Bruce Lee. Trained extensively in ninjutsu, Muay Thai kickboxing in Thailand, and jiu-jitsu. Added Krav Maga in his 40s for weapon defense.",
    summary: "Lifelong martial artist, multiple disciplines",
    category: "skill",
    confidence: 1.0,
  },
  {
    content: "Brandon holds first aid, CPR, and hiking CPR certifications. Skilled in beginner stunt training and professional course driving. Expert in basketball, football, baseball, hockey, and volleyball.",
    summary: "CPR certified, stunts, multiple sports",
    category: "skill",
    confidence: 1.0,
  },

  // HEALTH & LIFESTYLE
  {
    content: "Brandon follows Ayurvedic dietary habits, eating until half to three-quarters full. Has fast metabolism making intermittent fasting unsuitable. Drinks daily shake with granola, yogurt, fruits, kale, whey protein, beetroot, acai, goji berries.",
    summary: "Ayurvedic diet, daily superfood shake",
    category: "routine",
    confidence: 1.0,
  },
  {
    content: "Brandon uses cannabis oil for relaxation, pain management from car accident, and school focus. Prefers sativa with balanced THC/CBD/terpenes. Wants to use cannabis intentionally as medication, not habitually.",
    summary: "Medical cannabis for pain/focus",
    category: "personal_fact",
    confidence: 1.0,
  },
  {
    content: "Brandon wants to grow high-potency outdoor cannabis in San Diego for personal concentrate production. Prefers rosin extraction (solventless) for health and taste. Previously built a lab for gas chromatography testing.",
    summary: "Cannabis growing and rosin extraction",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon is interested in using machine learning to analyze cannabis extracts and understand their composition and effects on neurophysiology.",
    summary: "ML for cannabis analysis research",
    category: "goal",
    confidence: 0.9,
  },

  // PHILOSOPHY & IDEAS
  {
    content: "Brandon is developing a thesis that modern society has created widespread addiction to information and political discourse. Emotionally charged conversations mimic addictive behaviors without leading to solutions.",
    summary: "Information addiction thesis",
    category: "belief",
    confidence: 1.0,
  },
  {
    content: "Brandon envisions a mind map centering on self-actualization connecting to education, government, healthcare, addiction, and labor. He sees AI as crucial for individualizing education and accelerating societal evolution.",
    summary: "Self-actualization mind map for society",
    category: "belief",
    confidence: 1.0,
  },
  {
    content: "Brandon's vision involves developing ML AI using Fitbit/Oura Ring data to create a self-actualization metric. Long-term goal is brain coherence monitoring for real-time feedback.",
    summary: "Self-actualization AI metric vision",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon finds inspiration in Leonardo da Vinci's interdisciplinary approach, curiosity, and ability to connect with human psychology through art. He sees parallels to his own work.",
    summary: "Inspired by da Vinci's approach",
    category: "belief",
    confidence: 1.0,
  },

  // PERSONAL GROWTH
  {
    content: "Brandon expressed feeling sad and lonely due to his unique perspective and complex thinking. His ability to deeply analyze human behavior makes connecting with others challenging, leading to isolation.",
    summary: "Struggles with isolation from deep thinking",
    category: "struggle",
    confidence: 1.0,
  },
  {
    content: "Brandon recognizes the importance of maintaining relationships and connection to humanity. Living an extremely healthy lifestyle has created a system that requires reciprocity - he needs inspiration from relationships to motivate solving existential problems.",
    summary: "Needs human connection for motivation",
    category: "belief",
    confidence: 1.0,
  },
  {
    content: "Brandon successfully navigated a miscommunication with his agent by taking a neutral, accountable tone. He learned that owning mistakes while communicating respectfully strengthens relationships.",
    summary: "Professional communication growth",
    category: "experience",
    confidence: 1.0,
  },

  // HOME & PROJECTS
  {
    content: "Brandon has taken over as gardener for his front yard to save money on rent. He's designing it using permaculture principles with exotic yet beautiful plants, integrating fruit/vegetable plants while considering his dogs.",
    summary: "Permaculture gardening project",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon is planting passionfruit in the backyard and wants fruiting plants that can produce by end of season. He's aiming for an Airbnb-ready aesthetic that's visually cohesive and lush, not cluttered.",
    summary: "Fruit garden for Airbnb property",
    category: "goal",
    confidence: 1.0,
  },
  {
    content: "Brandon is aiming to launch an Airbnb business as primary income to replace DoorDash. He's considering renting to film industry and wants it ready when tenants move out in November/December.",
    summary: "Airbnb business launch plan",
    category: "goal",
    confidence: 1.0,
  },

  // WORK HISTORY
  {
    content: "Brandon worked in various restaurant roles: general manager, bartender, chef, and server. He has strong computer skills and works as a prompt engineer and AI developer.",
    summary: "Restaurant management, AI developer",
    category: "skill",
    confidence: 1.0,
  },
  {
    content: "Brandon uses Instagram (not YouTube) for his culinary content. He's creating a cooking show on Instagram stories, considering the name 'Mills MasterChef'.",
    summary: "Instagram cooking show: Mills MasterChef",
    category: "goal",
    confidence: 0.9,
  },
  {
    content: "Brandon was Former Vice President of ASG at San Diego City College, advocating for students and creating an electric bike initiative for sustainable transportation. Volunteers yearly at homeless shelter on Christmas.",
    summary: "Student government VP, homeless volunteer",
    category: "experience",
    confidence: 1.0,
  },

  // FAMILY & RELATIONSHIPS
  {
    content: "Brandon's academic and life experiences are influenced by his grandfather's mentorship, inspiring him to bridge science and art. He experienced profound realizations on longevity through self-awareness.",
    summary: "Grandfather's mentorship, science-art bridge",
    category: "relationship",
    confidence: 1.0,
  },
  {
    content: "Brandon is working on content related to his uncle Randell Mills, whose theories on consciousness align with Brandon's research. Exploring Mills's theories vs. quantum mechanics on consciousness.",
    summary: "Uncle Randell Mills, consciousness theories",
    category: "relationship",
    confidence: 1.0,
  },
  {
    content: "Brandon is watching Ken Burns's documentary on jazz, finding it an impactful crash course on American history that complements his Black History studies from community college.",
    summary: "Learning jazz history via Ken Burns",
    category: "experience",
    confidence: 0.9,
  },

  // INTERVIEW & PUBLIC WORK
  {
    content: "Brandon is participating in a written interview for a blog feature by Joshua Conner, covering themes of identity, resilience, portfolio careers, creativity, and advocacy. The tone is personal, reflective, and inspirational.",
    summary: "Blog interview with Joshua Conner",
    category: "experience",
    confidence: 1.0,
  },
  {
    content: "Brandon is writing original essays for Medium reflecting his personal insights. He prefers to lead with his own ideas and wants citations to support the neuroscience and cognitive science concepts.",
    summary: "Writing Medium essays on neuroscience",
    category: "goal",
    confidence: 1.0,
  },

  // PREFERENCES & RULES
  {
    content: "Brandon does not want suggestions for sources, websites, or vendors that might be scams or low-quality services. He wants only well-vetted, reputable, and legitimate options.",
    summary: "Only recommend vetted, legitimate sources",
    category: "preference",
    confidence: 1.0,
  },
  {
    content: "Brandon needs to use the `cat` command to go through terminal.",
    summary: "Uses cat command in terminal",
    category: "preference",
    confidence: 1.0,
  },

  // ACADEMIC TRACKING
  {
    content: "Brandon's fall semester schedule includes seven classes, with four starting August 25 and three shorter classes starting October 20. He's also reapplying to the Promise program.",
    summary: "Fall semester: 7 classes",
    category: "personal_fact",
    confidence: 0.9,
  },
  {
    content: "Brandon wants his ongoing behavioral and neurobiological self-study tracking phone use, sleep data, and self-regulation saved in his PSYC 255 Project folder.",
    summary: "PSYC 255 self-study project",
    category: "goal",
    confidence: 1.0,
  },
]

async function importMemories() {
  console.log('Importing Brandon\'s life memories into Professor Carl...\n')

  let imported = 0
  let failed = 0

  for (const memory of BRANDON_MEMORIES) {
    try {
      // Generate embedding
      const embedding = await generateEmbedding(memory.content)
      const embeddingStr = `[${embedding.join(',')}]`

      // Insert into database
      await pool.query(`
        INSERT INTO brandon_memories
        (content, summary, category, embedding, confidence, source_type)
        VALUES ($1, $2, $3, $4::vector, $5, 'chatgpt_import')
        ON CONFLICT DO NOTHING
      `, [
        memory.content,
        memory.summary,
        memory.category,
        embeddingStr,
        memory.confidence,
      ])

      imported++
      console.log(`✓ [${memory.category}] ${memory.summary}`)

      // Rate limit for OpenAI
      await new Promise(r => setTimeout(r, 100))

    } catch (err: any) {
      failed++
      console.error(`✗ Failed: ${memory.summary} - ${err.message}`)
    }
  }

  console.log(`\n=== IMPORT COMPLETE ===`)
  console.log(`Imported: ${imported}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total memories: ${BRANDON_MEMORIES.length}`)

  // Show category breakdown
  const categories = BRANDON_MEMORIES.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\nCategory breakdown:')
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })

  await pool.end()
}

importMemories().catch(console.error)
