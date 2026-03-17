import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import { UserProfile, ProfileUpdate } from '../PortfolioForm/types';
import './ProfileSettings.css';

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

export default function ProfileSettings({
  profile,
  onUpdate,
  onClose
}: ProfileSettingsProps) {
  const [formData, setFormData] = useState<ProfileUpdate>({
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    avatar: profile.avatar || '',
    theme: (profile.theme as 'light' | 'dark' | 'auto') || 'light',
    profilePrivacy: (profile.profilePrivacy as 'public' | 'private') || 'private'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updated = await portfolioService.updateProfile(formData);
      onUpdate(updated.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, we'll just store the file name or URL
      // In a real app, you'd upload to a storage service and get a URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-settings-overlay" onClick={onClose}>
      <div className="profile-settings-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-settings-header">
          <h2>Profile Settings</h2>
          <button className="profile-settings-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="profile-settings-form">
          {/* Avatar */}
          <div className="form-group">
            <label htmlFor="avatar" className="form-label">Avatar</label>
            <div className="avatar-section">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-input"
              />
              <label htmlFor="avatar" className="avatar-upload-button">
                {formData.avatar ? 'Change Avatar' : 'Upload Avatar'}
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div className="form-group">
            <label htmlFor="displayName" className="form-label">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              maxLength={100}
              className="form-input"
              placeholder="Enter your display name"
            />
          </div>

          {/* Bio */}
          <div className="form-group">
            <label htmlFor="bio" className="form-label">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={500}
              rows={4}
              className="form-textarea"
              placeholder="Tell us about yourself..."
            />
            <p className="character-count">
              {formData.bio?.length || 0}/500 characters
            </p>
          </div>

          {/* Theme */}
          <div className="form-group">
            <label htmlFor="theme" className="form-label">Theme</label>
            <select
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className="form-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          {/* Privacy */}
          <div className="form-group">
            <label htmlFor="profilePrivacy" className="form-label">Profile Privacy</label>
            <select
              id="profilePrivacy"
              name="profilePrivacy"
              value={formData.profilePrivacy}
              onChange={handleChange}
              className="form-select"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <p className="form-help-text">
              {formData.profilePrivacy === 'public'
                ? 'Your profile and public portfolios will be visible to everyone.'
                : 'Your profile will only be visible to you.'}
            </p>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

