import { useQuery } from '@tanstack/react-query'
import { transportApi } from '../../api/transportApi'
import { useAuth } from '../../auth/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import { IconBuilding, IconClock, IconUser, IconMapPin } from '../../components/ui/Icons'

function InfoRow({ Icon, label, value, phone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: '1px solid var(--line-2)' }}>
      <div className="icon-chip" style={{ width: 38, height: 38 }}><Icon size={17} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 14.5, color: 'var(--ink)', fontWeight: 500 }}>{value || '—'}</p>
      </div>
      {phone && (
        <a href={`tel:${phone}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', flexShrink: 0 }}>Call</a>
      )}
    </div>
  )
}

export default function StudentTransportPage() {
  const { user } = useAuth()
  const { data: t, isLoading } = useQuery({
    queryKey: ['my-transport', user?.studentId],
    queryFn: () => transportApi.getStudentTransport(user.studentId),
    enabled: !!user?.studentId,
  })

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <PageHeader eyebrow="Transport" title="My Bus" subtitle="Your assigned bus, route, and driver details" />

      {isLoading ? <Spinner /> : !t ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--faint)' }}>
            <IconBuilding size={22} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>No bus assigned</p>
          <p style={{ fontSize: 13, color: 'var(--faint)', marginTop: 4 }}>Contact the school office if you use school transport.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Pine banner */}
          <div style={{ background: 'linear-gradient(150deg,#1f4b38,#173829)', padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(244,239,228,0.13)', border: '1px solid rgba(200,154,91,0.35)', color: '#e9d5b3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconBuilding size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'rgba(216,225,214,0.7)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Bus Number</p>
              <p style={{ margin: '2px 0 0', color: '#f4efe4', fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em' }}>{t.busNumber || '—'}</p>
              {t.routeName && <p style={{ margin: '2px 0 0', color: 'rgba(216,225,214,0.65)', fontSize: 13 }}>{t.routeName}</p>}
            </div>
          </div>
          <div style={{ padding: '4px 24px 18px' }}>
            <InfoRow Icon={IconClock}    label="Pickup time"   value={t.pickupTime} />
            <InfoRow Icon={IconClock}    label="Drop time"     value={t.dropTime} />
            <InfoRow Icon={IconMapPin}   label="Pickup stop"   value={t.pickupStop} />
            <InfoRow Icon={IconUser}     label="Driver"        value={t.driverName}    phone={t.driverPhone} />
            <InfoRow Icon={IconUser}     label="Conductor"     value={t.conductorName} phone={t.conductorPhone} />
          </div>
        </div>
      )}
    </div>
  )
}
