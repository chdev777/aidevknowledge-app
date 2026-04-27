import { useState } from 'react';
import { Icon } from './Icon.js';
import { youtubeThumbnailUrl } from '../../lib/utils/url.js';

interface Props {
  videoId: string;
  thumbnailUrl?: string;
}

/**
 * YouTube facade: 初期はサムネ + 再生ボタンのみ表示し、クリックされたら
 * iframe を差し込む。複数のサムネが並ぶ画面でも初期 JS / メモリを節約できる。
 *
 * - 16:9 ratio は padding-top 56.25% で固定
 * - autoplay=1 はユーザークリック後なので各ブラウザの自動再生ポリシーを満たす
 * - rel=0 で関連動画を投稿チャンネルに限定（プライバシー）
 * - youtube-nocookie.com を使い 3rd-party cookie を発生させない
 */
export function YouTubeEmbed({ videoId, thumbnailUrl }: Props) {
  const [playing, setPlaying] = useState(false);
  const thumb = thumbnailUrl ?? youtubeThumbnailUrl(videoId);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%',
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 26,
      }}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title="YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="動画を再生"
          style={{
            position: 'absolute',
            inset: 0,
            border: 0,
            padding: 0,
            cursor: 'pointer',
            background: 'transparent',
          }}
        >
          <img
            src={thumb}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'oklch(0.22 0.01 60 / 0.7)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              transition: 'transform 120ms, background 120ms',
              boxShadow: '0 6px 24px -4px oklch(0.22 0.01 60 / 0.5)',
            }}
            className="yt-play-overlay"
          >
            <Icon name="play" size={28} />
          </span>
        </button>
      )}
    </div>
  );
}
