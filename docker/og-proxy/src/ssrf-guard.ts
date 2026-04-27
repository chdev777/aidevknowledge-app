/**
 * SSRF対策：プライベートIPアドレスとメタデータエンドポイントを拒否する
 */
export function isPrivateIp(address: string): boolean {
  // IPv4 ローカル
  if (
    address.startsWith('10.') ||
    address.startsWith('127.') ||
    address.startsWith('169.254.') || // クラウドメタデータ
    address.startsWith('192.168.')
  ) {
    return true;
  }

  // 172.16.0.0/12
  if (address.startsWith('172.')) {
    const parts = address.split('.');
    const second = parts[1] ? Number(parts[1]) : 0;
    if (second >= 16 && second <= 31) return true;
  }

  // IPv6 ローカル
  if (
    address === '::1' ||
    address.startsWith('fc') ||
    address.startsWith('fd') ||
    address.startsWith('fe80:')
  ) {
    return true;
  }

  return false;
}
