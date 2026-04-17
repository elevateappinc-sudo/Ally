export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return new Response('No API key', { status: 503 })

  const { text } = await request.json()
  if (!text) return new Response('Missing text', { status: 400 })

  const voiceId = 'EXAVITQu4vr4xnSDxMaL' // Sara — español
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true },
    }),
  })

  if (!res.ok) return new Response('ElevenLabs error', { status: 502 })
  const buffer = await res.arrayBuffer()
  return new Response(buffer, { headers: { 'Content-Type': 'audio/mpeg' } })
}
