import React from 'react';

type MaxWidthOption = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: MaxWidthOption;
  padding?: boolean;
  className?: string;
}

const maxWidthClasses: Record<MaxWidthOption, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'w-full',
};

export function PageContainer({
  children,
  maxWidth = 'xl',
  padding = true,
  className = '',
}: PageContainerProps) {
  const widthClass = maxWidthClasses[maxWidth];
  const paddingClass = padding ? 'px-4 md:px-6 lg:px-8' : '';

  return (
    <div
      className={`
        mx-auto
        ${widthClass}
        ${paddingClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}

export default PageContainer;
