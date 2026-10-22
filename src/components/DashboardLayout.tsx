import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ConfirmationNumber,
  AccessTime,
  CalendarMonth,
  Settings,
  HelpOutlined,
  SmartToy,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { Notification, NotificationProps } from './Notification';

export type TabKey = 'dashboard' | 'my-tickets' | 'worklogs' | 'calendar' | 'settings' | 'help';

const NAV_ITEMS: { key: TabKey; label: string; Icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { key: 'my-tickets', label: 'My Tickets', Icon: ConfirmationNumber },
  { key: 'worklogs', label: 'Worklogs', Icon: AccessTime },
  { key: 'calendar', label: 'Calendar', Icon: CalendarMonth },
  { key: 'settings', label: 'Settings', Icon: Settings },
  { key: 'help', label: 'Help & Support', Icon: HelpOutlined },
];

interface DashboardLayoutProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  notification: Omit<NotificationProps, 'onClose'> | null;
  onCloseNotification: () => void;
}

const SIDEBAR_WIDTH = 240;

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
  isLoading,
  loadingMessage,
  notification,
  onCloseNotification,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#F1F5F9',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          background: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 2.5, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(249,115,22,0.4)',
              flexShrink: 0,
            }}
          >
            <SmartToy sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              color="#fff"
              lineHeight={1.1}
              letterSpacing="-0.3px"
            >
              LogiJira
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>
              Jira Automation
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

        {/* Navigation */}
        <List sx={{ px: 1.5, pt: 1.5, flex: 1 }}>
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const isActive = activeTab === key;
            return (
              <Tooltip key={key} title="" placement="right">
                <ListItemButton
                  onClick={() => onTabChange(key)}
                  sx={{
                    borderRadius: '10px',
                    mb: 0.5,
                    px: 1.5,
                    py: 1,
                    bgcolor: isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
                    transition: 'all 0.15s',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    <Icon
                      sx={{
                        fontSize: 19,
                        color: isActive ? '#F97316' : 'rgba(255,255,255,0.5)',
                        transition: 'color 0.15s',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      letterSpacing: '0.1px',
                    }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        width: 4,
                        height: 20,
                        borderRadius: 2,
                        bgcolor: '#F97316',
                        boxShadow: '0 0 8px rgba(249,115,22,0.6)',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>

        {/* Pro Plan badge */}
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              borderRadius: '12px',
              bgcolor: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Star sx={{ color: '#FCD34D', fontSize: 18 }} />
              <Typography variant="body2" fontWeight={700} color="#fff" fontSize="0.8rem">
                Pro Plan
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', display: 'block', mb: 1.5 }}>
              Renews on May 20, 2026
            </Typography>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.75)',
                textTransform: 'none',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                py: 0.5,
                '&:hover': { borderColor: '#F97316', color: '#F97316', bgcolor: 'rgba(249,115,22,0.08)' },
              }}
            >
              Manage Plan
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Main Content ─────────────────────────────────────── */}
      <Box
        sx={{
          ml: `${SIDEBAR_WIDTH}px`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Loading bar */}
        {isLoading && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: SIDEBAR_WIDTH,
              right: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1.5,
              bgcolor: '#1D4ED8',
              boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
            }}
          >
            <CircularProgress size={16} sx={{ color: '#fff' }} />
            <Typography variant="body2" color="#fff" fontWeight={600} fontSize="0.82rem">
              {loadingMessage}
            </Typography>
          </Box>
        )}

        <Box sx={{ flex: 1, px: 0, py: 0 }}>
          {children}
        </Box>
      </Box>

      {/* Notification */}
      {notification && (
        <Notification {...notification} onClose={onCloseNotification} />
      )}
    </Box>
  );
};
