/**
 * Team settings page with 5 sections, gated by user role.
 *
 * Sections:
 * 1. General -- team info editing (admin/coach edit, athlete read-only)
 * 2. Members -- member management with role changes
 * 3. Invites -- invite code CRUD (admin/coach only)
 * 4. Integrations -- C2 connection status (admin/coach only)
 * 5. Danger Zone -- leave/delete team
 *
 * Reads team data from parent layout route loader via getRouteApi.
 */
import { getRouteApi } from '@tanstack/react-router';
import { IconSettings } from '@/components/icons';
import { isAdmin, isCoachOrAbove } from '../types';
import type { TeamDetail } from '../types';
import { GeneralSection } from './settings/GeneralSection';
import { MembersSection } from './settings/MembersSection';
import { InvitesSection } from './settings/InvitesSection';
import { IntegrationsSection } from './settings/IntegrationsSection';
import { DangerZoneSection } from './settings/DangerZoneSection';

const parentRoute = getRouteApi('/_authenticated/team/$identifier');

export function TeamSettingsPage() {
  const { team } = parentRoute.useLoaderData() as { team: TeamDetail };
  const canEdit = isCoachOrAbove(team.role);
  const isOwner = isAdmin(team.role);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 pb-20 md:pb-6">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-void-deep">
          <IconSettings width={20} height={20} className="text-text-faint" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-text-bright">Team Settings</h1>
          <p className="text-sm text-text-dim">{team.name}</p>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-8">
        {/* 1. General -- always visible */}
        <section id="general">
          <SectionHeading title="General" />
          <div className="panel rounded-xl p-5">
            <GeneralSection team={team} canEdit={canEdit} />
          </div>
        </section>

        {/* 2. Members -- always visible (actions vary by role) */}
        <section id="members">
          <SectionHeading title="Members" />
          <div className="panel rounded-xl p-5">
            <MembersSection team={team} />
          </div>
        </section>

        {/* 3. Invites -- admin/coach only */}
        {canEdit && (
          <section id="invites">
            <SectionHeading title="Invites" />
            <div className="panel rounded-xl p-5">
              <InvitesSection teamId={team.id} />
            </div>
          </section>
        )}

        {/* 4. Integrations -- admin/coach only */}
        {canEdit && (
          <section id="integrations">
            <SectionHeading title="Integrations" />
            <div className="panel rounded-xl p-5">
              <IntegrationsSection />
            </div>
          </section>
        )}

        {/* 5. Danger Zone -- always visible (actions vary by role) */}
        <section id="danger-zone">
          <SectionHeading title="Danger Zone" danger />
          <div className="rounded-xl border border-data-poor/20 bg-data-poor/5 p-5">
            <DangerZoneSection team={team} isOwner={isOwner} />
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

function SectionHeading({ title, danger = false }: { title: string; danger?: boolean }) {
  return (
    <h2
      className={`mb-3 text-lg font-display font-semibold ${danger ? 'text-data-poor' : 'text-text-bright'}`}
    >
      {title}
    </h2>
  );
}
