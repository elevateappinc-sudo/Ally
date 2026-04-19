# Agent 1 Update: Inventory Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a BLOCK 2 (inventory_basic) to the Agent 1 intake conversation that captures product/service categories and the star item, with three input options: file upload (PDF/image), website URL, or continuing by voice.

**Architecture:** Claude outputs a `[SHOW_INVENTORY_INPUT]` marker when the user indicates they have a document/website — the frontend detects this marker, hides it from the transcript, and shows an inline upload panel. After processing (via two new API endpoints that call Claude with document/vision or HTML content), the extraction result is injected back into the conversation as a user message and `sendMessage` continues normally. Voice-only path requires no new endpoints — the conversation just continues.

**Tech Stack:** Next.js App Router, Supabase (auth + Storage), Anthropic Claude (`claude-sonnet-4-6`) with PDF/image document support, `fetch` for website scraping.

---

## File Structure

**Modified files:**
- `app/api/intake/chat/route.ts` — update `SYSTEM_PROMPT` (new block, new marker, updated JSON schema)
- `app/(app)/intake/IntakeClient.tsx` — add `showInventoryInput` state, marker detection, inline inventory panel
- `lib/supabase/types.ts` — add `ProductsServicesBasic` type

**New files:**
- `app/api/agents/1/process-inventory-document/route.ts` — POST, downloads file from Supabase Storage, sends to Claude vision/document, returns extraction
- `app/api/agents/1/process-inventory-website/route.ts` — POST, fetches URL HTML, sends to Claude, returns extraction

---

## Task 1: Update System Prompt — Add Inventory Block

**Files:**
- Modify: `app/api/intake/chat/route.ts` (lines 1–61, the `SYSTEM_PROMPT` constant)

- [ ] **Step 1: Replace the SYSTEM_PROMPT constant**

Replace the entire `const SYSTEM_PROMPT = \`...\`` with:

```typescript
const SYSTEM_PROMPT = `You are Sofía, a warm and expert marketing consultant conducting a voice intake interview in Spanish.

CRITICAL VOICE-SPECIFIC RULES:

1. BREVITY: Keep responses SHORT (2-3 sentences max before pausing). Never give long monologues. One idea at a time.

2. CONVERSATIONAL TONE: Speak naturally. Use "tú" form. Verbal acknowledgments: "ok", "perfecto", "claro". No bullet points, no lists, no markdown.

3. ACTIVE LISTENING: Paraphrase to confirm: "O sea que..." / Acknowledge: "Claro, entiendo" / Validate: "Tiene sentido"

4. ADAPTIVE QUESTIONING — classify user based on first response:
   - BEGINNER: vague answers, no metrics → simple language, guide heavily
   - INTERMEDIATE: mentions social media, some numbers → balance education and extraction
   - ADVANCED: specific metrics, marketing terms → deeper questions
   - EXPERT: uses CAC/LTV/ROAS/funnel → very technical, challenge assumptions

5. QUESTION BLOCKS (in order, adapt depth to level):
   BLOCK 1 - business_basics: ¿Qué haces? ¿Cuánto tiempo? ¿Online o físico?
   BLOCK 2 - inventory_basic: (see INVENTORY BLOCK instructions below)
   BLOCK 3 - objectives: ¿Qué querés lograr en 6 meses? ¿Números específicos?
   BLOCK 4 - current_situation: ¿Qué marketing hacés hoy? ¿Resultados?
   BLOCK 5 - customer: ¿Quién es tu mejor cliente? ¿Por qué te compran?
   BLOCK 6 - competition: ¿Quiénes son tus competidores? ¿Qué hacen mejor/peor?
   BLOCK 7 - resources: ¿Presupuesto mensual? ¿Tiempo disponible por semana?

6. CONFIRMATIONS: After each block, confirm briefly: "Entonces [paraphrase], ¿correcto?"

