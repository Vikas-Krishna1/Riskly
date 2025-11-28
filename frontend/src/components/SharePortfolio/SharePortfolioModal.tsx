import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import { PortfolioShare } from '../PortfolioForm/types';
import './SharePortfolioModal.css';

interface SharePortfolioModalProps {
  portfolioId: string;
  isPublic: boolean;
  shareToken?: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function SharePortfolioModal({
  portfolioId,
  isPublic,
  shareToken,
  onClose,
  onUpdate
}: SharePortfolioModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState<PortfolioShare | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPublicState, setIsPublicState] = useState(isPublic);

  useEffect(() => {
    if (shareToken) {
      const shareUrl = `${window.location.origin}/portfolios/shared/${shareToken}`;
      setShareInfo({
        shareToken,
        isPublic: isPublicState,
        shareUrl
      });
    }
  }, [shareToken, isPublicState]);

  const handleTogglePublic = async () => {
    setLoading(true);
    try {
      await portfolioService.toggleVisibility(portfolioId, !isPublicState);
      setIsPublicState(!isPublicState);
      onUpdate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShareToken = async () => {
    setLoading(true);
    try {
      const result = await portfolioService.generateShareToken(portfolioId);
      setShareInfo(result);
      onUpdate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShareToken = async () => {
    if (!confirm('Are you sure you want to revoke this share link? It will no longer be accessible.')) {
      return;
    }
    setLoading(true);
    try {
      await portfolioService.revokeShareToken(portfolioId);
      setShareInfo(null);
      onUpdate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to revoke share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareInfo?.shareUrl) {
      navigator.clipboard.writeText(shareInfo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Share Portfolio</h2>
          <button className="share-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="share-modal-body">
          {/* Public/Private Toggle */}
          <div className="share-section">
            <div className="share-section-header">
              <h3>Visibility</h3>
              <label className="share-toggle">
                <input
                  type="checkbox"
                  checked={isPublicState}
                  onChange={handleTogglePublic}
                  disabled={loading}
                />
                <span className="share-toggle-slider"></span>
                <span className="share-toggle-label">
                  {isPublicState ? 'Public' : 'Private'}
                </span>
              </label>
            </div>
            <p className="share-section-description">
              {isPublicState
                ? 'This portfolio is visible to everyone in the public gallery.'
                : 'This portfolio is private and only visible to you.'}
            </p>
          </div>

          {/* Share Link Section */}
          <div className="share-section">
            <div className="share-section-header">
              <h3>Share Link</h3>
            </div>
            <p className="share-section-description">
              Generate a shareable link to give others access to this portfolio.
            </p>

            {shareInfo?.shareUrl ? (
              <div className="share-link-container">
                <div className="share-link-input-group">
                  <input
                    type="text"
                    value={shareInfo.shareUrl}
                    readOnly
                    className="share-link-input"
                  />
                  <button
                    className={`share-copy-button ${copied ? 'copied' : ''}`}
                    onClick={handleCopyLink}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  className="share-revoke-button"
                  onClick={handleRevokeShareToken}
                  disabled={loading}
                >
                  Revoke Link
                </button>
              </div>
            ) : (
              <button
                className="share-generate-button"
                onClick={handleGenerateShareToken}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Share Link'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

