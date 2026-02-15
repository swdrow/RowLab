import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeHtmlAttr } from '../utils/htmlEscape.js';

describe('htmlEscape', () => {
  describe('escapeHtml', () => {
    it('should escape basic HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than and greater than', () => {
      expect(escapeHtml('5 < 10 > 3')).toBe('5 &lt; 10 &gt; 3');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('She said "hello"')).toBe('She said &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("It's nice")).toBe('It&#x27;s nice');
    });

    it('should escape forward slash', () => {
      expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
    });

    it('should handle null and undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(escapeHtml(42)).toBe('42');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should escape malicious athlete name with XSS attempt', () => {
      const maliciousName = 'John<script>alert(1)</script>Doe';
      expect(escapeHtml(maliciousName)).toBe(
        'John&lt;script&gt;alert(1)&lt;&#x2F;script&gt;Doe'
      );
    });

    it('should escape event handler injection attempts', () => {
      const maliciousName = 'Bob" onload="alert(1)';
      expect(escapeHtml(maliciousName)).toBe('Bob&quot; onload=&quot;alert(1)');
    });

    it('should escape complex XSS vectors', () => {
      const xssVector = '<img src=x onerror=alert(1)>';
      expect(escapeHtml(xssVector)).toBe(
        '&lt;img src=x onerror=alert(1)&gt;'
      );
    });
  });

  describe('escapeHtmlAttr', () => {
    it('should escape all HTML special characters', () => {
      expect(escapeHtmlAttr('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape equals sign for attribute context', () => {
      expect(escapeHtmlAttr('key=value')).toBe('key&#x3D;value');
    });

    it('should escape backticks for attribute context', () => {
      expect(escapeHtmlAttr('hello`world')).toBe('hello&#x60;world');
    });

    it('should handle null and undefined', () => {
      expect(escapeHtmlAttr(null)).toBe('');
      expect(escapeHtmlAttr(undefined)).toBe('');
    });

    it('should escape attribute injection attempts', () => {
      const maliciousAttr = '" onload="alert(1)" x="';
      expect(escapeHtmlAttr(maliciousAttr)).toBe(
        '&quot; onload&#x3D;&quot;alert(1)&quot; x&#x3D;&quot;'
      );
    });
  });
});
