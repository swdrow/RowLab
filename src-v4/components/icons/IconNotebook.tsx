import type { SVGProps } from 'react';

export function IconNotebook(props: SVGProps<SVGSVGElement>) {
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
      <path d="M2 6h4" />
      <path d="M2 10h4" />
      <path d="M2 14h4" />
      <path d="M2 18h4" />
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M16 2v20" />
      <path d="M12 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="m12 7.5-.5 4.5h1l-.5 4" />
    </svg>
  );
}
