import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeHtmlAttr } from '../utils/htmlEscape.js';

describe('Share Cards XSS Protection - Route Logic', () => {
  describe('Athlete name escaping scenarios', () => {
    it('should escape XSS attempt in athlete name for HTML context', () => {
      const maliciousFirstName = 'Evil<script>alert("XSS")</script>';
      const maliciousLastName = 'Hacker">><img src=x onerror=alert(1)>';
      
      const escapedName = escapeHtml(`${maliciousFirstName} ${maliciousLastName}`);
      
      // Verify script tags are escaped
      expect(escapedName).not.toContain('<script>');
      expect(escapedName).toContain('&lt;script&gt;');
      expect(escapedName).toContain('&lt;&#x2F;script&gt;');
      
      // Verify img tags are escaped
      expect(escapedName).not.toContain('<img');
      expect(escapedName).toContain('&lt;img');
      
      // The important thing is that < and > are escaped, making it non-executable
      expect(escapedName).toContain('&lt;');
      expect(escapedName).toContain('&gt;');
    });

    it('should escape XSS attempt in athlete name for attribute context', () => {
      const maliciousName = 'Bob" onload="alert(1)';
      const escapedForAttr = escapeHtmlAttr(maliciousName);
      
      // Quotes should be escaped
      expect(escapedForAttr).toContain('&quot;');
      expect(escapedForAttr).not.toContain('" onload="');
    });
  });

  describe('Team name escaping scenarios', () => {
    it('should escape malicious team name', () => {
      const maliciousTeamName = 'Evil Team<script>alert(2)</script>';
      const escaped = escapeHtml(maliciousTeamName);
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });

  describe('Side field escaping scenarios', () => {
    it('should escape event handler injection in side field', () => {
      const maliciousSide = 'Port" onload="alert(1)';
      const escaped = escapeHtml(maliciousSide);
      
      expect(escaped).toContain('&quot;');
      expect(escaped).not.toContain('onload="alert(1)');
    });
  });

  describe('Meta tag content escaping', () => {
    it('should properly escape description for meta tag attributes', () => {
      const athleteName = 'John<script>alert(1)</script>Doe';
      const teamName = 'Evil Team">><img src=x>';
      const side = 'Port';
      
      // Build description from raw values (correct approach - no double-escaping)
      const rawDescription = `${athleteName} - ${side} side rower from ${teamName}`;
      const metaContent = escapeHtmlAttr(rawDescription);
      
      // Verify no executable content in meta attribute
      expect(metaContent).not.toContain('<script>');
      expect(metaContent).not.toContain('<img');
      // Single-escaped (correct behavior)
      expect(metaContent).toContain('&lt;');
      expect(metaContent).toContain('&gt;');
      expect(metaContent).not.toContain('&amp;lt;'); // No double-escaping
    });
  });

  describe('Complete share card HTML generation simulation', () => {
    it('should generate safe HTML with all user fields escaped', () => {
      // Simulate malicious user data
      const athlete = {
        firstName: 'Evil<script>alert("XSS")</script>',
        lastName: 'Hacker">><img src=x onerror=alert(1)>',
        side: 'Port" onload="alert(1)',
        weight: 80,
        team: {
          name: 'Malicious Team<script>alert(2)</script>',
        },
      };

      // Escape for HTML content (body text)
      const athleteName = escapeHtml(`${athlete.firstName} ${athlete.lastName}`);
      const teamName = escapeHtml(athlete.team.name);
      const side = escapeHtml(athlete.side);
      const weight = escapeHtml(`${athlete.weight}kg`);
      
      // Build description from raw values for attribute context (no double-escaping)
      const rawDescription = `${athlete.firstName} ${athlete.lastName} - ${athlete.side} side rower${athlete.weight ? `, ${athlete.weight}kg` : ''} from ${athlete.team.name}`;
      const descriptionForAttr = escapeHtmlAttr(rawDescription);

      // Generate HTML (simplified version of actual route)
      const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${athleteName}</title>
    <meta property="og:title" content="${athleteName}" />
    <meta property="og:description" content="${descriptionForAttr}" />
  </head>
  <body>
    <h1>${athleteName}</h1>
    <div>${teamName}</div>
    <div>${side}</div>
  </body>
</html>
      `;

      // Verify no executable scripts in the generated HTML
      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).not.toContain('onload="alert(1)');
      expect(html).not.toContain('<script>alert(2)</script>');
      
      // Verify escaped versions are present
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;&#x2F;script&gt;');
      expect(html).toContain('&lt;img');
      expect(html).toContain('&quot;');
    });
  });
});
