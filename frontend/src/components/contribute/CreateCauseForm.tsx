"use client";

import { FormEvent, useState } from 'react';
import { Cl } from '@stacks/transactions';
import { useAtomValue } from 'jotai';
import { useContribute_CreateCause } from '@/generated/hooks';
import { addressAtom } from '@/store/wallet';
import { isValidPrincipal, parseStxInput } from '@/lib/stx';

type Props = {
  onCreated?: () => void;
};

export function CreateCauseForm({ onCreated }: Props) {
  const address = useAtomValue(addressAtom);
  const { call, loading, error, txStatus, explorerUrl, txStatusError } = useContribute_CreateCause();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalStx, setGoalStx] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidPrincipal(address)) return;
    if (!title.trim() || !description.trim()) return;

    const goal = goalStx.trim() === '' ? 0n : parseStxInput(goalStx);
    if (goal === null) return;

    await call([
      Cl.stringUtf8(title.trim().slice(0, 80)),
      Cl.stringUtf8(description.trim().slice(0, 280)),
      Cl.uint(goal),
    ]);
    setTitle('');
    setDescription('');
    setGoalStx('');
    onCreated?.();
  }

  const connected = isValidPrincipal(address);

  return (
    <form onSubmit={onSubmit} className="create-form">
      <div className="field">
        <label htmlFor="cause-title">Cause title</label>
        <input
          id="cause-title"
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Neighborhood shade trees"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="cause-description">What are you raising for?</label>
        <textarea
          id="cause-description"
          value={description}
          maxLength={280}
          rows={4}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short pitch anyone can rally behind."
          required
        />
      </div>

      <div className="field">
        <label htmlFor="cause-goal">Goal in STX <span>(optional)</span></label>
        <input
          id="cause-goal"
          inputMode="decimal"
          value={goalStx}
          onChange={(e) => setGoalStx(e.target.value)}
          placeholder="0 for open-ended"
        />
      </div>

      <button type="submit" className="btn-primary" disabled={!connected || loading}>
        {!connected ? 'Connect wallet to create' : loading ? 'Opening wallet…' : 'Launch cause'}
      </button>

      {(txStatus || error || txStatusError) && (
        <p className="tx-note" data-status={txStatus ?? (error ? 'error' : undefined)}>
          {error?.message ||
            txStatusError ||
            (txStatus === 'pending' && 'Waiting for confirmation…') ||
            (txStatus === 'success' && 'Cause created on Stacks testnet.') ||
            txStatus}
          {explorerUrl ? (
            <>
              {' '}
              <a href={explorerUrl} target="_blank" rel="noreferrer">
                View tx
              </a>
            </>
          ) : null}
        </p>
      )}
    </form>
  );
}
