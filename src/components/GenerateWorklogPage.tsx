import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Paper,
  Radio, RadioGroup, FormControlLabel, Checkbox,
  CircularProgress, InputAdornment,
} from '@mui/material';
import {
  ArrowBack, AutoAwesome, CalendarToday,
} from '@mui/icons-material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { IssueWorklogEntry } from '../types/jira';

interface Props {
  onGenerate: (ticket: string, hours: number, date: Date, description: string, prevWorklogs?: IssueWorklogEntry[]) => Promise<void>;
  onGenerateMultiDay: (key: string, dates: Date[], hoursPerDay: number, description: string, prevWorklogs?: IssueWorklogEntry[]) => Promise<void>;
  isLoading: boolean;
}

function getDatesInRange(from: string, to: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);
  const end = new Date(to);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Parse strings like "1d 2h 30m", "7h 30m", "90m", "8h", "8" into decimal hours */
function parseTimeToHours(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  let total = 0;
  let matched = false;
  const dMatch = s.match(/(\d+(\.\d+)?)\s*d/);
  const hMatch = s.match(/(\d+(\.\d+)?)\s*h/);
  const mMatch = s.match(/(\d+(\.\d+)?)\s*m(?!o)/);
  if (dMatch) { total += parseFloat(dMatch[1]) * 8; matched = true; }
  if (hMatch) { total += parseFloat(hMatch[1]); matched = true; }
  if (mMatch) { total += parseFloat(mMatch[1]) / 60; matched = true; }
  if (!matched) {
    const n = parseFloat(s);
    if (!isNaN(n)) return n;
    return null;
  }
  return Math.round(total * 100) / 100 || null;
}

