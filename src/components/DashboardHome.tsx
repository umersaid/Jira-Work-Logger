import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Pagination,
  Tooltip,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Search,
  OpenInNew,
  TrendingUp,
  ConfirmationNumber,
  AccessTime,
  CalendarToday,
  SmartToy,
  Add,
} from '@mui/icons-material';
import { JiraIssue, JiraWorklogEntry } from '../types/jira';
import { SubmissionHistory } from '../types/worklog';

interface DashboardHomeProps {
  username: string;
  userTickets: JiraIssue[];
  submissionHistory: SubmissionHistory[];
  jiraWorklogs: JiraWorklogEntry[];  // actual worklogs from Jira
  isLoading: boolean;
  onLogWork: (ticketKey: string) => void;
  onNavigateToTickets: () => void;
}

// ─── Helpers ───────────────────────────────────────────────

const formatHoursMinutes = (totalHours: number): string => {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const startOfWeek = (d: Date): Date => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

const getWeekStats = (history: SubmissionHistory[]) => {
  const now = new Date();
  const thisWeekStart = startOfWeek(now).getTime();
  const lastWeekStart = thisWeekStart - 7 * 86400000;

  const thisWeek = history.filter(
    (h) => h.success && new Date(h.submittedAt).getTime() >= thisWeekStart
  );
  const lastWeek = history.filter(
    (h) =>
      h.success &&
      new Date(h.submittedAt).getTime() >= lastWeekStart &&
      new Date(h.submittedAt).getTime() < thisWeekStart
  );

  const thisWeekHours = thisWeek.reduce((s, h) => s + h.totalHours, 0);
  const lastWeekHours = lastWeek.reduce((s, h) => s + h.totalHours, 0);
  const pct =
    lastWeekHours > 0
      ? Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100)
      : thisWeekHours > 0
      ? 100
      : 0;

  return { thisWeekHours, pct };
};

const getPct = (current: number, prev: number): number => {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

const getStatusColor = (status: string): { bg: string; color: string } => {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complet') || s.includes('closed'))
    return { bg: '#DCFCE7', color: '#16A34A' };
  if (s.includes('progress') || s.includes('development'))
    return { bg: '#DBEAFE', color: '#1D4ED8' };
  if (s.includes('review')) return { bg: '#EDE9FE', color: '#7C3AED' };
  return { bg: '#F1F5F9', color: '#64748B' };
};

const ROWS_PER_PAGE = 5;

// ─── Mini Robot SVG ────────────────────────────────────────

const DashboardRobot: React.FC = () => (
  <Box
    sx={{
      position: 'relative',
      width: 100,
      height: 100,
      flexShrink: 0,
    }}
  >
    {/* Glow */}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
      }}
    />
    {/* Head */}
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 64,
        height: 64,
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
        border: '2px solid #FED7AA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.8,
        boxShadow: '0 4px 12px rgba(249,115,22,0.15)',
      }}
    >
      {/* Antenna */}
      <Box
        sx={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 2,
          height: 12,
          bgcolor: '#F97316',
          borderRadius: 2,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: '#F97316',
            boxShadow: '0 0 6px #F97316',
          },
        }}
      />
      {/* Eyes */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {[0, 1].map((i) => (
          <Box
            key={i}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: '#1D4ED8',
              boxShadow: '0 0 6px rgba(29,78,216,0.5)',
              animation: 'blink 3s infinite',
              animationDelay: i === 1 ? '0.1s' : '0s',
              '@keyframes blink': {
                '0%, 90%, 100%': { transform: 'scaleY(1)' },
                '95%': { transform: 'scaleY(0.1)' },
              },
            }}
          />
        ))}
      </Box>
      {/* Smile */}
      <Box
        sx={{
          width: 24,
          height: 8,
          border: '2px solid #F97316',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
        }}
      />
    </Box>
    {/* Stars */}
    {[
      { top: 4, right: 8, size: '0.6rem' },
      { top: 18, left: 2, size: '0.5rem' },
      { bottom: 10, right: 4, size: '0.55rem' },
    ].map((s, i) => (
      <Box
        key={i}
        component="span"
        sx={{
          position: 'absolute',
          fontSize: s.size,
          color: '#F97316',
          opacity: 0.7,
          ...s,
        }}
      >
        ✦
      </Box>
    ))}
  </Box>
);

// ─── Stat Card ─────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  pct: number;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, pct, icon, iconBg }) => {
  const isPositive = pct >= 0;
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 2.5,
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        bgcolor: '#fff',
        minWidth: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500} fontSize="0.78rem">
          {label}
        </Typography>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            bgcolor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="h5" fontWeight={800} color="#1E1B4B" mb={0.5} lineHeight={1}>
        {value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TrendingUp
          sx={{
            fontSize: 14,
            color: isPositive ? '#16A34A' : '#DC2626',
            transform: isPositive ? 'none' : 'scaleY(-1)',
          }}
        />
        <Typography
          variant="caption"
          fontWeight={600}
          color={isPositive ? '#16A34A' : '#DC2626'}
          fontSize="0.72rem"
        >
          {isPositive ? '+' : ''}{pct}% from last week
        </Typography>
      </Box>
    </Paper>
  );
};

