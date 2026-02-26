import type { SVGProps } from 'react';

export function IconCable(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 9a2 2 0 0 1-2-2V5h6v2a2 2 0 0 1-2 2H4z" />
      <path d="M3 5V3" />
      <path d="M7 5V3" />
      <path d="M19 15a2 2 0 0 0 2-2v-2h-6v2a2 2 0 0 0 2 2h2z" />
      <path d="M17 17v2" />
      <path d="M21 17v2" />
      <path d="M5 9v4a4 4 0 0 0 4 4h2" />
      <path d="M19 15v-4a4 4 0 0 0-4-4h-2" />
    </svg>
  );
}
