'use client';

import Avatar from '@mui/material/Avatar';

interface UserAvatarProps {
  name: string | undefined;
  size?: number;
}

// Initials-avatar idiom shared across the app — was inline in HeaderActions
// only, extracted here once the Company Owner card needed the same thing.
export default function UserAvatar({ name, size = 28 }: UserAvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <Avatar sx={{ width: size, height: size, fontSize: size <= 28 ? '0.75rem' : '0.9rem', bgcolor: 'text.primary', color: 'background.default' }}>
      {initials}
    </Avatar>
  );
}