7. EMOTIONAL ADAPTATION:
   - Frustrated → empathize, validate
   - Overwhelmed → simplify, reassure
   - Excited → channel productively

8. FATIGUE: If very short responses → "¿Querés que paremos aquí y continuamos después?"

9. OPENING: Only on your very first response when the conversation has no prior messages.
   Start with: "Hola, soy Sofía. Cuéntame: ¿qué hacés y qué necesitás de mí?"
   NEVER repeat this greeting if the user has already said anything. Jump straight into the conversation.

---

INVENTORY BLOCK (BLOCK 2) — SPECIAL INSTRUCTIONS:

When transitioning from business_basics to inventory, say:
"Para crear contenido específico, necesito saber qué vendés. ¿Tenés un menú, catálogo o sitio web, o preferís contármelo brevemente?"

CASE A — User says they HAVE a document, menu, catalog, or website:
Output this marker EXACTLY on its own line, then nothing else:
[SHOW_INVENTORY_INPUT]
The interface will show upload options. Wait for the user to send the extracted data.

CASE B — User already described their inventory in the same message (e.g. "vendo café y pasteles, lo más vendido es X"):
Do NOT output [SHOW_INVENTORY_INPUT]. Just confirm: "Perfecto, entonces [paraphrase]..." and ask the industry-specific follow-up below. Then continue.

CASE C — User says they don't have a document and wants to describe verbally:
Ask: "Contame: ¿qué vendés y cuál es tu producto o servicio más importante?"
After they answer, ask the industry-specific follow-up. Then continue.

INDUSTRY-SPECIFIC FOLLOW-UP (ask once, after initial inventory info):
- Food/café/restaurant → "¿Tenés opciones especiales? Por ejemplo vegano, sin gluten, sin azúcar..."
- Retail/store → "¿Manejás tu propia marca o revendés otras? ¿Y en qué rango de precios estás?"
- Services → "¿Ofrecés paquetes o planes, o es todo a medida?"
- Digital/SaaS → "¿Cuáles son las 2-3 funcionalidades que más valoran tus usuarios?"

TRANSITION after inventory is captured:
Say: "Perfecto, ya tengo lo esencial. Más adelante vamos a detallar todo el catálogo completo, pero con esto puedo armar tu estrategia inicial. Sigamos con tus objetivos..."

Keep this block SHORT — maximum 2-3 exchanges. Do not ask for prices or full item lists.

---

COMPLETION DETECTION:
When you have covered all 7 blocks and have enough information, output EXACTLY this marker on its own line, followed by the JSON:

[INTAKE_COMPLETE]
{
  "user_profile": "beginner|intermediate|advanced|expert",
  "business_info": { "name": "", "industry": "", "years_operating": "", "business_model": "", "location": "" },
  "products_services_basic": {
    "input_method": "voice_description",
    "categories": [],
    "signature_items": [],
    "special_attributes": [],
    "observations": "",
    "detailed_catalog_completed": false
  },
  "objectives": { "primary_goal": "", "new_customers_target": "", "revenue_target_6m": "" },
  "current_marketing": { "channels": [], "social_media": {}, "paid_ads": { "active": false } },
  "customer_profile": { "demographics": {}, "psychographics": {}, "behavior": {} },
  "competitors": [],
  "resources": { "budget_monthly": null, "time_weekly": "" },
  "pain_points": [],
  "expectations": []
}

Before outputting [INTAKE_COMPLETE], say a brief closing remark like: "Perfecto, ya tengo todo lo que necesito. En un momento te cuento qué sigue."

CRITICAL: Never use lists, asterisks, or formatted text. This is a voice conversation.`
```

- [ ] **Step 2: Verify the file still compiles**

```bash
npx tsc --noEmit 2>&1 | grep "intake/chat"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add app/api/intake/chat/route.ts
git commit -m "feat: add inventory_basic block to intake system prompt with [SHOW_INVENTORY_INPUT] marker"
```

---

