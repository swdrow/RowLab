import type { BoatInstance } from '@v2/types/lineup';

/**
 * PrintableLineup - Print-optimized lineup view for PDF capture
 *
 * Designed for high-contrast, large-font printing at dock or boathouse.
 * Uses black text on white background for ink-friendliness.
 * Fixed width (8.5" x 11" portrait) for consistent PDF capture.
 *
 * Features:
 * - Large, readable fonts (14-24pt)
 * - High contrast black/white design
 * - Clear borders and spacing
 * - Boat header with class and shell name
 * - Vertical seat list (bow at top, stroke at bottom)
 * - Empty seats show "---"
 * - Coxswain shown separately at bottom
 *
 * Per LINE-11: "export lineup as print-ready PDF (high-contrast, large font)"
 */

export interface PrintableLineupProps {
  boats: BoatInstance[];
  lineupName: string;
  date?: string;
  teamName?: string;
}

export function PrintableLineup({
  boats,
  lineupName,
  date = new Date().toLocaleDateString(),
  teamName,
}: PrintableLineupProps) {
  return (
    <div
      className="printable-lineup"
      style={{
        width: '8.5in',
        minHeight: '11in',
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: '0.5in',
        fontFamily: 'Arial, sans-serif',
        position: 'absolute',
        left: '-9999px',
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px', borderBottom: '2px solid #000000', paddingBottom: '16px' }}>
        <h1
          style={{
            fontSize: '24pt',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#000000',
          }}
        >
          {lineupName}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {teamName && (
            <div style={{ fontSize: '14pt', color: '#000000' }}>
              {teamName}
            </div>
          )}
          <div style={{ fontSize: '14pt', color: '#000000', marginLeft: 'auto' }}>
            {date}
          </div>
        </div>
      </div>

      {/* Boats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {boats.map((boat) => {
          // Reverse seats to show bow at top
          const seatsTopToBottom = [...boat.seats].reverse();

          return (
            <div
              key={boat.id}
              style={{
                border: '2px solid #000000',
                padding: '16px',
                pageBreakInside: 'avoid',
              }}
            >
              {/* Boat Header */}
              <div
                style={{
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #000000',
                }}
              >
                <div style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '4px' }}>
                  {boat.name}
                </div>
                {boat.shellName && (
                  <div style={{ fontSize: '14pt', color: '#333333' }}>
                    Shell: {boat.shellName}
                  </div>
                )}
              </div>

              {/* Bow Label */}
              <div
                style={{
                  fontSize: '12pt',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  letterSpacing: '1px',
                }}
              >
                Bow
              </div>

              {/* Seats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {seatsTopToBottom.map((seat) => (
                  <div
                    key={`${boat.id}-seat-${seat.seatNumber}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid #000000',
                      backgroundColor: seat.athlete ? '#ffffff' : '#f5f5f5',
                    }}
                  >
                    {/* Seat Number */}
                    <div
                      style={{
                        fontSize: '14pt',
                        fontWeight: 'bold',
                        width: '40px',
                        flexShrink: 0,
                      }}
                    >
                      {seat.seatNumber}
                    </div>

                    {/* Side */}
                    <div
                      style={{
                        fontSize: '14pt',
                        width: '80px',
                        flexShrink: 0,
                        fontWeight: 'bold',
                      }}
                    >
                      {seat.side.charAt(0)}
                    </div>

                    {/* Athlete Name */}
                    <div style={{ fontSize: '16pt', fontWeight: seat.athlete ? 'normal' : 'normal' }}>
                      {seat.athlete
                        ? `${seat.athlete.lastName}, ${seat.athlete.firstName}`
                        : '---'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stroke Label */}
              <div
                style={{
                  fontSize: '12pt',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  marginTop: '8px',
                  marginBottom: '8px',
                  letterSpacing: '1px',
                }}
              >
                Stroke
              </div>

              {/* Coxswain */}
              {boat.hasCoxswain && (
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #000000',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '2px solid #000000',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14pt',
                        fontWeight: 'bold',
                        width: '120px',
                        flexShrink: 0,
                      }}
                    >
                      Coxswain
                    </div>
                    <div style={{ fontSize: '16pt' }}>
                      {boat.coxswain
                        ? `${boat.coxswain.lastName}, ${boat.coxswain.firstName}`
                        : '---'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '40px',
          paddingTop: '16px',
          borderTop: '1px solid #000000',
          fontSize: '10pt',
          color: '#666666',
          textAlign: 'center',
        }}
      >
        Generated on {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default PrintableLineup;
