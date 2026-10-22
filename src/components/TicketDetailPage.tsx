import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, Paper, Button, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow,
  Divider, CircularProgress, Checkbox, FormControlLabel,
  Tooltip, Skeleton,
} from '@mui/material';
import {
  ArrowBack, Star, StarBorder, OpenInNew, AutoAwesome,
  AccessTime, EditNote, BugReport, BookmarkAdded,
  AssignmentTurnedIn, Bolt, FiberManualRecord,
} from '@mui/icons-material';
import { jiraApi } from '../services/jiraApi';
import { JiraIssue, IssueWorklogEntry } from '../types/jira';

interface Props {
  onGenerateWorklog: (key: string) => void;
  onLogManual: (key: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'In Progress': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Done':        { bg: '#F0FDF4', color: '#16A34A' },
  'To Do':       { bg: '#F1F5F9', color: '#475569' },
  'In Review':   { bg: '#FFF7ED', color: '#EA580C' },
  'Blocked':     { bg: '#FEF2F2', color: '#DC2626' },
  'Closed':      { bg: '#F0FDF4', color: '#15803D' },
};

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] ?? { bg: '#F1F5F9', color: '#475569' };
}

function getPriorityColor(priority?: string): string {
  if (!priority) return '#94A3B8';
  const p = priority.toLowerCase();
  if (p === 'highest' || p === 'critical') return '#DC2626';
  if (p === 'high')   return '#EA580C';
  if (p === 'medium') return '#D97706';
  if (p === 'low' || p === 'lowest') return '#3B82F6';
  return '#94A3B8';
}

function getTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t === 'bug')   return '#EF4444';
  if (t === 'story') return '#22C55E';
  if (t === 'task')  return '#3B82F6';
  if (t === 'epic')  return '#8B5CF6';
  return '#F97316';
}

function getTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t === 'bug')   return <BugReport sx={{ fontSize: 14, color: '#EF4444' }} />;
  if (t === 'story') return <BookmarkAdded sx={{ fontSize: 14, color: '#22C55E' }} />;
  if (t === 'task')  return <AssignmentTurnedIn sx={{ fontSize: 14, color: '#3B82F6' }} />;
  if (t === 'epic')  return <Bolt sx={{ fontSize: 14, color: '#8B5CF6' }} />;
  return <AssignmentTurnedIn sx={{ fontSize: 14, color: '#F97316' }} />;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m < 10 ? '0' + m : m}m`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Parse a markdown pipe table into rows of cells */
function parseMarkdownTable(comment: string): { srNo: string; description: string; time: string }[] {
  if (!comment) return [];
  const lines = comment.split('\n');
  const rows: { srNo: string; description: string; time: string }[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip separator lines and header lines (Sr. No / Description / Time Spent)
    if (!trimmed.startsWith('|')) continue;
    if (/^\|[-\s|]+\|/.test(trimmed)) continue; // divider row
    const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    // Skip header row
    if (/^sr/i.test(cells[0])) continue;
    // Must be numeric sr no
    if (!/^\d+$/.test(cells[0])) continue;
    rows.push({ srNo: cells[0], description: cells[1].replace(/\\\|/g, '|'), time: cells[2] });
  }
  return rows;
}

export function TicketDetailPage({ onGenerateWorklog, onLogManual }: Props) {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();

  const [issue, setIssue]       = useState<JiraIssue | null>(null);
  const [worklogs, setWorklogs] = useState<IssueWorklogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [starred, setStarred]   = useState(false);
  const [showInAI, setShowInAI] = useState(true);
  const [showAllWorklogs, setShowAllWorklogs] = useState(false);

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    setError(null);
    Promise.all([
      jiraApi.fetchIssue(key),
      jiraApi.fetchIssueWorklogs(key),
    ])
      .then(([issueData, worklogData]) => {
        setIssue(issueData);
        setWorklogs(worklogData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [key]);

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Skeleton width={130} height={28} />
          <Skeleton width={70} height={28} />
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={40} sx={{ mb: 1 }} />
            <Skeleton width="35%" height={18} sx={{ mb: 3 }} />
            <Skeleton variant="rounded" height={130} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={200} />
          </Box>
          <Box sx={{ width: 240 }}>
            <Skeleton variant="rounded" height={150} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={220} />
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error || !issue) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" mb={1} fontWeight={600}>{error || 'Ticket not found'}</Typography>
        <Button onClick={() => navigate(-1)} variant="outlined" sx={{ mt: 1 }}>Go Back</Button>
      </Box>
    );
  }

  const statusStyle = getStatusStyle(issue.fields.status.name);
  const reporter    = (issue.fields as any).reporter;

  // Build Jira browse URL from saved config
  const openInJira = () => {
    try {
      const raw = localStorage.getItem('jira_saved_config') || localStorage.getItem('jira_config');
      if (raw) {
        const cfg = JSON.parse(raw);
        const domain = cfg.domain?.replace(/^https?:\/\//, '').replace(/\/$/, '');
        window.open(`https://${domain}/browse/${issue.key}`, '_blank', 'noopener');
      }
    } catch (_) {}
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* ── Breadcrumb row ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
          onClick={() => navigate(-1)}
          sx={{
            color: '#64748B', textTransform: 'none', fontWeight: 600,
            p: 0, minWidth: 0, fontSize: '0.82rem',
            '&:hover': { bgcolor: 'transparent', color: '#1E1B4B' },
          }}
        >
          Back to Tickets
        </Button>
        <Typography color="#CBD5E1" sx={{ userSelect: 'none' }}>|</Typography>
        <Chip
          label={issue.fields.project.key}
          size="small"
          sx={{
            bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700,
            borderRadius: '6px', fontSize: '0.73rem', height: 22,
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* ══════════════ LEFT PANEL ══════════════ */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Title row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 0.8 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#1E1B4B"
              sx={{ flex: 1, lineHeight: 1.3, wordBreak: 'break-word' }}
            >
              {issue.fields.summary}
            </Typography>
            <Chip
              label={issue.fields.status.name}
              size="small"
              sx={{
                bgcolor: statusStyle.bg, color: statusStyle.color,
                fontWeight: 700, borderRadius: '6px', mt: 0.4, flexShrink: 0, fontSize: '0.75rem',
              }}
            />
            <Tooltip title={starred ? 'Unstar' : 'Star'}>
              <IconButton onClick={() => setStarred(s => !s)} size="small" sx={{ mt: 0.2 }}>
                {starred
                  ? <Star sx={{ color: '#FBBF24', fontSize: 20 }} />
                  : <StarBorder sx={{ color: '#94A3B8', fontSize: 20 }} />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Meta line */}
          <Typography variant="caption" color="#94A3B8" sx={{ display: 'block', mb: 3 }}>
            {issue.fields.project.name}
            {issue.fields.updated && (
              <> · Updated: {formatDate(issue.fields.updated)}</>
            )}
          </Typography>

          {/* Description */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} color="#1E1B4B" mb={1.5}>
              Description
            </Typography>
            <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {issue.fields.description || 'No description provided.'}
            </Typography>
          </Paper>

          {/* Labels */}
          {issue.fields.labels && issue.fields.labels.length > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, mb: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#1E1B4B" mb={1.5}>
                Labels
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {issue.fields.labels.map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    sx={{ bgcolor: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Components */}
          {issue.fields.components && issue.fields.components.length > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, mb: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#1E1B4B" mb={1.5}>
                Components
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {issue.fields.components.map((c) => (
                  <Chip
                    key={c.name}
                    label={c.name}
                    size="small"
                    sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', borderRadius: '6px', fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Previous Worklogs */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#1E1B4B">
                Previous Worklogs
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showInAI}
                    onChange={(e) => setShowInAI(e.target.checked)}
                    size="small"
                    sx={{ color: '#3B82F6', '&.Mui-checked': { color: '#3B82F6' }, p: 0.5 }}
                  />
                }
                label={
                  <Typography variant="caption" color="#3B82F6" fontWeight={600}>
                    Show in AI context
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Box>

            {worklogs.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <AccessTime sx={{ fontSize: 32, color: '#CBD5E1', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No worklogs recorded yet.
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AutoAwesome />}
                  onClick={() => navigate(`/ticket/${issue.key}/generate`, {
                    state: { prevWorklogs: showInAI ? worklogs : [], includePrevWorklogs: showInAI },
                  })}
                  sx={{
                    mt: 1.5, bgcolor: '#F97316', textTransform: 'none', fontWeight: 700,
                    borderRadius: '8px', fontSize: '0.78rem',
                    '&:hover': { bgcolor: '#EA580C' },
                  }}
                >
                  Generate First Worklog
                </Button>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {worklogs.slice(0, showAllWorklogs ? undefined : 5).map((wl) => {
                    const rows = parseMarkdownTable(wl.comment);
                    return (
                      <Box key={wl.id} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                        {/* Day header */}
                        <Box
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 2, py: 1.2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E1B4B', fontSize: '0.82rem' }}>
                            {formatDate(wl.started)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1D4ED8', fontSize: '0.82rem' }}>
                            {formatTime(wl.timeSpentSeconds)}
                          </Typography>
                        </Box>

                        {/* Work items */}
                        {rows.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ py: 0.8, px: 2, fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', width: 52, borderBottom: '1px solid #F1F5F9' }}>S.No</TableCell>
                                <TableCell sx={{ py: 0.8, px: 1.5, fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>Task Description</TableCell>
                                <TableCell sx={{ py: 0.8, px: 2, fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', width: 70, textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>Time</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows.map((row, i) => (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: '#FAFAFE' } }}>
                                  <TableCell sx={{ py: 1, px: 2, color: '#94A3B8', fontSize: '0.8rem', borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>{row.srNo}</TableCell>
                                  <TableCell sx={{ py: 1, px: 1.5, color: '#334155', fontSize: '0.82rem', lineHeight: 1.5, borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>{row.description}</TableCell>
                                  <TableCell sx={{ py: 1, px: 2, color: '#1E1B4B', fontWeight: 700, fontSize: '0.8rem', textAlign: 'right', borderBottom: i === rows.length - 1 ? 'none' : '1px solid #F1F5F9' }}>{row.time}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', fontStyle: 'italic' }}>
                              {wl.comment || '—'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>

                {worklogs.length > 5 && (
                  <Box sx={{ pt: 1.5, textAlign: 'center' }}>
                    <Button
                      size="small"
                      onClick={() => setShowAllWorklogs(v => !v)}
                      sx={{ color: '#1D4ED8', textTransform: 'none', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {showAllWorklogs ? 'Show less' : `View all worklogs (${worklogs.length})`}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>

        {/* ══════════════ RIGHT SIDEBAR ══════════════ */}
        <Box sx={{ width: 230, flexShrink: 0 }}>

          {/* Quick Actions */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 2.5, mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} color="#1E1B4B" mb={2}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => navigate(`/ticket/${issue.key}/generate`, {
                  state: { prevWorklogs: showInAI ? worklogs : [], includePrevWorklogs: showInAI },
                })}
                sx={{
                  bgcolor: '#F97316', color: '#fff', fontWeight: 700,
                  borderRadius: '8px', textTransform: 'none', fontSize: '0.82rem',
                  '&:hover': { bgcolor: '#EA580C' },
                  boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
                }}
              >
                Generate Worklog
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditNote />}
                onClick={() => onLogManual(issue.key)}
                sx={{
                  borderColor: '#E2E8F0', color: '#1E1B4B', fontWeight: 600,
                  borderRadius: '8px', textTransform: 'none', fontSize: '0.82rem',
                  '&:hover': { borderColor: '#1D4ED8', bgcolor: '#F8FAFC' },
                }}
              >
                Log Manual Worklog
              </Button>
              <Button
                fullWidth
                variant="text"
                startIcon={<AccessTime />}
                sx={{
                  color: '#64748B', fontWeight: 600, textTransform: 'none',
                  fontSize: '0.82rem', borderRadius: '8px',
                  '&:hover': { bgcolor: '#F1F5F9', color: '#1E1B4B' },
                }}
              >
                View All Worklogs
              </Button>
            </Box>
          </Paper>

          {/* Ticket Details */}
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} color="#1E1B4B" mb={2}>
              Ticket Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <DetailRow label="Assignee" value={issue.fields.assignee?.displayName || 'Unassigned'} />
              <DetailRow label="Reporter" value={reporter?.displayName || '—'} />
              <DetailRow
                label="Priority"
                value={issue.fields.priority?.name || 'Medium'}
                valueColor={getPriorityColor(issue.fields.priority?.name)}
                dot
              />
              <Box>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.4px' }}>
                  Type
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.3 }}>
                  {getTypeIcon(issue.fields.issuetype.name)}
                  <Typography variant="body2" fontWeight={600} color={getTypeColor(issue.fields.issuetype.name)} fontSize="0.82rem">
                    {issue.fields.issuetype.name}
                  </Typography>
                </Box>
              </Box>
              <DetailRow
                label="Status"
                value={issue.fields.status.name}
                valueColor={statusStyle.color}
                dot
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button
              fullWidth
              variant="text"
              endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
              onClick={openInJira}
              sx={{
                color: '#1D4ED8', fontWeight: 600, textTransform: 'none',
                fontSize: '0.82rem', justifyContent: 'flex-start', p: 0,
                '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
              }}
            >
              View in Jira
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

// ── Small helper component ────────────────────────────────────
function DetailRow({
  label, value, valueColor, dot,
}: {
  label: string;
  value: string;
  valueColor?: string;
  dot?: boolean;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.4px' }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
        {dot && valueColor && (
          <FiberManualRecord sx={{ fontSize: 8, color: valueColor }} />
        )}
        <Typography variant="body2" fontWeight={600} color={valueColor || '#1E1B4B'} fontSize="0.82rem">
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
