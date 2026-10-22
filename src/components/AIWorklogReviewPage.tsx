import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, IconButton, Chip,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Refresh, Edit, Check, SaveAlt,
} from '@mui/icons-material';
import { WorkItem, DayWorkPlan } from '../types/worklog';
import { formatWorkBreakdownTable } from '../utils/tableFormatter';
import { jiraApi } from '../services/jiraApi';

interface Props {
  workItems: WorkItem[];
  onItemsChange: (items: WorkItem[]) => void;
  multiDayPlans: DayWorkPlan[];
  onMultiDayPlansChange: (plans: DayWorkPlan[]) => void;
  totalHours: number;
  onSubmit: () => Promise<void>;
  onSubmitMultiDay: (dates: Date[]) => Promise<void>;
  onRegenerate: () => void;
  isSubmitting: boolean;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h 00m`;
  return `${h}h ${m < 10 ? '0' + m : m}m`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Inline-editable table for one day's items
function DayTable({
  items, onChange, editMode,
}: {
  items: WorkItem[];
  onChange: (items: WorkItem[]) => void;
  editMode: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editTime, setEditTime] = useState('');

  const totalMinutes = items.reduce((s, i) => s + i.timeSpent, 0);

  const startEdit = (item: WorkItem) => {
    setEditingId(item.id);
    setEditDesc(item.description);
    const h = Math.floor(item.timeSpent / 60);
    const m = item.timeSpent % 60;
    setEditTime(`${h}:${m < 10 ? '0' + m : m}`);
  };

  const commitEdit = (id: string) => {
    const [hStr, mStr] = editTime.split(':');
    const minutes = (parseInt(hStr) || 0) * 60 + (parseInt(mStr) || 0);
    onChange(items.map((item) =>
      item.id === id ? { ...item, description: editDesc, timeSpent: Math.max(1, minutes) } : item
    ));
    setEditingId(null);
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
          {['Sr No.', 'Description', 'Time'].map((h) => (
            <TableCell
              key={h}
              sx={{
                fontWeight: 700, fontSize: '0.72rem', color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.4px',
                py: 1.3, borderBottom: '2px solid #E2E8F0',
                ...(h === 'Sr No.' ? { width: 70 } : {}),
                ...(h === 'Time' ? { width: 110, textAlign: 'right' } : {}),
              }}
            >
              {h}
            </TableCell>
          ))}
          {editMode && <TableCell sx={{ width: 44, borderBottom: '2px solid #E2E8F0' }} />}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#FAFAFA' }, verticalAlign: 'top' }}>
            <TableCell sx={{ py: 1.5, color: '#64748B', fontSize: '0.84rem' }}>{item.srNo}</TableCell>
            <TableCell sx={{ py: 1.5 }}>
              {editMode && editingId === item.id ? (
                <TextField
                  fullWidth size="small" value={editDesc} autoFocus
                  onChange={(e) => setEditDesc(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem', borderRadius: '6px' } }}
                />
              ) : (
                <Typography variant="body2" sx={{ color: '#1E1B4B', lineHeight: 1.6 }}>
                  {item.description}
                </Typography>
              )}
            </TableCell>
            <TableCell sx={{ py: 1.5, textAlign: 'right' }}>
              {editMode && editingId === item.id ? (
                <TextField
                  size="small" value={editTime} placeholder="H:MM"
                  onChange={(e) => setEditTime(e.target.value)}
                  sx={{ width: 76, '& .MuiOutlinedInput-root': { fontSize: '0.82rem', borderRadius: '6px' } }}
                />
              ) : (
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E1B4B' }}>
                  {formatMinutes(item.timeSpent)}
                </Typography>
              )}
            </TableCell>
            {editMode && (
              <TableCell sx={{ py: 1.3, textAlign: 'center' }}>
                {editingId === item.id ? (
                  <IconButton size="small" onClick={() => commitEdit(item.id)} sx={{ color: '#22C55E' }}>
                    <Check sx={{ fontSize: 17 }} />
                  </IconButton>
                ) : (
                  <IconButton size="small" onClick={() => startEdit(item)} sx={{ color: '#94A3B8' }}>
                    <Edit sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Card for a single day in multi-day mode
function DayCard({
  plan, index, onChange, onSubmit, submitting, submitted,
}: {
  plan: DayWorkPlan;
  index: number;
  onChange: (items: WorkItem[]) => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  submitted: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const totalMinutes = plan.items.reduce((s, i) => s + i.timeSpent, 0);

  return (
    <Paper
      elevation={0}
      sx={{
        border: submitted ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
        borderRadius: '14px', overflow: 'hidden',
        opacity: submitted ? 0.75 : 1,
        transition: 'border-color 0.2s, opacity 0.2s',
      }}
    >
      {/* Day header */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, py: 1.6,
          bgcolor: submitted ? '#F0FDF4' : '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E1B4B', fontSize: '0.92rem' }}>
            {fmtDate(plan.date)}
          </Typography>
          <Chip
            label={formatMinutes(totalMinutes)}
            size="small"
            sx={{
              bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700,
              fontSize: '0.75rem', height: 22, borderRadius: '6px',
            }}
          />
          {submitted && (
            <Chip
              icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#16A34A !important' }} />}
              label="Saved"
              size="small"
              sx={{
                bgcolor: '#DCFCE7', color: '#16A34A', fontWeight: 700,
                fontSize: '0.75rem', height: 22, borderRadius: '6px',
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            startIcon={<Edit sx={{ fontSize: 13 }} />}
            onClick={() => setEditMode(m => !m)}
            disabled={submitted}
            sx={{
              borderColor: '#F97316', color: '#F97316', textTransform: 'none',
              fontWeight: 600, fontSize: '0.76rem', borderRadius: '7px',
              border: '1px solid',
              bgcolor: editMode ? '#FFF7ED' : 'transparent',
              px: 1.2, py: 0.4,
              '&:hover': { borderColor: '#EA580C', bgcolor: '#FFF7ED' },
              '&.Mui-disabled': { opacity: 0.4 },
            }}
          >
            {editMode ? 'Done' : 'Edit'}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={submitted ? <CheckCircle sx={{ fontSize: 15 }} /> : <SaveAlt sx={{ fontSize: 15 }} />}
            onClick={onSubmit}
            disabled={submitting || submitted}
            sx={{
              background: submitted
                ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                : 'linear-gradient(135deg, #F97316, #EF4444)',
              color: '#fff', fontWeight: 700, borderRadius: '8px',
              textTransform: 'none', px: 1.8, fontSize: '0.78rem',
              boxShadow: submitted
                ? '0 2px 8px rgba(34,197,94,0.3)'
                : '0 2px 8px rgba(249,115,22,0.25)',
              '&:hover': {
                background: submitted
                  ? 'linear-gradient(135deg, #16A34A, #15803D)'
                  : 'linear-gradient(135deg, #EA580C, #DC2626)',
              },
              '&.Mui-disabled': { background: '#E2E8F0', color: '#94A3B8', boxShadow: 'none' },
            }}
          >
            {submitting ? 'Saving…' : submitted ? 'Saved' : 'Submit Worklog'}
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <DayTable items={plan.items} onChange={onChange} editMode={editMode && !submitted} />
    </Paper>
  );
}

export function AIWorklogReviewPage({
  workItems,
  onItemsChange,
  multiDayPlans,
  onMultiDayPlansChange,
  totalHours,
  onSubmit,
  onSubmitMultiDay: _onSubmitMultiDay,
  onRegenerate,
  isSubmitting,
}: Props) {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    singleDate = '',
    fromDate = '',
    hoursPerDay = totalHours,
    isMultiDay = false,
  } = (location.state as any) || {};

  const isMulti = isMultiDay && multiDayPlans.length > 1;

  // Per-day submitting / submitted state
  const [daySubmitting, setDaySubmitting] = useState<boolean[]>([]);
  const [daySubmitted, setDaySubmitted] = useState<boolean[]>([]);

  // Single-day state
  const [editMode, setEditMode] = useState(false);
  const [singleSubmitting, setSingleSubmitting] = useState(false);

  const handleSubmitDay = async (planIndex: number) => {
    const plan = multiDayPlans[planIndex];
    setDaySubmitting((prev) => { const a = [...prev]; a[planIndex] = true; return a; });
    try {
      const markdownTable = formatWorkBreakdownTable(plan.items, plan.totalHours);
      const d = new Date(plan.date);
      d.setHours(9, 0, 0, 0);
      await jiraApi.addWorklog(key!, {
        started: jiraApi.formatWorklogDate(d),
        timeSpentSeconds: jiraApi.hoursToSeconds(plan.totalHours),
        comment: markdownTable,
      });
      setDaySubmitted((prev) => { const a = [...prev]; a[planIndex] = true; return a; });
    } finally {
      setDaySubmitting((prev) => { const a = [...prev]; a[planIndex] = false; return a; });
    }
  };

  const handleSaveSingle = async () => {
    setSingleSubmitting(true);
    try {
      await onSubmit();
      navigate(`/ticket/${key}`);
    } finally {
      setSingleSubmitting(false);
    }
  };

  const handleRegenerate = () => {
    onRegenerate();
    navigate(`/ticket/${key}/generate`);
  };

  const allSubmitted = isMulti && multiDayPlans.length > 0 &&
    multiDayPlans.every((_, i) => daySubmitted[i]);

  const dateLabel = isMulti
    ? `${fmtDateShort(multiDayPlans[0].date)} – ${fmtDateShort(multiDayPlans[multiDayPlans.length - 1].date)}`
    : fmtDateShort(singleDate ? new Date(singleDate) : new Date(fromDate));

  const totalMinutesSingle = workItems.reduce((s, i) => s + i.timeSpent, 0);

  return (
    <Box sx={{ p: 3, maxWidth: 820, mx: 'auto' }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
        onClick={() => navigate(`/ticket/${key}`)}
        sx={{
          color: '#64748B', textTransform: 'none', fontWeight: 600,
          p: 0, minWidth: 0, fontSize: '0.82rem', mb: 3,
          '&:hover': { bgcolor: 'transparent', color: '#1E1B4B' },
        }}
      >
        Back to Ticket
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E1B4B' }}>
            AI Generated Worklog
          </Typography>
          <CheckCircle sx={{ color: '#22C55E', fontSize: 22 }} />
        </Box>
        <Button
          variant="outlined" size="small"
          startIcon={<Refresh sx={{ fontSize: 15 }} />}
          onClick={handleRegenerate}
          sx={{
            borderColor: '#E2E8F0', color: '#475569', textTransform: 'none',
            fontWeight: 600, borderRadius: '8px', fontSize: '0.8rem',
            '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
          }}
        >
          Regenerate All
        </Button>
      </Box>
      <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
        {isMulti
          ? `${multiDayPlans.length} days · ${hoursPerDay}h/day · ${dateLabel} — submit each day individually.`
          : 'Review and edit the worklog before saving.'}
      </Typography>

      {/* Multi-day: one card per day stacked */}
      {isMulti ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {multiDayPlans.map((plan, i) => (
            <DayCard
              key={i}
              plan={plan}
              index={i}
              onChange={(newItems) => {
                const updated = multiDayPlans.map((p, j) =>
                  j === i ? { ...p, items: newItems } : p
                );
                onMultiDayPlansChange(updated);
              }}
              onSubmit={() => handleSubmitDay(i)}
              submitting={!!daySubmitting[i]}
              submitted={!!daySubmitted[i]}
            />
          ))}

          {/* Bottom actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/ticket/${key}`)}
              sx={{
                borderColor: '#E2E8F0', color: '#475569', textTransform: 'none',
                fontWeight: 600, borderRadius: '10px', px: 3,
                '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
              }}
            >
              {allSubmitted ? 'Done' : 'Cancel'}
            </Button>
          </Box>
        </Box>
      ) : (
        /* Single day */
        <>
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', mb: 3 }}>
            {/* Meta bar */}
            <Box sx={{ bgcolor: '#F8FAFC', px: 3, py: 1.8, display: 'flex', gap: 4, borderBottom: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', gap: 0.8 }}>
                <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>Date</Typography>
                <Typography variant="body2" sx={{ color: '#1E1B4B', fontWeight: 700 }}>{dateLabel}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.8 }}>
                <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>Total Time</Typography>
                <Typography variant="body2" sx={{ color: '#1E1B4B', fontWeight: 700 }}>
                  {formatMinutes(totalMinutesSingle)}
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Button
                  size="small"
                  startIcon={<Edit sx={{ fontSize: 13 }} />}
                  onClick={() => setEditMode(m => !m)}
                  sx={{
                    border: '1px solid #F97316', color: '#F97316', textTransform: 'none',
                    fontWeight: 600, fontSize: '0.76rem', borderRadius: '7px',
                    bgcolor: editMode ? '#FFF7ED' : 'transparent',
                    px: 1.2, py: 0.3,
                    '&:hover': { bgcolor: '#FFF7ED' },
                  }}
                >
                  {editMode ? 'Done' : 'Edit'}
                </Button>
              </Box>
            </Box>
            <DayTable items={workItems} onChange={onItemsChange} editMode={editMode} />
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/ticket/${key}`)}
              sx={{
                borderColor: '#E2E8F0', color: '#475569', textTransform: 'none',
                fontWeight: 600, borderRadius: '10px', px: 3,
                '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Check />}
              onClick={handleSaveSingle}
              disabled={singleSubmitting || isSubmitting || workItems.length === 0}
              sx={{
                background: 'linear-gradient(135deg, #F97316, #EF4444)',
                color: '#fff', fontWeight: 700, borderRadius: '10px',
                textTransform: 'none', px: 3, fontSize: '0.9rem',
                boxShadow: '0 3px 12px rgba(249,115,22,0.3)',
                '&:hover': { background: 'linear-gradient(135deg, #EA580C, #DC2626)' },
                '&.Mui-disabled': { background: '#E2E8F0', color: '#94A3B8', boxShadow: 'none' },
              }}
            >
              {singleSubmitting || isSubmitting ? 'Saving…' : 'Save Worklog'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