// ─── Main Component ────────────────────────────────────────

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  username,
  userTickets,
  submissionHistory,
  jiraWorklogs,
  isLoading,
  onLogWork,
  onNavigateToTickets,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);

  // ── Stats from real Jira worklogs ──────────────────────
  const now = new Date();
  const thisWeekStart = startOfWeek(now).getTime();
  const lastWeekStart = thisWeekStart - 7 * 86400000;

  const thisWeekWL = jiraWorklogs.filter(
    (wl) => new Date(wl.started).getTime() >= thisWeekStart
  );
  const lastWeekWL = jiraWorklogs.filter((wl) => {
    const t = new Date(wl.started).getTime();
    return t >= lastWeekStart && t < thisWeekStart;
  });

  const thisWeekHours = thisWeekWL.reduce((s, wl) => s + wl.timeSpentSeconds / 3600, 0);
  const lastWeekHours = lastWeekWL.reduce((s, wl) => s + wl.timeSpentSeconds / 3600, 0);
  const weekHoursPct = getPct(thisWeekHours, lastWeekHours);

  const ticketsLogged = new Set(jiraWorklogs.map((wl) => wl.issueKey)).size;
  const thisWeekTickets = new Set(thisWeekWL.map((wl) => wl.issueKey)).size;
  const lastWeekTickets = new Set(lastWeekWL.map((wl) => wl.issueKey)).size;
  const ticketsPct = getPct(thisWeekTickets, lastWeekTickets);

  const totalHours = jiraWorklogs.reduce((s, wl) => s + wl.timeSpentSeconds / 3600, 0);
  const hoursPct = getPct(thisWeekHours, lastWeekHours);

  const daysLogged = new Set(jiraWorklogs.map((wl) => wl.started.substring(0, 10))).size;
  const thisDays = new Set(thisWeekWL.map((wl) => wl.started.substring(0, 10))).size;
  const lastDays = new Set(lastWeekWL.map((wl) => wl.started.substring(0, 10))).size;
  const daysPct = getPct(thisDays, lastDays);

  // AI Worklogs Generated = worklogs submitted through this app
  const aiGenerated = submissionHistory.filter((h) => h.success).length;
  const aiThisWeek = submissionHistory.filter(
    (h) => h.success && new Date(h.submittedAt).getTime() >= thisWeekStart
  ).length;
  const aiLastWeek = submissionHistory.filter((h) => {
    const t = new Date(h.submittedAt).getTime();
    return h.success && t >= lastWeekStart && t < thisWeekStart;
  }).length;
  const aiPct = getPct(aiThisWeek, aiLastWeek);

  // ── Recent Tickets Table from Jira worklogs ────────────
  const ticketMap = useMemo(
    () => new Map(userTickets.map((t) => [t.key, t])),
    [userTickets]
  );

  // Aggregate per ticket from actual Jira worklogs
  const aggregated = useMemo(() => {
    const map = new Map<
      string,
      { totalHours: number; lastWorkDate: string; summary: string; projectName: string; status: string }
    >();
    jiraWorklogs.forEach((wl) => {
      const date = wl.started.substring(0, 10);
      const existing = map.get(wl.issueKey);
      if (!existing) {
        map.set(wl.issueKey, {
          totalHours: wl.timeSpentSeconds / 3600,
          lastWorkDate: date,
          summary: wl.issueSummary,
          projectName: wl.projectName,
          status: wl.issueStatus,
        });
      } else {
        map.set(wl.issueKey, {
          ...existing,
          totalHours: existing.totalHours + wl.timeSpentSeconds / 3600,
          lastWorkDate: date > existing.lastWorkDate ? date : existing.lastWorkDate,
        });
      }
    });
    return Array.from(map.entries())
      .map(([key, data]) => ({
        key,
        // Prefer live status from loaded tickets if available
        summary: ticketMap.get(key)?.fields.summary || data.summary,
        projectName: ticketMap.get(key)?.fields.project?.name || data.projectName,
        status: ticketMap.get(key)?.fields.status.name || data.status,
        totalHours: data.totalHours,
        lastWorkDate: data.lastWorkDate,
      }))
      .sort((a, b) => b.lastWorkDate.localeCompare(a.lastWorkDate));
  }, [jiraWorklogs, ticketMap]);

  // Status filter options derived from actual data
  const statusOptions = useMemo(() => {
    const statuses = new Set(aggregated.map((r) => r.status).filter(Boolean));
    return ['All Status', ...Array.from(statuses)];
  }, [aggregated]);

  const filtered = useMemo(() => {
    return aggregated.filter((row) => {
      const matchSearch =
        !search ||
        row.key.toLowerCase().includes(search.toLowerCase()) ||
        row.summary.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All Status' || row.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [aggregated, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginatedRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const displayName = username.includes('@') ? username.split('@')[0] : username;
  const greeting = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();

  return (
    <Box sx={{ p: 3, bgcolor: '#F1F5F9', minHeight: '100vh' }}>

      {/* ── Top Banner ──────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          bgcolor: '#fff',
          p: 3,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left: Greeting */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#1E1B4B"
              sx={{ fontSize: '1.5rem' }}
            >
              👋 Hello, {greeting}!
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Here&apos;s what&apos;s happening with your worklogs.
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={onNavigateToTickets}
            sx={{
              mt: 2,
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              bgcolor: '#F97316',
              '&:hover': { bgcolor: '#EA580C' },
              boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
            }}
          >
            Log Work
          </Button>
        </Box>

        {/* Center: Robot */}
        <Box sx={{ mx: 4, display: { xs: 'none', lg: 'block' } }}>
          <DashboardRobot />
        </Box>

        {/* Right: This week summary */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500} fontSize="0.75rem">
            Worklogs this week
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            color="#1E1B4B"
            lineHeight={1.1}
            my={0.5}
          >
            {formatHoursMinutes(thisWeekHours)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 14, color: weekHoursPct >= 0 ? '#16A34A' : '#DC2626' }} />
            <Typography
              variant="caption"
              fontWeight={600}
              color={weekHoursPct >= 0 ? '#16A34A' : '#DC2626'}
              fontSize="0.72rem"
            >
              {weekHoursPct >= 0 ? '+' : ''}{weekHoursPct}% from last week
            </Typography>
          </Box>
        </Box>

        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            right: 180,
            top: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </Paper>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard
          label="Tickets Logged"
          value={ticketsLogged.toString()}
          pct={ticketsPct}
          iconBg="#EFF6FF"
          icon={<ConfirmationNumber sx={{ color: '#1D4ED8', fontSize: 18 }} />}
        />
        <StatCard
          label="Hours Logged"
          value={formatHoursMinutes(totalHours)}
          pct={hoursPct}
          iconBg="#FFF7ED"
          icon={<AccessTime sx={{ color: '#F97316', fontSize: 18 }} />}
        />
        <StatCard
          label="Days Logged"
          value={daysLogged.toString()}
          pct={daysPct}
          iconBg="#F0FDF4"
          icon={<CalendarToday sx={{ color: '#16A34A', fontSize: 18 }} />}
        />
        <StatCard
          label="AI Worklogs Generated"
          value={aiGenerated.toString()}
          pct={aiPct}
          iconBg="#FAF5FF"
          icon={<SmartToy sx={{ color: '#7C3AED', fontSize: 18 }} />}
        />
      </Box>

      {/* ── Recent Tickets ───────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          bgcolor: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Table header row */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="#1E1B4B" sx={{ mr: 'auto' }}>
            My Recent Tickets
          </Typography>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by key or summary..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: '#94A3B8' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '10px', fontSize: '0.82rem', bgcolor: '#F8FAFC' },
            }}
            sx={{ width: 240 }}
          />

          {/* Status filter */}
          <FormControl size="small">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              sx={{ borderRadius: '10px', fontSize: '0.82rem', bgcolor: '#F8FAFC', minWidth: 130 }}
            >
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem' }}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#F97316' }} />
          </Box>
        ) : jiraWorklogs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SmartToy sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
            <Typography color="text.secondary" fontWeight={500}>
              No worklogs yet. Start logging work to see your history here.
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{
                mt: 2,
                textTransform: 'none',
                borderRadius: '8px',
                bgcolor: '#F97316',
                '&:hover': { bgcolor: '#EA580C' },
              }}
              onClick={onNavigateToTickets}
            >
              Log Your First Worklog
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  {['Key', 'Summary', 'Project', 'Last Working Date', 'Total Logged', 'Action'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        py: 1.5,
                        borderBottom: '2px solid #E2E8F0',
                        ...(h === 'Action' ? { textAlign: 'center' } : {}),
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => {
                  const { bg, color } = getStatusColor(row.status);
                  return (
                    <TableRow
                      key={row.key}
                      sx={{
                        '&:hover': { bgcolor: '#F8FAFC' },
                        transition: 'background 0.1s',
                        cursor: 'pointer',
                      }}
                      onClick={() => onLogWork(row.key)}
                    >
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="#1D4ED8"
                          fontFamily="monospace"
                          fontSize="0.82rem"
                        >
                          {row.key}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260, py: 1.8 }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color="#1E1B4B"
                          fontSize="0.82rem"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.summary || '—'}
                        </Typography>
                        {row.status && (
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              mt: 0.3,
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              bgcolor: bg,
                              color,
                              border: 'none',
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                          {row.projectName || row.key.split('-')[0]}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                          {new Date(row.lastWorkDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.8 }}>
                        <Typography variant="body2" fontWeight={700} color="#1E1B4B" fontSize="0.82rem">
                          {formatHoursMinutes(row.totalHours)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.8, textAlign: 'center' }}>
                        <Tooltip title="Log more work">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onLogWork(row.key); }}
                            sx={{
                              color: '#94A3B8',
                              '&:hover': { color: '#F97316', bgcolor: '#FFF7ED' },
                            }}
                          >
                            <OpenInNew sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {filtered.length > ROWS_PER_PAGE && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              px: 3,
              py: 2,
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              size="small"
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                },
                '& .Mui-selected': {
                  bgcolor: '#1D4ED8 !important',
                  color: '#fff',
                },
              }}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
