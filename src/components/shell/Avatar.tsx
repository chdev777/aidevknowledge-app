import type { User } from '../../types/user.js';

interface Props {
  user: Pick<User, 'name' | 'color'>;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ user, size = 'sm' }: Props) {
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.charAt(0))
    .join('')
    .slice(0, 2);
  return (
    <span
      className={`avatar ${size}`}
      style={{
        background: `${user.color}22`,
        color: user.color,
        borderColor: `${user.color}44`,
      }}
      title={user.name}
    >
      {initials}
    </span>
  );
}
