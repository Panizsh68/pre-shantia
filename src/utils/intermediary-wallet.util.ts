export function getIntermediaryWalletId(): string {
  const id = (process.env.INTERMEDIARY_WALLET_ID || process.env.INTERMEDIARY_ID || '').trim();
  return id.length > 0 ? id : 'INTERMEDIARY_ID';
}
