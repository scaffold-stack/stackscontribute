import deployments from '@/generated/deployments.json';

export default function Footer() {
  const contractId = deployments?.contracts?.contribute?.contract_id as string | undefined;
  const txId = deployments?.contracts?.contribute?.tx_id as string | undefined;

  return (
    <footer className="site-footer">
      <p>Open causes. Open donations. Built on Stacks.</p>
      {contractId ? (
        <a
          href={
            txId
              ? `https://explorer.hiro.so/txid/${txId}?chain=testnet`
              : `https://explorer.hiro.so/address/${contractId}?chain=testnet`
          }
          target="_blank"
          rel="noreferrer"
        >
          {contractId}
        </a>
      ) : (
        <span>Contract pending deploy</span>
      )}
    </footer>
  );
}