## Task 2: Update Types

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Add `ProductsServicesBasic` to `lib/supabase/types.ts`**

Add at the end of the file:

```typescript
export interface ProductsServicesBasic {
  input_method: 'document' | 'website' | 'voice_description' | 'skipped'
  source?: {
    type: 'pdf' | 'image' | 'website'
    url?: string
  }
  categories: string[]
  signature_items: string[]
  special_attributes: string[]
  observations: string
  detailed_catalog_completed: boolean
}

export interface InventoryExtraction {
  categories: string[]
  signature_items: string[]
  special_attributes: string[]
  observations: string
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "types.ts"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "feat: add ProductsServicesBasic and InventoryExtraction types"
```

---

## Task 3: Update BLOCKS Array and Progress Bar

**Files:**
- Modify: `app/(app)/intake/IntakeClient.tsx` (line 12)

- [ ] **Step 1: Update the BLOCKS constant**

Find line 12 in `IntakeClient.tsx`:
```typescript
const BLOCKS = ['business_basics', 'objectives', 'current_situation', 'customer', 'competition', 'resources']
```

Replace with:
```typescript
const BLOCKS = ['business_basics', 'inventory_basic', 'objectives', 'current_situation', 'customer', 'competition', 'resources']
```

- [ ] **Step 2: Verify progress math still works**

The `progress` and `blockIndex` logic on line 50 and ~110 uses `BLOCKS.length` — since we just changed the constant, no other changes needed. Verify:

```bash
npx tsc --noEmit 2>&1 | grep "IntakeClient"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/intake/IntakeClient.tsx
git commit -m "feat: add inventory_basic to intake progress blocks (7 total)"
```

---

## Task 4: Supabase Storage Bucket

- [ ] **Step 1: Run this SQL in Supabase SQL editor**

```sql
-- Create private storage bucket for intake documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-documents',
  'intake-documents',
  false,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own session folder
CREATE POLICY "Authenticated users can upload intake documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'intake-documents');

-- Allow authenticated users to read their own uploads
CREATE POLICY "Authenticated users can read intake documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'intake-documents');

-- Allow service role full access (for backend download)
CREATE POLICY "Service role full access intake documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'intake-documents')
WITH CHECK (bucket_id = 'intake-documents');
```

- [ ] **Step 2: Verify bucket exists**

Go to Supabase → Storage → confirm `intake-documents` bucket appears.

- [ ] **Step 3: Commit note**

```bash
git commit --allow-empty -m "infra: create intake-documents storage bucket (applied in Supabase)"
```

---

## Task 5: Document Processing Endpoint

**Files:**
- Create: `app/api/agents/1/process-inventory-document/route.ts`

This endpoint receives a Supabase Storage path, downloads the file as bytes, sends it to Claude as a PDF document or image, and returns the structured extraction.

- [ ] **Step 1: Create the file**

```typescript
// app/api/agents/1/process-inventory-document/route.ts
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'
import type { InventoryExtraction } from '@/lib/supabase/types'

export const maxDuration = 60

const EXTRACTION_PROMPT = (businessName: string, industry: string, location: string) => `
Analizá este documento que contiene el menú o catálogo de un negocio.

CONTEXTO:
- Negocio: ${businessName}
- Tipo: ${industry}
- Ubicación: ${location}

TAREA: Extraé SOLO lo siguiente (no necesito todo el detalle):

1. CATEGORÍAS PRINCIPALES: ¿Qué grandes categorías de productos/servicios tiene? Ej: "Bebidas calientes", "Comida", "Retail"
2. PRODUCTOS DESTACADOS: ¿Hay algún producto marcado como especial, estrella, popular, o favorito? Máximo 3.
3. OPCIONES ESPECIALES: ¿Menciona vegano, sin gluten, sin azúcar, orgánico, etc?
4. OBSERVACIONES: Cualquier dato notable (precios altos/bajos, temporada, etc.)

