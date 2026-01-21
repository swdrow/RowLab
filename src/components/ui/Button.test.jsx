import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('variants', () => {
    it('applies primary variant styles by default', () => {
      render(<Button data-testid="btn">Primary</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn.className).toContain('from-blade-blue');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary" data-testid="btn">Secondary</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('bg-white/[0.04]');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost" data-testid="btn">Ghost</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('bg-transparent');
    });

    it('applies danger variant styles', () => {
      render(<Button variant="danger" data-testid="btn">Danger</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn.className).toContain('from-danger-red');
    });

    it('applies success variant styles', () => {
      render(<Button variant="success" data-testid="btn">Success</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn.className).toContain('from-success');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline" data-testid="btn">Outline</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('text-blade-blue');
    });

    it('applies icon variant styles', () => {
      render(<Button variant="icon" data-testid="btn">Icon</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('w-10', 'h-10');
    });
  });

  describe('sizes', () => {
    it('applies sm size', () => {
      render(<Button size="sm" data-testid="btn">Small</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('px-4', 'py-2');
    });

    it('applies md size by default', () => {
      render(<Button data-testid="btn">Medium</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('px-6', 'py-3');
    });

    it('applies lg size', () => {
      render(<Button size="lg" data-testid="btn">Large</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('px-8', 'py-4');
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not trigger click when disabled', () => {
      const onClick = vi.fn();
      render(<Button disabled onClick={onClick}>Disabled</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('applies disabled styles', () => {
      render(<Button disabled data-testid="btn">Disabled</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('disabled:opacity-40');
    });
  });

  describe('loading state', () => {
    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
      render(<Button loading data-testid="btn">Loading</Button>);
      const btn = screen.getByTestId('btn');
      const spinner = btn.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('sets aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('applies cursor-wait when loading', () => {
      render(<Button loading data-testid="btn">Loading</Button>);
      expect(screen.getByTestId('btn')).toHaveClass('cursor-wait');
    });
  });

  describe('custom className', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class" data-testid="btn">Custom</Button>);
      expect(screen.getByTestId('btn')).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(<Button className="mt-4" data-testid="btn">Custom</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn).toHaveClass('mt-4');
      expect(btn).toHaveClass('rounded-xl');
    });
  });

  describe('forwarded ref', () => {
    it('forwards ref to button element', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('accessibility', () => {
    it('has focus ring styles', () => {
      render(<Button data-testid="btn">Accessible</Button>);
      const btn = screen.getByTestId('btn');
      expect(btn.className).toContain('focus:ring-2');
    });

    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('children', () => {
    it('renders text children', () => {
      render(<Button>Text</Button>);
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('renders element children', () => {
      render(
        <Button>
          <span data-testid="child">Icon</span>
        </Button>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });
});
