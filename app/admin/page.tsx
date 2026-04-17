import { createClient } from '@/lib/supabase/server'
import { OrgToggle } from '@/components/admin/OrgToggle'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: orgs } = await supabase
    .from('organizations').select('*, organization_members(count)').order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Admin — Sofía AI</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 32 }}>{orgs?.length ?? 0} organizaciones</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orgs?.map(org => (
          <div key={org.id} className="glass" style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{org.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-dimmer)' }}>
                {new Date(org.created_at).toLocaleDateString('es-AR')} · {org.slug}
              </p>
            </div>
            <OrgToggle orgId={org.id} isActive={org.is_active} />
          </div>
        ))}
      </div>
    </div>
  )
}
