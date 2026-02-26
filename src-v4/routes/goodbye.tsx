/**
 * Post-account-deletion goodbye page.
 * Public route (no auth required -- user is logged out by this point).
 * Shows deactivation confirmation, 30-day recovery window, and login link.
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconMail } from '@/components/icons';

export const Route = createFileRoute('/goodbye')({
  component: GoodbyePage,
});

function GoodbyePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void-deep px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-text-bright">oarbit</h1>
        </div>

        {/* Main card */}
        <Card className="text-center space-y-5 p-6">
          <h2 className="text-xl font-display font-semibold text-text-bright">
            Your account has been deactivated
          </h2>

          <p className="text-sm text-text-dim leading-relaxed">
            Your account and data have been scheduled for deletion. You have{' '}
            <span className="font-medium text-text-bright">30 days</span> to recover your account by
            logging in or contacting support.
          </p>

          {/* Recovery info callout */}
          <div className="rounded-lg bg-accent-sand/10 border border-accent-sand/20 p-4 text-left">
            <div className="flex items-start gap-3">
              <IconMail className="w-4 h-4 text-accent-sand mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-accent-sand">Recovery window</p>
                <p className="text-xs text-text-dim leading-relaxed">
                  Email{' '}
                  <a href="mailto:support@oarbit.app" className="text-accent-teal hover:underline">
                    support@oarbit.app
                  </a>{' '}
                  to recover your account within the 30-day window. After this period, all data will
                  be permanently removed.
                </p>
              </div>
            </div>
          </div>

          {/* Return to login */}
          <Link to="/login">
            <Button variant="secondary" size="md" className="w-full">
              Return to Login
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
