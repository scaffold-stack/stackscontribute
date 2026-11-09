import { scaffoldConfig } from '../scaffold.config';

export default function NetworkBadge() {
  return (
    <span
      style={{
        marginLeft: '0.35rem',
        padding: '0.15rem 0.5rem',
        borderRadius: '999px',
        border: '1px solid rgba(16, 36, 28, 0.14)',
        background: 'rgba(15, 122, 82, 0.08)',
        color: '#0a5c3d',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {scaffoldConfig.network}
    </span>
  );
}
