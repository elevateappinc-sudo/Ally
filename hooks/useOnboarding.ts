import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OnboardingData {
  business: string
  painPoint: string
  socialUrl: string
  timeCommitment: string
}

const STEPS = [
  {
    question: '¿Qué vendes?',
    sub: 'Cuéntame sobre tu negocio en pocas palabras',
    field: 'business' as keyof OnboardingData,
    options: [],
  },
  {
    question: '¿Cuál es tu mayor reto?',
    sub: 'Con marketing y creación de contenido',
    field: 'painPoint' as keyof OnboardingData,
    options: ['No tengo tiempo para crear contenido', 'No sé qué publicar', 'Publico pero no veo resultados'],
  },
  {
    question: '¿Tienes redes activas?',
    sub: 'Instagram, TikTok, Facebook...',
    field: 'socialUrl' as keyof OnboardingData,
    options: [],
  },
  {
    question: '¿Cuánto tiempo tienes?',
    sub: 'Por semana para marketing',
    field: 'timeCommitment' as keyof OnboardingData,
    options: ['30 minutos', '1-2 horas', '3+ horas'],
  },
]

export function useOnboarding(orgId: string) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const currentStep = STEPS[step]

  const answer = useCallback((value: string) => {
    const field = STEPS[step].field
    setData(prev => ({ ...prev, [field]: value }))

    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    }
  }, [step])

  const finish = useCallback(async (lastValue: string) => {
    const field = STEPS[step].field
    const finalData = { ...data, [field]: lastValue }
    setSaving(true)

    await supabase.from('onboarding_data').insert({
      org_id: orgId,
      business: finalData.business!,
      pain_point: finalData.painPoint!,
      social_url: finalData.socialUrl || null,
      time_commitment: finalData.timeCommitment!,
    })

    setSaving(false)
    setDone(true)
  }, [data, orgId, step, supabase])

  return { step, currentStep, data, answer, finish, saving, done, totalSteps: STEPS.length }
}
