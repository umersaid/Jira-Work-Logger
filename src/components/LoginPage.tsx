import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  SmartToy,
  WorkspacePremium,
} from '@mui/icons-material';
import { SiAtlassian } from 'react-icons/si';
import { JiraConfig } from '../types/jira';
import { saveJiraConfig, getJiraConfig, saveOpenAIKey, getOpenAIKey } from '../utils/storage';

interface LoginPageProps {
  onLogin: (config: JiraConfig) => void;
  isLoading?: boolean;
  errorMessage?: string;
}

// Decorative star/sparkle positioned on the left panel
const Star: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Box
    component="span"
    sx={{
      position: 'absolute',
      color: 'rgba(255,255,255,0.6)',
      fontSize: '1.2rem',
      userSelect: 'none',
      ...style,
    }}
  >
    ✦
  </Box>
);

// Simple robot SVG built from MUI primitives
const RobotIllustration: React.FC = () => (
  <Box
    sx={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      mb: 3,
    }}
  >
    {/* Glow ring */}
    <Box
      sx={{
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 0 40px rgba(255,255,255,0.1)',
        position: 'relative',
      }}
    >
      {/* Antenna */}
      <Box
        sx={{
          position: 'absolute',
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 3,
          height: 20,
          bgcolor: 'rgba(255,255,255,0.7)',
          borderRadius: 4,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: '#F97316',
            boxShadow: '0 0 8px #F97316',
          },
        }}
      />
      {/* Robot head */}
      <Box
        sx={{
          width: 110,
          height: 110,
          borderRadius: '28px',
          bgcolor: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.1)',
        }}
      >
        {/* Eyes row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              bgcolor: '#60A5FA',
              boxShadow: '0 0 10px #60A5FA',
              animation: 'blink 3s infinite',
              '@keyframes blink': {
                '0%, 90%, 100%': { transform: 'scaleY(1)' },
                '95%': { transform: 'scaleY(0.1)' },
              },
            }}
          />
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              bgcolor: '#60A5FA',
              boxShadow: '0 0 10px #60A5FA',
              animation: 'blink 3s infinite',
            }}
          />
        </Box>
        {/* Smile */}
        <Box
          sx={{
            width: 40,
            height: 14,
            border: '2.5px solid rgba(255,255,255,0.7)',
            borderTop: 'none',
            borderRadius: '0 0 20px 20px',
          }}
        />
      </Box>
    </Box>

    {/* Robot body hint */}
    <Box
      sx={{
        mt: -1,
        width: 70,
        height: 20,
        borderRadius: '8px 8px 0 0',
        bgcolor: 'rgba(255,255,255,0.1)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderBottom: 'none',
      }}
    />
  </Box>
);

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  isLoading = false,
  errorMessage,
}) => {
  const [domain, setDomain] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [openAIKey, setOpenAIKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [domainSaved, setDomainSaved] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const saved = getJiraConfig();
    if (saved) {
      setDomain(saved.domain);
      setUsername(saved.username);
      setDomainSaved(true);
      setUsernameSaved(true);
      setRememberMe(true);
      if (saved.password) {
        setPassword(saved.password);
      }
    }
    const savedKey = getOpenAIKey();
    if (savedKey) setOpenAIKey(savedKey);
  }, []);

  const handleSignIn = () => {
    setValidationError('');
    if (!domain.trim()) return setValidationError('Jira domain is required.');
    if (!username.trim()) return setValidationError('Email / username is required.');
    if (!password.trim()) return setValidationError('Password is required.');
    if (!openAIKey.trim()) return setValidationError('OpenAI API key is required for AI worklog generation.');

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (rememberMe) {
      saveJiraConfig(cleanDomain, username, '2', password);
    } else {
      saveJiraConfig(cleanDomain, username, '2');
    }
    saveOpenAIKey(openAIKey.trim());

    onLogin({ domain: cleanDomain, username, password, apiVersion: '2' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSignIn();
  };

  const error = validationError || errorMessage;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#F8FAFC',
        fontFamily: '"Inter", "Roboto", sans-serif',
      }}
    >
      {/* ── Left Panel ────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '45%',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 35%, #1D4ED8 70%, #1E40AF 100%)',
          position: 'relative',
          overflow: 'hidden',
          px: 6,
          textAlign: 'center',
        }}
      >
        {/* Background decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <Box sx={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <Box sx={{ position: 'absolute', top: '30%', right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(96,165,250,0.07)' }} />

        {/* Stars */}
        <Star style={{ top: '8%', left: '12%', fontSize: '1.5rem', opacity: 0.8 }} />
        <Star style={{ top: '15%', right: '18%', fontSize: '0.9rem' }} />
        <Star style={{ top: '25%', left: '8%', fontSize: '0.7rem', opacity: 0.5 }} />
        <Star style={{ bottom: '20%', left: '15%', fontSize: '1rem', opacity: 0.6 }} />
        <Star style={{ bottom: '35%', right: '12%', fontSize: '0.8rem' }} />
        <Star style={{ top: '50%', left: '5%', fontSize: '0.6rem', opacity: 0.4 }} />
        <Star style={{ top: '60%', right: '8%', fontSize: '1.2rem', opacity: 0.5 }} />
        <Star style={{ bottom: '10%', right: '25%', fontSize: '0.7rem', opacity: 0.7 }} />

        {/* Robot illustration */}
        <RobotIllustration />

        {/* Tagline */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.2,
            mb: 2,
            '& span': { color: '#F97316' },
          }}
        >
          <span>Smarter</span> Worklogs.
          <br />
          Less Manual Work.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            maxWidth: 340,
            lineHeight: 1.7,
          }}
        >
          AI-powered worklog generation for Jira that saves you time and effort.
        </Typography>

        {/* Feature pills */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4, justifyContent: 'center' }}>
          {['⚡ AI-Powered', '🔒 Secure', '⏱️ Time-Saving', '🆓 Free AI'].map((pill) => (
            <Box
              key={pill}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: '20px',
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.78rem',
                fontWeight: 500,
                backdropFilter: 'blur(4px)',
              }}
            >
              {pill}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Right Panel ────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6, lg: 10 },
          py: 6,
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1D4ED8, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(29,78,216,0.35)',
              }}
            >
              <SmartToy sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1E1B4B" lineHeight={1.1}>
                LogiJira
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Jira Automation
              </Typography>
            </Box>
          </Box>

          {/* Heading */}
          <Typography variant="h4" fontWeight={800} color="#1E1B4B" mb={0.5}>
            Welcome back! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3.5}>
            Sign in to continue to your account
          </Typography>

          {/* Sign in with Atlassian */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<SiAtlassian style={{ color: '#0052CC', fontSize: 20 }} />}
            sx={{
              borderColor: '#E2E8F0',
              color: '#334155',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '10px',
              py: 1.4,
              mb: 2.5,
              bgcolor: '#fff',
              '&:hover': { borderColor: '#0052CC', bgcolor: '#F0F7FF' },
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            }}
          >
            Sign in with Atlassian
          </Button>

          {/* OR divider */}
          <Divider sx={{ mb: 2.5, color: 'text.disabled', fontSize: '0.8rem', fontWeight: 500 }}>
            or
          </Divider>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
              {error}
            </Alert>
          )}

          {/* Jira Domain */}
          <TextField
            fullWidth
            label="Jira Domain"
            placeholder="jira.company.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={domainSaved && !!(domain)}
            size="medium"
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: '10px' },
              endAdornment: domainSaved && domain ? (
                <InputAdornment position="end">
                  <Link
                    component="button"
                    variant="caption"
                    onClick={() => { setDomainSaved(false); setUsernameSaved(false); setDomain(''); setUsername(''); }}
                    sx={{ color: '#3B82F6', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Change
                  </Link>
                </InputAdornment>
              ) : undefined,
            }}
            helperText={domainSaved && domain ? `Saved: ${domain}` : 'e.g. jira.carecloud.com or company.atlassian.net'}
          />

          {/* Email / Username */}
          <TextField
            fullWidth
            label="Email address"
            placeholder="you@example.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={usernameSaved && !!(username) && domainSaved}
            size="medium"
            sx={{ mb: 2 }}
            InputProps={{ sx: { borderRadius: '10px' } }}
          />

          {/* Password */}
          <TextField
            fullWidth
            label="Password"
            placeholder="Enter your password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus={domainSaved}
            size="medium"
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: '10px' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Password is never saved — required each session for security"
          />

          {/* OpenAI API Key */}
          <TextField
            fullWidth
            label="OpenAI API Key"
            placeholder="sk-..."
            type={showOpenAIKey ? 'text' : 'password'}
            value={openAIKey}
            onChange={(e) => setOpenAIKey(e.target.value)}
            onKeyDown={handleKeyDown}
            size="medium"
            sx={{ mb: 1 }}
            InputProps={{
              sx: { borderRadius: '10px' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    edge="end"
                    size="small"
                  >
                    {showOpenAIKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Saved locally — used for AI worklog generation"
          />

          {/* Remember me + Forgot password */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, mt: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#1D4ED8' } }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Remember me
                </Typography>
              }
            />
            <Link
              href="#"
              variant="body2"
              sx={{
                color: '#F97316',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Forgot password?
            </Link>
          </Box>

          {/* Sign In Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSignIn}
            disabled={isLoading || !password || !openAIKey}
            sx={{
              borderRadius: '10px',
              py: 1.6,
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              background: isLoading || !password
                ? undefined
                : 'linear-gradient(90deg, #F97316, #EA580C)',
              boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
              '&:hover': {
                background: 'linear-gradient(90deg, #EA580C, #C2410C)',
                boxShadow: '0 6px 18px rgba(249,115,22,0.5)',
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={22} sx={{ color: '#fff' }} />
            ) : (
              'Sign in'
            )}
          </Button>

          {/* Divider + Contact admin */}
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={3}
          >
            Don&apos;t have an account?{' '}
            <Link
              href="#"
              sx={{
                color: '#1D4ED8',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Contact your admin
            </Link>
          </Typography>

          {/* AI Free badge */}
          <Box
            sx={{
              mt: 4,
              p: 1.5,
              borderRadius: '10px',
              bgcolor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <WorkspacePremium sx={{ color: '#16A34A', fontSize: 20 }} />
            <Typography variant="caption" color="#15803D" fontWeight={600}>
              AI Powered by OpenAI — API key saved locally, never shared
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
