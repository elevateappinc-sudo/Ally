export type StrategyMode = 'autopilot' | 'copilot'

export interface StrategyStep {
  id: string
  title: string
  description: string
  action: 'generate_content' | 'generate_emails' | 'generate_dms' | 'schedule_post' | 'manual' | 'generate_assets'
  estimatedTime?: string
}

export interface Strategy {
  id: string
  number: number
  title: string
  tag: string
  tagColor: string
  cost: string
  speed: string
  roi: number // 1-5 stars
  scalability: 'Baja' | 'Media' | 'Alta' | 'Muy alta'
  difficulty: 'Fácil' | 'Media' | 'Alta'
  description: string
  whyBest: string
  whatPauDoes: string
  autopilotDesc: string
  copilotDesc: string
  channels: string[]
  steps: StrategyStep[]
  phase: 'mes1' | 'mes2' | 'mes3' | 'mes4'
  exampleMessage?: string
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'dm-outreach',
    number: 1,
    title: 'Outreach / DM directo',
    tag: 'Empezar aquí siempre',
    tagColor: 'emerald',
    cost: 'Gratis',
    speed: 'Inmediato',
    roi: 5,
    scalability: 'Baja',
    difficulty: 'Fácil',
    phase: 'mes1',
    description: 'Contactar directamente a personas que encajan con tu usuario ideal por DM en Instagram, LinkedIn o WhatsApp.',
    whyBest: 'Cero costo, tasa de conversión más alta de todos los canales. Perfecto para los primeros 10–50 clientes.',
    whatPauDoes: 'Genera 50 mensajes personalizados listos para enviar, crea un tracker de contactos y midede respuestas.',
    autopilotDesc: 'PAU genera los scripts segmentados por perfil, los organiza por prioridad y te entrega una lista lista para ejecutar.',
    copilotDesc: 'Tú defines el perfil objetivo, PAU escribe los mensajes. Tú los envías uno a uno.',
    channels: ['Instagram DM', 'LinkedIn', 'WhatsApp'],
    exampleMessage: '"Hola [nombre], vi que [contexto específico]. Estoy construyendo [app] para [solución]. ¿Tendrías 10 minutos para probarla?"',
    steps: [
      { id: 'define-icp', title: 'Definir perfil de usuario ideal', description: 'PAU analiza tu marca y define el ICP (Ideal Customer Profile) con características específicas', action: 'generate_content', estimatedTime: '30 seg' },
      { id: 'generate-scripts', title: 'Generar 50 scripts personalizados', description: 'Mensajes cortos, directos y personalizados — no spam genérico', action: 'generate_dms', estimatedTime: '1 min' },
      { id: 'contact-list', title: 'Organizar lista de contactos', description: 'Tabla con nombre, plataforma, estado (enviado/respondido/no interesado) y notas', action: 'generate_assets', estimatedTime: '30 seg' },
      { id: 'track', title: 'Trackear respuestas', description: 'Registra quién respondió y qué dijo para iterar el mensaje', action: 'manual', estimatedTime: 'Ongoing' },
    ],
  },
  {
    id: 'referral-waitlist',
    number: 2,
    title: 'Programa de referidos (waitlist viral)',
    tag: 'Activar desde el día 1',
    tagColor: 'violet',
    cost: 'Gratis–Bajo',
    speed: 'Semanas',
    roi: 5,
    scalability: 'Alta',
    difficulty: 'Media',
    phase: 'mes1',
    description: 'Cada persona en el waitlist recibe un link único. Por cada amigo que invite, gana beneficios (prioridad, acceso anticipado, descuentos).',
    whyBest: 'El crecimiento es exponencial. Robinhood consiguió millones de usuarios así antes de lanzar.',
    whatPauDoes: 'Genera todos los textos, emails y posts para promocionar el waitlist en tus redes.',
    autopilotDesc: 'PAU crea la secuencia completa de comunicación para el waitlist y la publica en tus redes automáticamente.',
    copilotDesc: 'PAU genera el copy del waitlist, los posts para promoverlo y los emails de seguimiento. Tú los publicas.',
    channels: ['Instagram', 'Facebook', 'Email', 'LinkedIn'],
    steps: [
      { id: 'waitlist-copy', title: 'Generar copy del waitlist', description: 'Headline, descripción, beneficios y CTA para la página de waitlist', action: 'generate_content', estimatedTime: '30 seg' },
      { id: 'launch-posts', title: 'Crear posts de lanzamiento', description: '5 posts para Instagram/LinkedIn anunciando el waitlist con urgencia', action: 'generate_content', estimatedTime: '1 min' },
      { id: 'referral-emails', title: 'Secuencia de emails de referidos', description: 'Email de bienvenida + 2 recordatorios incentivando a compartir el link', action: 'generate_emails', estimatedTime: '1 min' },
      { id: 'promo-stories', title: 'Stories de promoción', description: '7 stories con contadores y urgencia para impulsar registros', action: 'generate_assets', estimatedTime: '1 min' },
    ],
  },
  {
    id: 'community',
    number: 3,
    title: 'Comunidades del nicho',
    tag: 'Paralelo al outreach, desde el día 1',
    tagColor: 'blue',
    cost: 'Gratis',
    speed: 'Días–Semanas',
    roi: 4,
    scalability: 'Media',
    difficulty: 'Fácil',
    phase: 'mes1',
    description: 'Participar activamente en grupos de WhatsApp, Telegram, Facebook, Reddit y foros donde ya está tu usuario ideal.',
    whyBest: 'Cero costo, los usuarios ya están ahí listos para escuchar sobre soluciones a su problema.',
    whatPauDoes: 'Genera posts de valor para comunidades (no spam), identifica dónde están tus usuarios y crea un calendario de participación.',
    autopilotDesc: 'PAU genera una semana completa de posts de valor para comunidades específicas de tu nicho, listos para copiar y pegar.',
    copilotDesc: 'PAU genera los mensajes de valor, tú los publicas en los grupos que ya conoces.',
    channels: ['WhatsApp grupos', 'Facebook grupos', 'Reddit', 'Telegram', 'LinkedIn grupos'],
    steps: [
      { id: 'find-communities', title: 'Identificar comunidades clave', description: 'Lista de grupos y foros donde está tu usuario ideal, con tamaño estimado', action: 'generate_content', estimatedTime: '30 seg' },
      { id: 'value-posts', title: 'Generar 10 posts de valor', description: 'Contenido útil que aporta sin vender, con mención natural del producto', action: 'generate_content', estimatedTime: '2 min' },
      { id: 'intro-message', title: 'Mensaje de presentación', description: 'Cómo presentarte en el grupo por primera vez de forma auténtica', action: 'generate_dms', estimatedTime: '30 seg' },
      { id: 'participation-calendar', title: 'Calendario de participación', description: 'Plan semanal de 3-4 interacciones por comunidad', action: 'generate_assets', estimatedTime: '30 seg' },
    ],
  },
  {
    id: 'email-marketing',
    number: 4,
    title: 'Email marketing',
    tag: 'Construir la lista desde el primer día',
    tagColor: 'amber',
    cost: 'Gratis–Bajo',
    speed: 'Semanas',
    roi: 5,
    scalability: 'Alta',
    difficulty: 'Fácil',
    phase: 'mes1',
    description: 'Recolectar emails desde el waitlist y enviar actualizaciones periódicas. ROI promedio de $36 por cada $1 invertido.',
    whyBest: 'El canal con mayor ROI de todos. Es tuyo, no depende de algoritmos. $36 por cada $1 invertido.',
    whatPauDoes: 'Genera la secuencia completa de 5 emails de bienvenida y los envía automáticamente via Resend.',
    autopilotDesc: 'PAU genera y envía la secuencia completa de emails automáticamente. Solo conectas Resend.',
    copilotDesc: 'PAU genera los 5 emails listos. Tú los copias a Mailchimp, Brevo o la herramienta que uses.',
    channels: ['Email (Resend)', 'Email (Brevo)', 'Email (Mailchimp)'],
    steps: [
      { id: 'email-1', title: 'Email 1: Bienvenida (Día 0)', description: '"Bienvenido, estás en la lista — aquí lo que viene"', action: 'generate_emails', estimatedTime: '30 seg' },
      { id: 'email-2', title: 'Email 2: El problema (Día 3)', description: '"El problema que estamos resolviendo — por qué nos importa"', action: 'generate_emails', estimatedTime: '30 seg' },
      { id: 'email-3', title: 'Email 3: Behind the scenes (Día 7)', description: '"Un vistazo detrás de cámaras del desarrollo"', action: 'generate_emails', estimatedTime: '30 seg' },
      { id: 'email-4', title: 'Email 4: Aprendizajes (Día 14)', description: '"Primeros usuarios — lo que aprendimos de ellos"', action: 'generate_emails', estimatedTime: '30 seg' },
      { id: 'email-5', title: 'Email 5: Lanzamiento', description: '"Ya está aquí — tu acceso prioritario"', action: 'generate_emails', estimatedTime: '30 seg' },
    ],
  },
  {
    id: 'micro-influencers',
    number: 5,
    title: 'Micro-influencers del nicho',
    tag: 'Activar en el mes 2',
    tagColor: 'pink',
    cost: 'Gratis–Bajo',
    speed: 'Semanas',
    roi: 4,
    scalability: 'Media',
    difficulty: 'Media',
    phase: 'mes2',
    description: 'Colaborar con personas de 1,000 a 50,000 seguidores en el nicho exacto de tu app. Engagement 3-5x mayor que macro-influencers.',
    whyBest: 'Costo casi nulo, la audiencia confía en sus recomendaciones. 1 micro-influencer activo = 50–500 usuarios nuevos.',
    whatPauDoes: 'Genera mensajes de outreach, propuestas de colaboración y el contenido que el influencer puede usar.',
    autopilotDesc: 'PAU genera el brief completo, los mensajes de outreach para 10 influencers y el contenido listo para compartirles.',
    copilotDesc: 'PAU genera todos los materiales de colaboración. Tú contactas a los influencers.',
    channels: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn'],
    exampleMessage: '"Hola [nombre], seguimos tu contenido sobre [tema]. Estamos lanzando [app] que le sería útil a tu comunidad. ¿Te gustaría probarlo gratis?"',
    steps: [
      { id: 'influencer-profile', title: 'Definir perfil de influencer ideal', description: 'Nicho, tamaño, tono, plataforma y tipo de contenido que encaja con la marca', action: 'generate_content', estimatedTime: '30 seg' },
      { id: 'outreach-messages', title: 'Generar 10 mensajes de outreach', description: 'Personalizados, cortos y directos — no pitch genérico', action: 'generate_dms', estimatedTime: '1 min' },
      { id: 'collab-brief', title: 'Brief de colaboración', description: 'Qué se ofrece, qué se espera, cómo medir el resultado', action: 'generate_assets', estimatedTime: '1 min' },
      { id: 'content-kit', title: 'Kit de contenido para el influencer', description: 'Captions, hashtags, key messages y CTA listos para que usen', action: 'generate_content', estimatedTime: '1 min' },
    ],
  },
  {
    id: 'product-directories',
    number: 6,
    title: 'Directorios de productos',
    tag: 'Lanzamiento coordinado mes 1–2',
    tagColor: 'cyan',
    cost: 'Gratis',
    speed: '1–3 días',
    roi: 4,
    scalability: 'Baja',
    difficulty: 'Fácil',
    phase: 'mes2',
    description: 'Publicar en Product Hunt, BetaList, Hacker News y directorios especializados. 500–5,000 visitas el día del lanzamiento.',
    whyBest: 'Cero costo, tráfico inmediato y de alta calidad, validación pública del producto.',
    whatPauDoes: 'Genera todos los assets y copies para cada directorio: tagline, descripción, features, thumbnail copy.',
    autopilotDesc: 'PAU genera todos los materiales listos para publicar en Product Hunt, BetaList y Hacker News en un solo clic.',
    copilotDesc: 'PAU genera el contenido completo para cada plataforma. Tú lo publicas.',
    channels: ['Product Hunt', 'BetaList', 'Hacker News', 'G2', 'Alternativeto'],
    steps: [
      { id: 'product-hunt', title: 'Ficha para Product Hunt', description: 'Tagline (60 chars), descripción, 3 bullet points, galería de imágenes copy', action: 'generate_assets', estimatedTime: '1 min' },
      { id: 'betalist', title: 'Ficha para BetaList', description: 'Descripción corta, beneficios y categoría', action: 'generate_assets', estimatedTime: '30 seg' },
      { id: 'hackernews', title: 'Show HN post', description: 'Título y primer comentario explicando el producto de forma técnica y honesta', action: 'generate_content', estimatedTime: '30 seg' },
      { id: 'launch-day-posts', title: 'Posts del día de lanzamiento', description: '5 posts para redes sociales coordinados con el lanzamiento en directorios', action: 'generate_content', estimatedTime: '1 min' },
    ],
  },
  {
    id: 'partnerships',
    number: 7,
    title: 'Partnerships con negocios',
    tag: 'Construir desde el mes 2–3',
    tagColor: 'orange',
    cost: 'Gratis',
    speed: 'Meses',
    roi: 4,
    scalability: 'Alta',
    difficulty: 'Media',
    phase: 'mes3',
    description: 'Alianzas con negocios complementarios que ya tienen acceso a tu usuario ideal.',
    whyBest: 'Acceso inmediato a bases de clientes establecidas sin costo de adquisición.',
    whatPauDoes: 'Genera la propuesta de partnership, email de outreach y materiales de presentación.',
    autopilotDesc: 'PAU identifica socios potenciales, genera la propuesta y los emails de outreach completos.',
    copilotDesc: 'PAU genera todos los materiales. Tú contactas a los socios potenciales.',
    channels: ['Email', 'LinkedIn', 'WhatsApp Business'],
    steps: [
      { id: 'partner-list', title: 'Identificar socios potenciales', description: 'Lista de negocios complementarios con contacto estimado y razonamiento', action: 'generate_content', estimatedTime: '1 min' },
      { id: 'partnership-email', title: 'Email de propuesta', description: 'Propuesta de valor clara: qué ofreces, qué recibes, cómo funciona', action: 'generate_emails', estimatedTime: '1 min' },
      { id: 'partnership-deck', title: 'One-pager de partnership', description: 'Documento visual con números, beneficios y cómo funciona la colaboración', action: 'generate_assets', estimatedTime: '2 min' },
      { id: 'follow-up', title: 'Secuencia de seguimiento', description: '2 emails de follow-up para los que no respondieron', action: 'generate_emails', estimatedTime: '30 seg' },
    ],
  },
  {
    id: 'building-in-public',
    number: 8,
    title: 'Building in public',
    tag: 'Para quien tiene constancia — largo plazo',
    tagColor: 'slate',
    cost: 'Gratis',
    speed: 'Meses',
    roi: 3,
    scalability: 'Alta',
    difficulty: 'Media',
    phase: 'mes3',
    description: 'Documentar públicamente el proceso de construir tu app: métricas reales, aprendizajes, errores y victorias en LinkedIn o Twitter/X.',
    whyBest: 'Construye audiencia propia, genera confianza y atrae usuarios orgánicamente. Referente: @levelsio ($3M/año, equipo de 1).',
    whatPauDoes: 'Genera posts semanales de "building in public" con métricas reales, los programa y los publica automáticamente.',
    autopilotDesc: 'Cada semana PAU genera y publica automáticamente tu update de "building in public" con las métricas del período.',
    copilotDesc: 'PAU genera el post semanal listo. Tú lo revisas y publicas.',
    channels: ['LinkedIn', 'Twitter/X', 'Instagram', 'Threads'],
    steps: [
      { id: 'bip-intro', title: 'Post de presentación', description: '"Estoy construyendo [X] en público. Aquí el primer update..."', action: 'generate_content', estimatedTime: '1 min' },
      { id: 'weekly-template', title: 'Template de update semanal', description: 'Estructura fija: métricas, qué construí, qué aprendí, qué sigue', action: 'generate_content', estimatedTime: '1 min' },
      { id: 'milestone-posts', title: 'Posts de hitos', description: 'Templates para celebrar: primer usuario, primer pago, 100 usuarios...', action: 'generate_content', estimatedTime: '1 min' },
      { id: 'bip-schedule', title: 'Programar publicaciones', description: 'Calendario de 4 semanas de posts programados', action: 'schedule_post', estimatedTime: '30 seg' },
    ],
  },
  {
    id: 'seo-content',
    number: 9,
    title: 'SEO de contenido',
    tag: 'Invertir desde mes 2 · cosechar en 3–6 meses',
    tagColor: 'green',
    cost: 'Gratis',
    speed: '3–6 meses',
    roi: 4,
    scalability: 'Muy alta',
    difficulty: 'Media',
    phase: 'mes2',
    description: 'Artículos de blog que responden preguntas que tu usuario busca en Google, atrayendo tráfico gratuito y constante.',
    whyBest: '1 artículo bien hecho = 100–1,000 visitas/mes constantes después de 3–6 meses de indexación.',
    whatPauDoes: 'Genera artículos optimizados para SEO, investiga keywords y crea un calendario de contenido.',
    autopilotDesc: 'PAU genera artículos SEO completos con keywords, estructura H1-H3, meta description y CTA integrado.',
    copilotDesc: 'PAU genera el artículo completo con estructura SEO. Tú lo publicas en tu blog.',
    channels: ['Blog', 'Medium', 'LinkedIn Articles', 'Substack'],
    steps: [
      { id: 'keyword-research', title: 'Investigación de keywords', description: 'Lista de 10 keywords con volumen de búsqueda estimado y competencia', action: 'generate_content', estimatedTime: '1 min' },
      { id: 'article-1', title: 'Artículo principal (2,000 palabras)', description: 'Artículo completo optimizado para el keyword primario con estructura SEO', action: 'generate_content', estimatedTime: '3 min' },
      { id: 'meta', title: 'Meta tags y descripción', description: 'Title tag (60 chars), meta description (160 chars), Open Graph', action: 'generate_assets', estimatedTime: '30 seg' },
      { id: 'content-calendar', title: 'Calendario de contenido (4 artículos)', description: 'Plan para el próximo mes con temas, keywords y fechas de publicación', action: 'generate_content', estimatedTime: '1 min' },
    ],
  },
  {
    id: 'paid-ads',
    number: 10,
    title: 'Ads pagados',
    tag: 'Solo después de validar conversión orgánicamente',
    tagColor: 'red',
    cost: '$300+ / canal',
    speed: 'Inmediato',
    roi: 3,
    scalability: 'Muy alta',
    difficulty: 'Alta',
    phase: 'mes3',
    description: 'Meta Ads (Instagram/Facebook), Google Ads o TikTok Ads para escalar lo que ya funciona orgánicamente.',
    whyBest: 'Si CAC < LTV ÷ 3 → escala. Tráfico inmediato y predecible.',
    whatPauDoes: 'Genera copies de ads, segmentaciones de audiencia, estructura de campaña y creativos listos para subir a Meta Ads.',
    autopilotDesc: 'PAU genera y sube las campañas directamente a Meta Ads. Solo apruebas el presupuesto.',
    copilotDesc: 'PAU genera todos los creativos y copies listos. Tú los subes a la plataforma de ads.',
    channels: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'],
    steps: [
      { id: 'audience', title: 'Definir audiencia objetivo', description: 'Segmentación detallada: intereses, comportamientos, lookalike audiences', action: 'generate_content', estimatedTime: '1 min' },
      { id: 'ad-copies', title: 'Generar 5 variaciones de copy', description: 'Headlines, primary text y CTAs para A/B testing', action: 'generate_content', estimatedTime: '2 min' },
      { id: 'campaign-structure', title: 'Estructura de campaña', description: 'Campaña → Adsets → Ads con presupuesto distribuido por objetivo', action: 'generate_assets', estimatedTime: '1 min' },
      { id: 'launch-ads', title: 'Lanzar en Meta Ads', description: 'Subir y activar la campaña en Meta Business Manager', action: 'schedule_post', estimatedTime: '5 min' },
    ],
  },
]

export const getStrategy = (id: string) => STRATEGIES.find(s => s.id === id)

export const PHASE_LABELS: Record<string, string> = {
  mes1: 'Mes 1 — Empezar',
  mes2: 'Mes 2 — Crecer',
  mes3: 'Mes 3 — Escalar',
  mes4: 'Mes 4+ — Dominar',
}
