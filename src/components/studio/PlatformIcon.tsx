'use client';

import type { DeliveryPlatform } from '@/lib/delivery';

const sizeMap = { sm: 11, md: 14, lg: 18 } as const;

export function PlatformIcon({
  platform,
  size = 'md',
}: {
  platform: DeliveryPlatform;
  size?: keyof typeof sizeMap;
}) {
  const s = sizeMap[size];
  const props = { width: s, height: s, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': true as const };

  switch (platform) {
    case 'gmail':
      return (
        <svg {...props}>
          <rect x="1.5" y="3" width="11" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1.5 5.5L7 9l5.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'notion':
      return (
        <svg {...props}>
          <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 5h4M5 7.5h4M5 10h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'zapier':
      return (
        <svg {...props}>
          <path
            d="M7 2l1.2 3.6H12L8.8 7.4l1.2 3.6L7 10.8 4 11l1.2-3.6L2 5.6h3.8L7 2z"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'slack':
      return (
        <svg {...props}>
          <path
            d="M5.5 2.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM5.5 5.5v3M8.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM8.5 8.5v-3M2 8.5h3M9 5.5h3"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...props}>
          <circle cx="7" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