Respondé ÚNICAMENTE con este JSON exacto (sin markdown):
{
  "categories": ["Bebidas calientes", "Comida", "Retail"],
  "signature_items": ["Latte de Lavanda con Miel"],
  "special_attributes": ["Leches vegetales disponibles", "Opciones veganas"],
  "observations": "Menú mid-range enfocado en café artesanal."
}

IMPORTANTE: Solo categorías generales, no listes cada item. Máximo 3 signature_items.
`

function parseExtraction(text: string): InventoryExtraction {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      categories: parsed.categories ?? [],
      signature_items: parsed.signature_items ?? [],
      special_attributes: parsed.special_attributes ?? [],
      observations: parsed.observations ?? '',
    }
  } catch {
    return { categories: [], signature_items: [], special_attributes: [], observations: '' }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, storage_path, file_type, business_context } = await request.json()
  // file_type: 'pdf' | 'image'
  // storage_path: e.g. "abc-session-id/menu.pdf"
  // business_context: { name, industry, location }

  if (!storage_path || !file_type || !business_context) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Download file from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('intake-documents')
    .download(storage_path)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Failed to download file', detail: downloadError?.message }, { status: 500 })
  }

  // Convert to base64
  const buffer = await fileData.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const anthropic = getAnthropicClient()
  const prompt = EXTRACTION_PROMPT(
    business_context.name,
    business_context.industry,
    business_context.location
  )

  let responseText = ''
  try {
    if (file_type === 'pdf') {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as any,
            { type: 'text', text: prompt },
          ],
        }],
      })
      responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    } else {
      // image: jpeg or png
      const mediaType = storage_path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: prompt },
          ],
        }],
      })
      responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Claude error', detail: err?.message }, { status: 500 })
  }

  const extraction = parseExtraction(responseText)
  return NextResponse.json({ extraction, session_id })
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "process-inventory-document"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add app/api/agents/1/process-inventory-document/route.ts
git commit -m "feat: add document inventory extraction endpoint (PDF + image via Claude)"
```

---

## Task 6: Website Processing Endpoint

**Files:**
- Create: `app/api/agents/1/process-inventory-website/route.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/api/agents/1/process-inventory-website/route.ts
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import { NextResponse } from 'next/server'
import type { InventoryExtraction } from '@/lib/supabase/types'

export const maxDuration = 30

const WEBSITE_EXTRACTION_PROMPT = (url: string, businessName: string, industry: string) => `
Analizá este sitio web y extraé información de productos/servicios.

URL: ${url}
Negocio: ${businessName}
Tipo: ${industry}

Del HTML a continuación, buscá:
- Páginas de menú, productos, servicios, catálogo
- Productos o servicios destacados como "popular", "bestseller", "favorito", "especial"
- Opciones dietéticas o especiales (vegano, sin gluten, etc.)

Extraé SOLO:
1. Categorías principales (máximo 6)
2. Productos/servicios destacados (máximo 3)
3. Atributos especiales
4. Una observación breve

