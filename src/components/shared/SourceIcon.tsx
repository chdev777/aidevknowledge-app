import { Icon, type IconName } from './Icon.js';
import type { SourceType } from '../../types/link.js';

interface Props {
  sourceType: SourceType;
  domain: string;
  size?: number;
}

interface Mapping {
  icon: IconName;
  /** ブランドカラー（任意）。指定するとアイコン自体に inline color、
   *  link-thumb の背景にも CSS 変数で利用される data-source 属性と組み合わせる */
  color?: string;
}

/** ドメインごとの個別ブランド */
function fromDomain(domain: string): Mapping | null {
  const d = domain.toLowerCase();
  if (d.endsWith('qiita.com')) return { icon: 'qiita', color: '#55C500' };
  if (d.endsWith('zenn.dev')) return { icon: 'zenn', color: '#3EA8FF' };
  return null;
}

/** sourceType ごとの既定ブランド */
function fromSource(sourceType: SourceType): Mapping {
  switch (sourceType) {
    case 'YouTube':
      return { icon: 'youtube', color: '#FF0033' };
    case 'GitHub':
      return { icon: 'github', color: '#181717' };
    case 'X':
      return { icon: 'x', color: '#000000' };
    case '公式Docs':
      return { icon: 'book' };
    case '記事':
      return { icon: 'doc' };
    case 'Web':
    default:
      return { icon: 'globe' };
  }
}

/**
 * link-thumb の中身。sourceType + domain から適切なブランド SVG を返す。
 * ドメイン優先（記事/Web でも qiita/zenn なら専用ロゴ）。
 */
export function SourceIcon({ sourceType, domain, size = 22 }: Props) {
  const mapping = fromDomain(domain) ?? fromSource(sourceType);
  return (
    <Icon
      name={mapping.icon}
      size={size}
      style={mapping.color ? { color: mapping.color } : undefined}
    />
  );
}

/** 親要素の data-source 属性に使う識別子（CSS 側でブランドカラー背景に使用） */
export function sourceKey(sourceType: SourceType, domain: string): string {
  const fromDom = fromDomain(domain);
  if (fromDom) return fromDom.icon;
  return fromSource(sourceType).icon;
}
