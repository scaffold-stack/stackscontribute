"use client";

import { useCallback, useEffect, useState } from 'react';
import { Cl } from '@stacks/transactions';
import { contribute_getCause, contribute_getCauseCount } from '@/generated/contracts';
import deployments from '@/generated/deployments.json';
import { scaffoldConfig } from '@/scaffold.config';
import { CauseRecord, clarityUintToBigInt, parseCause } from '@/lib/stx';
import { CauseCard } from './CauseCard';
import { CreateCauseForm } from './CreateCauseForm';

const CONTRACT = 'contribute';

type ListedCause = { id: number; cause: CauseRecord };

export function CauseBoard() {
  const [causes, setCauses] = useState<ListedCause[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const contractId = deployments?.contracts?.[CONTRACT]?.contract_id as string | undefined;
  const isDeployed = Boolean(contractId);

  const refresh = useCallback(async () => {
    if (!isDeployed) return;
    setLoadingList(true);
    setListError(null);
    try {
      const countResult = await contribute_getCauseCount([]);
      const count = clarityUintToBigInt(countResult);
      if (count === null) {
        setCauses([]);
        return;
      }

      const total = Number(count);
      const next: ListedCause[] = [];
      for (let id = total - 1; id >= 0; id -= 1) {
        const raw = await contribute_getCause([Cl.uint(id)]);
        const cause = parseCause(raw);
        if (cause) next.push({ id, cause });
      }
      setCauses(next);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not load causes');
    } finally {
      setLoadingList(false);
    }
  }, [isDeployed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!isDeployed) {
    return (
      <p className="board-empty">
        Contract not deployed yet. Run{' '}
        <code>stacksdapp deploy --network testnet --yes</code>
      </p>
    );
  }

  return (
    <div className="board">
      <section className="board-create" id="create">
        <div className="section-copy">
          <p className="eyebrow">Open to anyone</p>
          <h2>Start a cause</h2>
          <p>No allowlist. Publish a pitch, set an optional goal, and accept STX from the network.</p>
        </div>
        <CreateCauseForm
          onCreated={() => {
            window.setTimeout(() => void refresh(), 4000);
          }}
        />
      </section>

      <section className="board-list" id="causes">
        <div className="section-copy section-copy--row">
          <div>
            <p className="eyebrow">Live on {scaffoldConfig.network}</p>
            <h2>Open causes</h2>
            <p>Donate to any cause — including ones you created. Creators can withdraw raised STX anytime.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => void refresh()} disabled={loadingList}>
            {loadingList ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {listError ? <p className="board-empty">{listError}</p> : null}

        {!loadingList && causes.length === 0 ? (
          <p className="board-empty">No causes yet. Be the first to launch one.</p>
        ) : null}

        <div className="cause-grid">
          {causes.map(({ id, cause }) => (
            <CauseCard
              key={id}
              causeId={id}
              cause={cause}
              onChanged={() => {
                window.setTimeout(() => void refresh(), 4000);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
