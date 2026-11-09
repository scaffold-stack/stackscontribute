"use client";

import Link from 'next/link';
import { WalletConnect } from './WalletConnect';
import NetworkBadge from './NetworkBadge';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-brand">
          <span className="site-brand__mark" aria-hidden />
          <span className="site-brand__name">StacksContribute</span>
          <NetworkBadge />
        </Link>
        <div className="site-header__actions">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
