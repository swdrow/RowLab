/**
 * Share card generation modal.
 * Template selector, format toggle, generation progress, and download/share actions.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX, IconDownload, IconCopy, IconShare, IconCheck, IconLoader, IconSquare, IconSmartphone } from '@/components/icons';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { scaleIn } from '@/lib/animations';
import { useGenerateShareCard } from './api';
import { CARD_TEMPLATES, type CardType, type CardFormat, type ShareCard } from './types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ShareCardModalProps {
  workoutId: string;
  workoutLabel: string;
  open: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Template card                                                       */
/* ------------------------------------------------------------------ */

function TemplateOption({
  type,
  label,
  description,
  selected,
  onSelect,
}: {
  type: CardType;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (type: CardType) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`
        w-full text-left p-3 rounded-lg transition-all duration-150 cursor-pointer
        ${selected ? 'ring-1 ring-accent bg-accent-teal/8' : 'bg-void-deep hover:bg-void-overlay'}
      `.trim()}
    >
      <span className="text-sm font-medium text-text-bright block">{label}</span>
      <span className="text-xs text-text-faint mt-0.5 block">{description}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Format toggle                                                       */
/* ------------------------------------------------------------------ */

function FormatToggle({
  format,
  onChange,
}: {
  format: CardFormat;
  onChange: (f: CardFormat) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange('1:1')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          format === '1:1'
            ? 'bg-accent-teal text-void-deep'
            : 'bg-void-deep text-text-dim hover:bg-void-overlay'
        }`}
      >
        <IconSquare width={12} height={12} />
        1:1
      </button>
      <button
        type="button"
        onClick={() => onChange('9:16')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          format === '9:16'
            ? 'bg-accent-teal text-void-deep'
            : 'bg-void-deep text-text-dim hover:bg-void-overlay'
        }`}
      >
        <IconSmartphone width={12} height={12} />
        9:16
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result actions                                                      */
/* ------------------------------------------------------------------ */

function ResultActions({ card, onClose }: { card: ShareCard; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = card.url;
    link.download = `oarbit-share-${card.cardType}.png`;
    link.click();
  }, [card]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/share/${card.id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [card.id]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'oarbit workout',
        text: 'Check out my workout on oarbit',
        url: `${window.location.origin}/share/${card.id}`,
      });
    } catch {
      // User cancelled
    }
  }, [card.id]);

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="rounded-lg overflow-hidden border border-edge-default">
        <img src={card.url} alt="Generated share card" className="w-full h-auto" />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={handleDownload} className="flex-1">
          <IconDownload width={14} height={14} />
          Download
        </Button>
        <Button variant="secondary" onClick={handleCopyLink} className="flex-1">
          {copied ? <IconCheck width={14} height={14} /> : <IconCopy width={14} height={14} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        {typeof navigator.share === 'function' && (
          <Button variant="ghost" onClick={handleNativeShare}>
            <IconShare width={14} height={14} />
          </Button>
        )}
      </div>

      <Button variant="ghost" onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ShareCardModal                                                      */
/* ------------------------------------------------------------------ */

export function ShareCardModal({ workoutId, workoutLabel, open, onClose }: ShareCardModalProps) {
  const [selectedType, setSelectedType] = useState<CardType>('erg_summary');
  const [format, setFormat] = useState<CardFormat>('1:1');
  const [showAttribution, setShowAttribution] = useState(true);

  const { mutate: generate, data: card, isPending, isError, error, reset } = useGenerateShareCard();

  const handleGenerate = useCallback(() => {
    generate({
      workoutId,
      cardType: selectedType,
      format,
      options: { showAttribution },
    });
  }, [generate, workoutId, selectedType, format, showAttribution]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <motion.div {...scaleIn} className="w-full max-w-md">
        <Card variant="elevated" padding="lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-display font-semibold text-text-bright">Share Card</h2>
              <p className="text-xs text-text-faint mt-0.5">{workoutLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-md hover:bg-void-overlay transition-colors"
              aria-label="Close"
            >
              <IconX width={16} height={16} className="text-text-faint" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {card ? (
              /* Result view */
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <ResultActions card={card} onClose={handleClose} />
              </motion.div>
            ) : (
              /* Configuration view */
              <motion.div
                key="config"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Template selector */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-text-faint font-medium block mb-2">
                    Template
                  </label>
                  <div className="space-y-1.5">
                    {CARD_TEMPLATES.map((tpl) => (
                      <TemplateOption
                        key={tpl.type}
                        type={tpl.type}
                        label={tpl.label}
                        description={tpl.description}
                        selected={selectedType === tpl.type}
                        onSelect={setSelectedType}
                      />
                    ))}
                  </div>
                </div>

                {/* Format + options row */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-text-faint font-medium block mb-1.5">
                      Format
                    </label>
                    <FormatToggle format={format} onChange={setFormat} />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAttribution}
                      onChange={(e) => setShowAttribution(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={`
                        relative w-9 h-5 rounded-full transition-colors
                        ${showAttribution ? 'bg-accent-teal' : 'bg-void-deep'}
                      `}
                    >
                      <div
                        className={`
                          absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                          transition-transform ${showAttribution ? 'translate-x-4' : ''}
                        `}
                      />
                    </div>
                    <span className="text-xs text-text-dim">oarbit branding</span>
                  </label>
                </div>

                {/* Error state */}
                {isError && (
                  <div className="px-3 py-2 rounded-lg bg-data-poor/10 text-data-poor text-sm">
                    {(error as Error)?.message || 'Failed to generate share card'}
                  </div>
                )}

                {/* Generate button */}
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <IconLoader width={14} height={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconShare width={14} height={14} />
                      Generate Share Card
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </Dialog>
  );
}
