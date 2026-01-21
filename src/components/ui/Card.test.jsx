import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies glass variant by default', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-white/[0.02]');
  });

  it('applies elevated variant', () => {
    render(<Card variant="elevated" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-white/[0.03]');
  });

  it('applies solid variant', () => {
    render(<Card variant="solid" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-void-elevated');
  });

  it('applies inset variant', () => {
    render(<Card variant="inset" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-void-surface');
  });

  it('applies ghost variant', () => {
    render(<Card variant="ghost" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-transparent');
  });

  it('applies padding variants', () => {
    const { rerender } = render(<Card padding="sm" data-testid="card">Content</Card>);
    // Padding is applied to the inner content wrapper div that contains the children
    // Find the card and look for the content wrapper with padding
    const card = screen.getByTestId('card');
    const contentWrapper = card.querySelector('.relative.z-10');
    expect(contentWrapper).toHaveClass('p-4');

    rerender(<Card padding="md" data-testid="card">Content</Card>);
    const card2 = screen.getByTestId('card');
    const contentWrapper2 = card2.querySelector('.relative.z-10');
    expect(contentWrapper2).toHaveClass('p-6');

    rerender(<Card padding="lg" data-testid="card">Content</Card>);
    const card3 = screen.getByTestId('card');
    const contentWrapper3 = card3.querySelector('.relative.z-10');
    expect(contentWrapper3).toHaveClass('p-8');

    rerender(<Card padding="none" data-testid="card">Content</Card>);
    const card4 = screen.getByTestId('card');
    const contentWrapper4 = card4.querySelector('.relative.z-10');
    expect(contentWrapper4).not.toHaveClass('p-4');
    expect(contentWrapper4).not.toHaveClass('p-6');
    expect(contentWrapper4).not.toHaveClass('p-8');
  });

  it('applies interactive styles when interactive prop is true', () => {
    render(<Card interactive data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('accepts custom className', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('renders noise texture overlay', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    const noiseOverlay = card.querySelector('[class*="bg-\\[url"]');
    expect(noiseOverlay).toBeInTheDocument();
  });

  it('has hover highlight effect', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    const highlight = card.querySelector('.absolute.inset-x-0.top-0.h-px');
    expect(highlight).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('flex', 'flex-col', 'pb-4');
  });

  it('accepts custom className', () => {
    render(<CardHeader className="custom" data-testid="header">Header</CardHeader>);
    expect(screen.getByTestId('header')).toHaveClass('custom');
  });
});

describe('CardTitle', () => {
  it('renders as h3', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('applies typography styles', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId('title');
    expect(title).toHaveClass('font-display', 'text-xl', 'font-semibold');
  });
});

describe('CardDescription', () => {
  it('renders description text', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies secondary text color', () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);
    expect(screen.getByTestId('desc')).toHaveClass('text-text-secondary');
  });
});

describe('CardContent', () => {
  it('renders content', () => {
    render(<CardContent>Card body content</CardContent>);
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<CardContent className="mt-4" data-testid="content">Content</CardContent>);
    expect(screen.getByTestId('content')).toHaveClass('mt-4');
  });
});

describe('CardFooter', () => {
  it('renders footer content', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies flex styles', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('flex', 'items-center', 'pt-4');
  });
});

describe('Card composition', () => {
  it('renders full card with all subcomponents', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