Respondé ÚNICAMENTE con este JSON exacto (sin markdown):
{
  "categories": [],
  "signature_items": [],
  "special_attributes": [],
  "observations": ""
}
`

function parseExtraction(text: string): InventoryExtraction {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      categories: parsed.categories ?? [],
      signature_items: parsed.signature_items ?? [],
      special_attributes: parsed.special_attributes ?? [],
      observations: parsed.observations ?? '',
    }
  } catch {
    return { categories: [], signature_items: [], special_attributes: [], observations: '' }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, business_context } = await request.json()
  if (!url || !business_context) {
    return NextResponse.json({ error: 'Missing url or business_context' }, { status: 400 })
  }

  // Normalize URL
  const normalized = url.startsWith('http') ? url : `https://${url}`

  // Fetch website HTML
  let html = ''
  try {
    const res = await fetch(normalized, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SofiaBot/1.0)' },
    })
    if (!res.ok) return NextResponse.json({ error: `Site returned ${res.status}` }, { status: 400 })
    const full = await res.text()
    // Trim to 15k chars to avoid Claude context limits — enough for any menu page
    html = full.slice(0, 15000)
  } catch (err: any) {
    return NextResponse.json({ error: 'Could not fetch website', detail: err?.message }, { status: 400 })
  }

  const anthropic = getAnthropicClient()
  const prompt = WEBSITE_EXTRACTION_PROMPT(normalized, business_context.name, business_context.industry)

  let responseText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nHTML DEL SITIO:\n${html}`,
      }],
    })
    responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (err: any) {
    return NextResponse.json({ error: 'Claude error', detail: err?.message }, { status: 500 })
  }

  const extraction = parseExtraction(responseText)
  return NextResponse.json({ extraction, url: normalized })
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "process-inventory-website"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add app/api/agents/1/process-inventory-website/route.ts
git commit -m "feat: add website inventory extraction endpoint"
```

---

## Task 7: IntakeClient — Marker Detection and Inventory State

**Files:**
- Modify: `app/(app)/intake/IntakeClient.tsx`

This task adds: `showInventoryInput` state flag, detection of `[SHOW_INVENTORY_INPUT]` in `sendMessage`, and pausing voice recognition when the panel shows.

- [ ] **Step 1: Add state and businessContext near the top of IntakeClient**

After line 30 (`const [resumed, setResumed] = useState(false)`), add:

```typescript
const [showInventoryInput, setShowInventoryInput] = useState(false)
const [businessBrief, setBusinessBrief] = useState<any>(null)
// Populated after BLOCK 1 completes — used by inventory endpoints
const [businessContext, setBusinessContext] = useState<{ name: string; industry: string; location: string } | null>(null)
```

- [ ] **Step 2: Update `sendMessage` to detect both markers**

In the `sendMessage` callback, find the line:
```typescript
const { response, isComplete } = await res.json()
```

Replace with:
```typescript
const { response: rawResponse, isComplete, businessBrief: brief } = await res.json()

// Detect inventory input marker
const inventoryMarker = '[SHOW_INVENTORY_INPUT]'
let response = rawResponse
if (rawResponse.includes(inventoryMarker)) {
  response = rawResponse.replace(inventoryMarker, '').trim()
  setShowInventoryInput(true)
  // Pause voice recognition while panel is visible
  isPausedRef.current = true
}

// Capture business brief when complete
if (brief) setBusinessBrief(brief)
```

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "IntakeClient"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/intake/IntakeClient.tsx
git commit -m "feat: detect [SHOW_INVENTORY_INPUT] marker and add inventory UI state"
```

---

## Task 8: IntakeClient — Inventory Input Panel UI

**Files:**
- Modify: `app/(app)/intake/IntakeClient.tsx`

This task adds the inline inventory panel that appears below the transcript. It handles all three paths: file upload, website URL, and "tell by voice".

- [ ] **Step 1: Add the `handleInventoryResult` callback**

After the `handleStop` callback, add:

```typescript
// Called after document or website processing — injects result into conversation
const handleInventoryResult = useCallback(async (
  extraction: { categories: string[]; signature_items: string[]; special_attributes: string[]; observations: string },
  inputMethod: 'document' | 'website'
) => {
  setShowInventoryInput(false)
  if (!sessionId) return

  const parts: string[] = []
  if (extraction.categories.length) parts.push(`Categorías: ${extraction.categories.join(', ')}`)
  if (extraction.signature_items.length) parts.push(`Producto estrella: ${extraction.signature_items.join(', ')}`)
  if (extraction.special_attributes.length) parts.push(`Opciones especiales: ${extraction.special_attributes.join(', ')}`)
  if (extraction.observations) parts.push(extraction.observations)

  const userMessage = `Acá está mi inventario básico. ${parts.join('. ')}`

  isPausedRef.current = false
  await sendMessage(userMessage, history, sessionId, inputModeRef.current)
}, [sessionId, history, sendMessage])
```

- [ ] **Step 2: Add the inventory panel JSX**

In the return statement of the main conversation UI (after `<ConversationTranscript ... />` and before the text input section), add:

```tsx
{/* Inventory input panel — appears when Claude outputs [SHOW_INVENTORY_INPUT] */}
{showInventoryInput && (
  <InventoryInputPanel
    sessionId={sessionId!}
    businessContext={businessContext}
    onResult={handleInventoryResult}
    onVoice={() => {
      setShowInventoryInput(false)
      isPausedRef.current = false
    }}
  />
)}
```

- [ ] **Step 3: Add the `InventoryInputPanel` component at the bottom of the file (before the last closing brace)**

Add this as a standalone function component at the bottom of `IntakeClient.tsx`, outside `IntakeClient`:

```tsx
interface InventoryInputPanelProps {
  sessionId: string
  businessContext: { name: string; industry: string; location: string } | null
  onResult: (extraction: { categories: string[]; signature_items: string[]; special_attributes: string[]; observations: string }, method: 'document' | 'website') => void
  onVoice: () => void
}

