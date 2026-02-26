import type { SVGProps } from 'react';

export function IconArrowLeftRight(props: SVGProps<SVGSVGElement>) {
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
      <polyline points="8 3 4 7 8 11" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <polyline points="16 21 20 17 16 13" />
      <line x1="20" y1="17" x2="4" y2="17" />
    </svg>
  );
}
