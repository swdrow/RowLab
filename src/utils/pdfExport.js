import jsPDF from 'jspdf';

/**
 * Convert time string (mm:ss.t) to seconds for sorting
 */
function timeToSeconds(timeStr) {
  if (!timeStr) return Infinity;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(timeStr) || Infinity;
}

/**
 * Export lineup to PDF
 * @param {Object} options - Export options
 * @param {string} options.lineupName - Name of the lineup
 * @param {Array} options.boats - Array of boat objects with seats
 * @param {string} options.layout - 'compact' or 'detailed'
 */
export async function exportLineupToPDF({ lineupName, boats, layout = 'compact' }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(lineupName || 'Lineup', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Summary
  const totalAthletes = boats.reduce((sum, boat) => {
    const seatCount = boat.seats.filter(s => s.athlete).length;
    const coxCount = boat.coxswain ? 1 : 0;
    return sum + seatCount + coxCount;
  }, 0);

  doc.setFontSize(11);
  doc.text(`${boats.length} boat${boats.length !== 1 ? 's' : ''} | ${totalAthletes} athlete${totalAthletes !== 1 ? 's' : ''}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Boats
  for (let i = 0; i < boats.length; i++) {
    const boat = boats[i];

    // Check if we need a new page
    const estimatedHeight = layout === 'detailed' ? 80 : 50;
    if (yPos + estimatedHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    // Boat header
    doc.setFillColor(59, 130, 246); // blue-600
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(boat.name + (boat.shellName ? ` - ${boat.shellName}` : ''), margin + 3, yPos + 5.5);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    if (layout === 'detailed') {
      // Detailed layout - one seat per line with full info
      doc.setFontSize(10);

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
      doc.text('Seat', margin + 3, yPos + 4);
      doc.text('Athlete', margin + 25, yPos + 4);
      doc.text('Side', margin + 90, yPos + 4);
      doc.text('Country', margin + 115, yPos + 4);
      yPos += 7;

      doc.setFont('helvetica', 'normal');

      // Coxswain first if exists
      if (boat.hasCoxswain) {
        doc.text('Cox', margin + 3, yPos + 4);
        if (boat.coxswain) {
          doc.text(`${boat.coxswain.lastName}, ${boat.coxswain.firstName}`, margin + 25, yPos + 4);
          doc.text(boat.coxswain.country || '', margin + 115, yPos + 4);
        } else {
          doc.setTextColor(150, 150, 150);
          doc.text('Empty', margin + 25, yPos + 4);
          doc.setTextColor(0, 0, 0);
        }
        yPos += 6;
      }

      // Seats (stroke to bow)
      const sortedSeats = [...boat.seats].sort((a, b) => b.seatNumber - a.seatNumber);
      for (const seat of sortedSeats) {
        const seatLabel = seat.seatNumber === boat.numSeats ? 'Stroke' :
                          seat.seatNumber === 1 ? 'Bow' :
                          seat.seatNumber.toString();
        doc.text(seatLabel, margin + 3, yPos + 4);

        if (seat.athlete) {
          doc.text(`${seat.athlete.lastName}, ${seat.athlete.firstName}`, margin + 25, yPos + 4);
          doc.text(seat.side || '', margin + 90, yPos + 4);
          doc.text(seat.athlete.country || '', margin + 115, yPos + 4);
        } else {
          doc.setTextColor(150, 150, 150);
          doc.text('Empty', margin + 25, yPos + 4);
          doc.setTextColor(0, 0, 0);
        }
        yPos += 6;
      }
    } else {
      // Compact layout - athletes in columns
      doc.setFontSize(9);
      const assignedAthletes = boat.seats
        .filter(s => s.athlete)
        .sort((a, b) => b.seatNumber - a.seatNumber)
        .map(s => ({
          seat: s.seatNumber === boat.numSeats ? 'S' : s.seatNumber === 1 ? 'B' : s.seatNumber,
          name: `${s.athlete.lastName}, ${s.athlete.firstName?.charAt(0) || ''}.`,
          side: s.side?.[0] || ''
        }));

      if (boat.coxswain) {
        assignedAthletes.unshift({
          seat: 'C',
          name: `${boat.coxswain.lastName}, ${boat.coxswain.firstName?.charAt(0) || ''}.`,
          side: ''
        });
      }

      const colWidth = (pageWidth - margin * 2) / 4;
      assignedAthletes.forEach((a, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const x = margin + col * colWidth + 2;
        const y = yPos + row * 5 + 4;

        doc.setFont('helvetica', 'bold');
        doc.text(`${a.seat}:`, x, y);
        doc.setFont('helvetica', 'normal');
        doc.text(a.name, x + 7, y);
      });

      yPos += Math.ceil(assignedAthletes.length / 4) * 5 + 5;
    }

    yPos += 8;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by RowLab', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save
  const fileName = `${(lineupName || 'lineup').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return fileName;
}

/**
 * Export erg data to PDF
 */
export async function exportErgDataToPDF({ athlete, tests }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Erg Data: ${athlete.firstName} ${athlete.lastName}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  if (tests.length === 0) {
    doc.text('No erg tests recorded.', pageWidth / 2, yPos, { align: 'center' });
  } else {
    // Group tests by type
    const byType = {};
    tests.forEach(t => {
      if (!byType[t.testType]) byType[t.testType] = [];
      byType[t.testType].push(t);
    });

    for (const [type, typeTests] of Object.entries(byType)) {
      // Type header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(type, margin, yPos);
      yPos += 8;

      // Table header
      doc.setFontSize(9);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
      doc.text('Date', margin + 3, yPos + 4);
      doc.text('Result', margin + 35, yPos + 4);
      doc.text('Split', margin + 60, yPos + 4);
      doc.text('Rate', margin + 85, yPos + 4);
      doc.text('Watts', margin + 105, yPos + 4);
      doc.text('Notes', margin + 125, yPos + 4);
      yPos += 7;

      doc.setFont('helvetica', 'normal');

      // Sort by date descending
      typeTests.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));

      for (const test of typeTests) {
        const date = new Date(test.testDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
        doc.text(date, margin + 3, yPos + 4);
        doc.text(test.result || '', margin + 35, yPos + 4);
        doc.text(test.split || '', margin + 60, yPos + 4);
        doc.text(test.strokeRate?.toString() || '', margin + 85, yPos + 4);
        doc.text(test.watts?.toString() || '', margin + 105, yPos + 4);
        doc.text((test.notes || '').substring(0, 20), margin + 125, yPos + 4);
        yPos += 5;
      }

      yPos += 10;
    }
  }

  // Save
  const fileName = `erg-data-${athlete.lastName}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return fileName;
}
