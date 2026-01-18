/**
 * Service for exporting lineups to PDF and CSV formats
 */

/**
 * Format time from seconds to MM:SS.s
 */
function formatTime(seconds) {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

/**
 * Export lineup to CSV format
 */
export function exportLineupToCSV(exportData) {
  const rows = [
    ['Lineup Name', exportData.name],
    ['Team', exportData.teamName],
    ['Exported', new Date().toLocaleString()],
    [],
  ];

  for (const boat of exportData.boats) {
    rows.push([`Boat: ${boat.boatClass}${boat.shellName ? ` (${boat.shellName})` : ''}`]);
    rows.push(['Seat', 'Side', 'Athlete', 'Weight (kg)', '2k Time']);

    // Add coxswain if present
    if (boat.coxswain) {
      rows.push([
        'Cox',
        '-',
        boat.coxswain.name,
        boat.coxswain.weightKg || '-',
        '-',
      ]);
    }

    // Add rowers
    for (const seat of boat.seats) {
      rows.push([
        seat.seatNumber,
        seat.side,
        seat.athlete?.name || 'Empty',
        seat.athlete?.weightKg || '-',
        seat.athlete?.latest2k ? formatTime(seat.athlete.latest2k.timeSeconds) : '-',
      ]);
    }

    rows.push([]); // Empty row between boats
  }

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${exportData.name.replace(/[^a-z0-9]/gi, '_')}_lineup.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export lineup to PDF format
 * Uses browser print dialog for simplicity
 */
export function exportLineupToPDF(exportData) {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for PDF export');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${exportData.name} - Lineup</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { font-size: 24px; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; }
        .boat { margin-bottom: 30px; page-break-inside: avoid; }
        .boat-header {
          background: #1e40af;
          color: white;
          padding: 8px 12px;
          font-weight: bold;
          border-radius: 4px 4px 0 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border: 1px solid #e5e7eb;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
        }
        .empty { color: #9ca3af; font-style: italic; }
        .cox-row { background: #fef3c7; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${exportData.name}</h1>
      <p class="subtitle">${exportData.teamName} | Exported ${new Date().toLocaleDateString()}</p>

      ${exportData.boats.map((boat) => `
        <div class="boat">
          <div class="boat-header">
            ${boat.boatClass}${boat.shellName ? ` - ${boat.shellName}` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Seat</th>
                <th>Side</th>
                <th>Athlete</th>
                <th>Weight</th>
                <th>2k</th>
              </tr>
            </thead>
            <tbody>
              ${boat.coxswain ? `
                <tr class="cox-row">
                  <td>Cox</td>
                  <td>-</td>
                  <td>${boat.coxswain.name}</td>
                  <td>${boat.coxswain.weightKg ? boat.coxswain.weightKg + ' kg' : '-'}</td>
                  <td>-</td>
                </tr>
              ` : ''}
              ${boat.seats.map((seat) => `
                <tr>
                  <td>${seat.seatNumber}</td>
                  <td>${seat.side}</td>
                  <td class="${seat.athlete ? '' : 'empty'}">${seat.athlete?.name || 'Empty'}</td>
                  <td>${seat.athlete?.weightKg ? seat.athlete.weightKg + ' kg' : '-'}</td>
                  <td>${seat.athlete?.latest2k ? formatTime(seat.athlete.latest2k.timeSeconds) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      ${exportData.notes ? `<p><strong>Notes:</strong> ${exportData.notes}</p>` : ''}

      <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Print / Save as PDF
      </button>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export current lineup state (from store) to CSV
 */
export function exportActiveLineupToCSV(activeBoats, lineupName, teamName = 'Team') {
  const boats = activeBoats.map((boat) => ({
    boatClass: boat.name,
    shellName: boat.shellName,
    coxswain: boat.coxswain,
    seats: boat.seats.map((seat) => ({
      seatNumber: seat.seatNumber,
      side: seat.side,
      athlete: seat.athlete,
    })),
  }));

  exportLineupToCSV({
    name: lineupName || 'Untitled Lineup',
    teamName,
    boats,
  });
}

/**
 * Export current lineup state (from store) to PDF
 */
export function exportActiveLineupToPDF(activeBoats, lineupName, teamName = 'Team', notes = '') {
  const boats = activeBoats.map((boat) => ({
    boatClass: boat.name,
    shellName: boat.shellName,
    coxswain: boat.coxswain,
    seats: boat.seats.map((seat) => ({
      seatNumber: seat.seatNumber,
      side: seat.side,
      athlete: seat.athlete,
    })),
  }));

  exportLineupToPDF({
    name: lineupName || 'Untitled Lineup',
    teamName,
    notes,
    boats,
  });
}