export function GenerateWorklogPage({ onGenerate, onGenerateMultiDay, isLoading }: Props) {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Prev worklogs + includeContext flag passed from TicketDetailPage
  const locationState = (location.state as any) || {};
  const passedWorklogs: IssueWorklogEntry[] = locationState.prevWorklogs || [];
  const passedInclude: boolean = locationState.includePrevWorklogs ?? true;

  const today = new Date().toISOString().split('T')[0];

  const [description, setDescription] = useState('');
  const [dateMode, setDateMode] = useState<'single' | 'multi'>('single');
  const [singleDate, setSingleDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [timeInput, setTimeInput] = useState('8h');
  const [timeError, setTimeError] = useState('');
  const [includeContext, setIncludeContext] = useState(passedWorklogs.length > 0 ? passedInclude : false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe what you worked on.');
      return;
    }
    if (!key) return;

    const hours = parseTimeToHours(timeInput);
    if (!hours || hours <= 0) {
      setTimeError('Enter a valid time, e.g. "7h 30m", "1d 2h", "90m"');
      return;
    }
    setTimeError('');
    setError('');

    const worklogs = includeContext ? passedWorklogs : undefined;

    if (dateMode === 'multi' && fromDate && toDate) {
      const dates = getDatesInRange(fromDate, toDate);
      await onGenerateMultiDay(key, dates, hours, description, worklogs);
      navigate(`/ticket/${key}/review`, {
        state: { dateMode, singleDate, fromDate, toDate, hoursPerDay: hours, isMultiDay: true },
      });
    } else {
      const date = new Date(singleDate);
      await onGenerate(key, hours, date, description, worklogs);
      navigate(`/ticket/${key}/review`, {
        state: { dateMode: 'single', singleDate, fromDate, toDate, hoursPerDay: hours, isMultiDay: false },
      });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 620, mx: 'auto' }}>
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E1B4B' }}>
              Generate Worklog with AI
            </Typography>
            <AutoAwesome sx={{ color: '#F97316', fontSize: 22 }} />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Let AI create meaningful worklogs based on the ticket details.
          </Typography>
        </Box>
        {/* Robot illustration */}
        <Box
          sx={{
            width: 70, height: 70, borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, ml: 2,
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}
        >
          <SmartToyIcon sx={{ color: '#fff', fontSize: 38 }} />
        </Box>
      </Box>

      {/* Ticket key badge */}
      <Box sx={{ mb: 3, mt: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700,
            px: 1.2, py: 0.4, borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem',
          }}
        >
          {key}
        </Typography>
      </Box>

      {/* What did you work on */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E1B4B', mb: 1.5 }}>
          What did you work on?
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={8}
          placeholder="Describe what you worked on..."
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= 1000) setDescription(e.target.value);
          }}
          error={!!error}
          helperText={error}
          slotProps={{ input: { sx: { fontSize: '0.875rem', borderRadius: '8px' } } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textAlign: 'right', mt: 0.5 }}>
          {description.length}/1000
        </Typography>
      </Paper>

      {/* Select Dates */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E1B4B', mb: 2 }}>
          Select Dates
        </Typography>
        <RadioGroup
          value={dateMode}
          onChange={(e) => setDateMode(e.target.value as 'single' | 'multi')}
          sx={{ gap: 1.5 }}
        >
          {/* Single Day */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              value="single"
              control={<Radio size="small" sx={{ color: '#F97316', '&.Mui-checked': { color: '#F97316' } }} />}
              label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#1E1B4B' }}>Single Day</Typography>}
              sx={{ m: 0 }}
            />
            <TextField
              type="date"
              size="small"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              disabled={dateMode !== 'single'}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ fontSize: 16, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' },
                width: 180,
              }}
            />
          </Box>

          {/* Multiple Days */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              value="multi"
              control={<Radio size="small" sx={{ color: '#F97316', '&.Mui-checked': { color: '#F97316' } }} />}
              label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#1E1B4B' }}>Multiple Days</Typography>}
              sx={{ m: 0 }}
            />
            <TextField
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={dateMode !== 'multi'}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ fontSize: 16, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' },
                width: 165,
              }}
            />
            <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>to</Typography>
            <TextField
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={dateMode !== 'multi'}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ fontSize: 16, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' },
                width: 165,
              }}
            />
          </Box>
        </RadioGroup>

        {/* Time */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 2.5, pt: 2, borderTop: '1px solid #F1F5F9' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mt: 1 }}>
            {dateMode === 'single' ? 'Time spent' : 'Time per day'}
          </Typography>
          <Box>
            <TextField
              size="small"
              value={timeInput}
              onChange={(e) => { setTimeInput(e.target.value); setTimeError(''); }}
              placeholder="e.g. 7h 30m"
              error={!!timeError}
              helperText={timeError || 'e.g. 8h · 7h 30m · 1d 2h · 90m'}
              sx={{
                width: 160,
                '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.88rem' },
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* AI Context Settings */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E1B4B', mb: 1.5 }}>
          AI Context Settings
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              size="small"
              disabled={passedWorklogs.length === 0}
              sx={{ color: '#3B82F6', '&.Mui-checked': { color: '#3B82F6' }, p: 0.5 }}
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: passedWorklogs.length === 0 ? '#94A3B8' : '#1E1B4B' }}>
                Include previous worklogs in context
                {passedWorklogs.length > 0 && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: '#3B82F6', fontWeight: 700 }}>
                    ({passedWorklogs.length} found)
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {passedWorklogs.length === 0
                  ? 'No previous worklogs found for this ticket.'
                  : 'AI will avoid repeating tasks already logged for this ticket.'}
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', m: 0, gap: 0.5 }}
        />
      </Paper>

      {/* Generate Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleGenerate}
        disabled={isLoading}
        startIcon={
          isLoading
            ? <CircularProgress size={18} sx={{ color: '#fff' }} />
            : <AutoAwesome />
        }
        sx={{
          background: isLoading
            ? '#CBD5E1'
            : 'linear-gradient(135deg, #F97316, #EF4444)',
          color: '#fff',
          fontWeight: 700,
          borderRadius: '12px',
          fontSize: '1rem',
          py: 1.6,
          textTransform: 'none',
          boxShadow: isLoading ? 'none' : '0 4px 16px rgba(249,115,22,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #EA580C, #DC2626)',
            boxShadow: '0 6px 20px rgba(249,115,22,0.45)',
          },
          '&.Mui-disabled': { background: '#E2E8F0', color: '#94A3B8' },
        }}
      >
        {isLoading ? 'Generating…' : 'Generate Worklog'}
      </Button>
    </Box>
  );
}
