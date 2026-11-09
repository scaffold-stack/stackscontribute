"use client";

import { FormEvent, useEffect, useState } from 'react';
import { Cl, Pc } from '@stacks/transactions';
import { useAtomValue } from 'jotai';
import {
  useContribute_Donate,
  useContribute_GetDonation,
  useContribute_Withdraw,
} from '@/generated/hooks';
import { addressAtom } from '@/store/wallet';
import {
  CauseRecord,
  formatStx,
  isValidPrincipal,
  parseStxInput,
  truncateAddress,
} from '@/lib/stx';

type Props = {
  causeId: number;
  cause: CauseRecord;
  onChanged?: () => void;
};

export function CauseCard({ causeId, cause, onChanged }: Props) {
  const address = useAtomValue(addressAtom);
  const donate = useContribute_Donate();
  const withdraw = useContribute_Withdraw();
  const myDonation = useContribute_GetDonation();
  const [amount, setAmount] = useState('1');

  const available = cause.raised - cause.withdrawn;
  const progress =
    cause.goal > 0n
      ? Math.min(100, Number((cause.raised * 1000n) / cause.goal) / 10)
      : null;
  const isCreator = isValidPrincipal(address) && address === cause.creator;
  const connected = isValidPrincipal(address);

  useEffect(() => {
    if (!connected) return;
    void myDonation.call([Cl.uint(causeId), Cl.principal(address)]).catch(() => {});
  }, [causeId, address, connected, myDonation.call]);

  async function onDonate(event: FormEvent) {
    event.preventDefault();
    if (!connected) return;
    const micro = parseStxInput(amount);
    if (micro === null || micro <= 0n) return;

    await donate.call(
      [Cl.uint(causeId), Cl.uint(micro)],
      [Pc.principal(address).willSendEq(micro).ustx()],
    );
    setAmount('1');
    onChanged?.();
    void myDonation.call([Cl.uint(causeId), Cl.principal(address)]).catch(() => {});
  }

  async function onWithdraw() {
    if (!isCreator) return;
    await withdraw.call([Cl.uint(causeId)]);
    onChanged?.();
  }

  return (
    <article className="cause-card" style={{ ['--progress' as string]: `${progress ?? 0}%` }}>
      <header className="cause-card__head">
        <p className="cause-id">Cause #{causeId}</p>
        <h3>{cause.title}</h3>
        <p className="cause-desc">{cause.description}</p>
        <p className="cause-creator">
          by <span>{truncateAddress(cause.creator)}</span>
          {isCreator ? <em>you</em> : null}
        </p>
      </header>

      <div className="cause-stats">
        <div>
          <strong>{formatStx(cause.raised)}</strong>
          <span>STX raised</span>
        </div>
        <div>
          <strong>{cause.donors.toString()}</strong>
          <span>donors</span>
        </div>
        <div>
          <strong>{cause.goal > 0n ? formatStx(cause.goal) : 'Open'}</strong>
          <span>goal</span>
        </div>
      </div>

      {progress !== null ? (
        <div className="progress" aria-label={`${progress}% of goal`}>
          <span />
        </div>
      ) : (
        <div className="progress progress--open" aria-hidden>
          <span />
        </div>
      )}

      <form className="donate-row" onSubmit={onDonate}>
        <label className="sr-only" htmlFor={`donate-${causeId}`}>
          Donation amount in STX
        </label>
        <input
          id={`donate-${causeId}`}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="STX"
        />
        <button type="submit" className="btn-accent" disabled={!connected || donate.loading}>
          {!connected ? 'Connect' : donate.loading ? 'Confirm…' : 'Donate STX'}
        </button>
      </form>

      {connected ? (
        <p className="my-gift">
          Your gift: <strong>{formatStx(myDonation.data)} STX</strong>
        </p>
      ) : null}

      {isCreator && available > 0n ? (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => void onWithdraw()}
          disabled={withdraw.loading}
        >
          {withdraw.loading ? 'Withdrawing…' : `Withdraw ${formatStx(available)} STX`}
        </button>
      ) : null}

      {(donate.txStatus || donate.error || donate.txStatusError) && (
        <p className="tx-note" data-status={donate.txStatus ?? 'error'}>
          {donate.error?.message ||
            donate.txStatusError ||
            (donate.txStatus === 'pending' && 'Donation pending…') ||
            (donate.txStatus === 'success' && 'Donation confirmed.') ||
            donate.txStatus}
          {donate.explorerUrl ? (
            <>
              {' '}
              <a href={donate.explorerUrl} target="_blank" rel="noreferrer">
                View tx
              </a>
            </>
          ) : null}
        </p>
      )}

      {(withdraw.txStatus || withdraw.error || withdraw.txStatusError) && (
        <p className="tx-note" data-status={withdraw.txStatus ?? 'error'}>
          {withdraw.error?.message ||
            withdraw.txStatusError ||
            (withdraw.txStatus === 'pending' && 'Withdrawal pending…') ||
            (withdraw.txStatus === 'success' && 'Funds withdrawn.') ||
            withdraw.txStatus}
          {withdraw.explorerUrl ? (
            <>
              {' '}
              <a href={withdraw.explorerUrl} target="_blank" rel="noreferrer">
                View tx
              </a>
            </>
          ) : null}
        </p>
      )}
    </article>
  );
}
