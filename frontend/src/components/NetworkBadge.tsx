import { scaffoldConfig } from '../scaffold.config';

export default function NetworkBadge() {
  return (
    <span className="network-badge">
      {scaffoldConfig.network}
    </span>
  );
}
