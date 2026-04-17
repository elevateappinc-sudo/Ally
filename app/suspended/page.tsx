export default function SuspendedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div className="glass fade-in" style={{ maxWidth: 480, padding: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Cuenta suspendida</h1>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Tu cuenta ha sido temporalmente suspendida. Contactá al soporte de Sofía AI para más información.
        </p>
        <a href="mailto:hola@sofia-ai.com" style={{
          display: 'inline-block', marginTop: 24,
          color: 'var(--siri-cyan)', fontSize: 14,
        }}>
          hola@sofia-ai.com
        </a>
      </div>
    </div>
  )
}