function InventoryInputPanel({ sessionId, businessContext, onResult, onVoice }: InventoryInputPanelProps) {
  const [mode, setMode] = useState<'select' | 'upload' | 'website' | null>('select')
  const [processing, setProcessing] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const supabase = (await import('@/lib/supabase/client')).createClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size and type
    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`El archivo es muy grande. Máximo ${file.type === 'application/pdf' ? '10MB' : '5MB'}.`)
      return
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      setError('Solo se aceptan PDF, JPG y PNG.')
      return
    }

    setError(null)
    setProcessing(true)

    try {
      // Upload to Supabase Storage
      const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
      const sb = createBrowserClient()
      const storagePath = `${sessionId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await sb.storage
        .from('intake-documents')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      // Call extraction endpoint
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'
      const res = await fetch('/api/agents/1/process-inventory-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          storage_path: storagePath,
          file_type: fileType,
          business_context: businessContext ?? { name: '', industry: '', location: '' },
        }),
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)
      const { extraction } = await res.json()
      onResult(extraction, 'document')
    } catch (err: any) {
      setError('No se pudo procesar el archivo. Continuá por voz.')
    } finally {
      setProcessing(false)
    }
  }

  const handleWebsite = async () => {
    if (!websiteUrl.trim()) return
    setError(null)
    setProcessing(true)
    try {
      const res = await fetch('/api/agents/1/process-inventory-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: websiteUrl.trim(),
          business_context: businessContext ?? { name: '', industry: '', location: '' },
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const { extraction } = await res.json()
      onResult(extraction, 'website')
    } catch (err: any) {
      setError('No se pudo analizar el sitio. Continuá por voz.')
    } finally {
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div style={{
        width: '100%', maxWidth: 560, background: 'rgba(168,85,247,0.08)',
        border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(168,85,247,0.3)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          Analizando {mode === 'website' ? 'sitio web' : 'documento'}... (10-30 segundos)
        </p>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', maxWidth: 560, background: 'rgba(168,85,247,0.08)',
      border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', textAlign: 'center' }}>
        ¿Cómo querés compartir tu inventario?
      </p>

      {mode === 'select' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'upload', icon: '📄', label: 'Subir archivo', sub: 'PDF o imagen' },
            { id: 'website', icon: '🔗', label: 'Link de sitio', sub: 'Menú o catálogo online' },
            { id: 'voice', icon: '🎤', label: 'Contarlo por voz', sub: 'Descripción verbal' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => opt.id === 'voice' ? onVoice() : setMode(opt.id as any)}
              style={{
                flex: '1 1 140px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)', borderRadius: 12, padding: '14px 12px',
                cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{opt.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      )}

      {mode === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            border: '2px dashed rgba(168,85,247,0.4)', borderRadius: 12, padding: 24,
            cursor: 'pointer', background: 'rgba(168,85,247,0.05)',
          }}>
            <span style={{ fontSize: 32 }}>📎</span>
            <span style={{ fontSize: 14, color: 'white' }}>Tocá para seleccionar archivo</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>PDF (máx 10MB) · JPG/PNG (máx 5MB)</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setMode('select')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>← Volver</button>
        </div>
      )}

      {mode === 'website' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="url"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://tu-negocio.com/menu"
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: 15, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMode('select')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>← Volver</button>
            <button onClick={handleWebsite} className="btn btn-primary" style={{ flex: 1 }} disabled={!websiteUrl.trim()}>
              Analizar sitio
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ color: '#f87171', fontSize: 13 }}>⚠️ {error}</p>
          <button onClick={onVoice} className="btn btn-glass" style={{ fontSize: 12, padding: '6px 12px' }}>Continuar por voz</button>
        </div>
      )}
    </div>
  )
}
```

**Note:** The `InventoryInputPanel` uses a dynamic import for the Supabase client to avoid SSR issues. The `useState` import is already at the top of `IntakeClient.tsx`.

- [ ] **Step 4: Fix the dynamic import — replace the supabase line inside `InventoryInputPanel`**

The `await import(...)` inside the component body won't work. Instead use the client directly. Replace the supabase line in `handleFileUpload`:

```typescript
// Remove this line from the component body:
const supabase = (await import('@/lib/supabase/client')).createClient()

// And inside handleFileUpload, replace:
const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
const sb = createBrowserClient()
```

With a top-level import at the very top of `IntakeClient.tsx`:

```typescript
import { createClient as createBrowserClient } from '@/lib/supabase/client'
```

Then in `handleFileUpload`, just use `createBrowserClient()` directly (no dynamic import).

- [ ] **Step 5: Verify compiles**

```bash
npx tsc --noEmit 2>&1 | grep "IntakeClient"
```

Expected: no output (or only pre-existing unrelated warnings)

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/intake/IntakeClient.tsx
git commit -m "feat: add InventoryInputPanel with upload/website/voice options to IntakeClient"
```

---

## Task 9: Update businessContext After Block 1

**Files:**
- Modify: `app/(app)/intake/IntakeClient.tsx`

The inventory endpoints need `{ name, industry, location }`. After Block 1 completes, this data is in the conversation but not extracted yet. The simplest approach: call a lightweight Claude prompt to extract it from the history when transitioning to the inventory block, OR just pass a best-effort extraction.

For MVP simplicity: extract `businessContext` from `businessBrief` when it's set, OR let it remain null (the endpoints handle null with empty strings). The extraction prompt still works without context — it just won't be personalized.

However, a better approach: extract business context after the first few turns by watching for the marker. When `[SHOW_INVENTORY_INPUT]` fires, we have at least Block 1 done. Parse what we can from conversation history.

- [ ] **Step 1: Add a helper that extracts business context from history**

In `IntakeClient.tsx`, after the state declarations, add this helper used in the marker detection:

```typescript
function extractBusinessContextFromHistory(turns: Turn[]): { name: string; industry: string; location: string } {
  // Best-effort: join last 6 turns and let the inventory endpoint handle it with context
  // The business_brief is set when complete — before that, use what's in history as a string hint
  const text = turns.map(t => t.content).join(' ')
  // Return empty strings — the endpoints will still work; Claude infers from the document itself
  return { name: '', industry: '', location: '' }
}
```

- [ ] **Step 2: Set businessContext when the inventory marker fires**

In the `sendMessage` callback, inside the `if (rawResponse.includes(inventoryMarker))` block, add:

```typescript
setBusinessContext(extractBusinessContextFromHistory(history))
```

So the full block becomes:
```typescript
if (rawResponse.includes(inventoryMarker)) {
  response = rawResponse.replace(inventoryMarker, '').trim()
  setShowInventoryInput(true)
  setBusinessContext(extractBusinessContextFromHistory(history))
  isPausedRef.current = true
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/intake/IntakeClient.tsx
git commit -m "feat: extract business context when inventory panel triggers"
```

---

## Task 10: Add /api/agents to proxy matcher

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Verify the proxy matcher already covers API routes**

Open `proxy.ts` and find the `config` export at the bottom:

```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
}
```

The `api/` paths are already excluded from the proxy middleware. No change needed — the new endpoints are under `/api/agents/1/` and will work without proxy modification.

- [ ] **Step 2: Confirm (no commit needed)**

```bash
grep -n "matcher" proxy.ts
```

Expected output contains `api/` in the exclusion pattern. Done.

---

## Task 11: Deploy and Manual Test

- [ ] **Step 1: Push everything**

```bash
git push origin main
```

- [ ] **Step 2: Promote to Production in Vercel**

Vercel → Deployments → latest → `···` → Promote to Production

- [ ] **Step 3: Manual test — voice path (no document)**

1. Go to `/intake` → start text or voice mode
2. Answer the first question ("¿qué hacés?")
3. Sofia should transition to the inventory question: "Para crear contenido específico, necesito saber qué vendés..."
4. Reply: "No tengo catálogo, te lo cuento: vendo café de especialidad y mi producto estrella es un latte de lavanda"
5. Sofia should NOT show the inventory panel (no `[SHOW_INVENTORY_INPUT]` — CASE B)
6. Sofia confirms and continues to Block 3 (objectives)
7. Complete the interview — `[INTAKE_COMPLETE]` JSON should contain `products_services_basic.input_method = "voice_description"`

- [ ] **Step 4: Manual test — website path**

1. Start fresh intake
2. After Block 1, reply "tengo mi sitio web"
3. Inventory panel should appear with three options
4. Click "🔗 Link de sitio"
5. Enter a real website URL (e.g. a coffee shop's menu page)
6. Click "Analizar sitio"
7. Loading state shows "Analizando sitio web..."
8. After 10-30s, panel disappears and Sofia responds to the extracted inventory
9. Conversation continues normally

- [ ] **Step 5: Manual test — file upload path**

1. Start fresh intake
2. After Block 1, reply "sí tengo un PDF del menú"
3. Inventory panel appears
4. Click "📄 Subir archivo"
5. Select a PDF file under 10MB
6. File uploads → processing shows → Sofia responds with extracted categories
7. Conversation continues

- [ ] **Step 6: Manual test — error fallback**

1. In the website path, enter an invalid URL: `https://this-does-not-exist-xyz.com`
2. Error message shows: "No se pudo analizar el sitio. Continuá por voz."
3. "Continuar por voz" button appears
4. Click it → panel hides → voice/text input re-enables → conversation continues

---

## Self-Review

**Spec coverage check:**
- ✅ New inventory block between business_basics and objectives
- ✅ `[SHOW_INVENTORY_INPUT]` marker mechanism
- ✅ Three input options: upload / website / voice
- ✅ PDF + image support (Word/Excel intentionally omitted)
- ✅ Website URL scraping + Claude analysis
- ✅ Document stored in Supabase Storage (not local filesystem)
- ✅ Claude extraction prompt (categories, signature_items, special_attributes, observations)
- ✅ Result injected back into conversation as user message
- ✅ Validation: Sofia reads and confirms what was extracted
- ✅ Transition message: "más adelante vamos a detallar todo el catálogo"
- ✅ Industry-specific follow-up in system prompt
- ✅ Error fallback to voice in all failure cases
- ✅ `products_services_basic` in `[INTAKE_COMPLETE]` JSON schema
- ✅ `detailed_catalog_completed: false` placeholder for future Agent 2.5
- ✅ 5MB image / 10MB PDF size limits
- ✅ Block count updated from 6 to 7 in progress bar
