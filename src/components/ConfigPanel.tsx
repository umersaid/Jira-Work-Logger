import React, { useState, useEffect } from 'react';
import { FaCog, FaSave, FaTimes } from 'react-icons/fa';
import { JiraConfig } from '../types/jira';
import { saveJiraConfig, getJiraConfig } from '../utils/storage';

interface ConfigPanelProps {
  onConfigSaved: (jiraConfig: JiraConfig) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onConfigSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jiraDomain, setJiraDomain] = useState('');
  const [jiraUsername, setJiraUsername] = useState('');
  const [jiraPassword, setJiraPassword] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleEditConfig = () => {
    setEditMode(true);
    setShowPasswordPrompt(false);
    setJiraPassword('');
  };

  useEffect(() => {
    // Load saved configuration (domain and username only)
    const savedJiraConfig = getJiraConfig();

    if (savedJiraConfig) {
      setJiraDomain(savedJiraConfig.domain);
      setJiraUsername(savedJiraConfig.username);
      // Password is never saved - always prompt for it
      setShowPasswordPrompt(true);
      setIsConfigured(false); // Reset to false - need password
      setIsOpen(true); // Open panel to ask for password
    } else {
      // If not configured, open panel for initial setup
      setIsConfigured(false);
      setIsOpen(true);
    }
  }, []);

  const handleSave = () => {
    if (!jiraDomain || !jiraUsername || !jiraPassword) {
      alert('Please fill in all fields');
      return;
    }

    const cleanDomain = jiraDomain.replace('https://', '').replace('http://', '');
    
    // Save domain and username only (NOT password)
    saveJiraConfig(cleanDomain, jiraUsername, '2');
    
    // Create full config with password for this session
    const jiraConfig: JiraConfig = {
      domain: cleanDomain,
      username: jiraUsername,
      password: jiraPassword,
      apiVersion: '2',
    };

    console.log('ConfigPanel: Calling onConfigSaved with config:', { domain: cleanDomain, username: jiraUsername });
    
    setIsConfigured(true);
    setShowPasswordPrompt(false);
    setEditMode(false);
    setIsOpen(false);

    onConfigSaved(jiraConfig);
  };

  return (
    <div className="relative">
      {/* Config Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isConfigured
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : showPasswordPrompt
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse'
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
      >
        <FaCog className={isOpen ? 'animate-spin' : ''} />
        {isConfigured ? 'Settings' : showPasswordPrompt ? '🔒 Enter Password' : 'Configure Required'}
      </button>

      {/* Config Panel - Force open if password is needed */}
      {(isOpen || (showPasswordPrompt && !isConfigured)) && (
        <div className="absolute top-12 right-0 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {showPasswordPrompt && !editMode ? '🔒 Login Required' : 'Configuration'}
            </h3>
            {/* Only allow closing if already configured or in edit mode */}
            {(isConfigured || (!showPasswordPrompt && !editMode)) && (
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {showPasswordPrompt && !editMode && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
                <p className="text-sm text-blue-800 font-medium">
                  ℹ️ Welcome back, {jiraUsername}! Enter your password to continue.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Domain: <strong>{jiraDomain}</strong> is saved.{' '}
                  <button
                    onClick={handleEditConfig}
                    className="underline hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                </p>
              </div>
            )}

            {/* Jira Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jira Domain {showPasswordPrompt && !editMode && '(Saved)'}
              </label>
              <input
                type="text"
                placeholder="jira.carecloud.com"
                value={jiraDomain}
                onChange={(e) => setJiraDomain(e.target.value)}
                disabled={showPasswordPrompt && !editMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  showPasswordPrompt && !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Jira domain (e.g., jira.carecloud.com or company.atlassian.net)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username / Email {showPasswordPrompt && !editMode && '(Saved)'}
              </label>
              <input
                type="text"
                placeholder="USAID or your-email@company.com"
                value={jiraUsername}
                onChange={(e) => setJiraUsername(e.target.value)}
                disabled={showPasswordPrompt && !editMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  showPasswordPrompt && !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Jira username or email address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password / API Token {showPasswordPrompt && '🔒'}
              </label>
              <input
                type="password"
                placeholder="Your password or API token"
                value={jiraPassword}
                onChange={(e) => setJiraPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus={showPasswordPrompt}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {showPasswordPrompt ? (
                  <span className="text-orange-600 font-medium">
                    🔒 Password is never saved - enter it each session for security
                    <br />
                    <span className="text-blue-600">💡 Press Enter to login</span>
                  </span>
                ) : (
                  <>
                    For Cloud: API token from{' '}
                    <a
                      href="https://id.atlassian.com/manage-profile/security/api-tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Atlassian
                    </a>
                    <br />
                    For Server/Data Center: Your regular Jira password
                  </>
                )}
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!jiraPassword}
              className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-4 rounded-md transition-colors ${
                !jiraPassword
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <FaSave />
              {showPasswordPrompt && !editMode ? '🔓 Login' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
