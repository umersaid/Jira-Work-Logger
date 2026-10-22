import { useState } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { ConfigPanel } from './components/ConfigPanel';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout, TabKey } from './components/DashboardLayout';
import { DashboardHome } from './components/DashboardHome';
import { TicketInputForm } from './components/TicketInputForm';
import { TicketList } from './components/TicketList';
import { WorkBreakdownTable } from './components/WorkBreakdownTable';
import { PreviewPanel } from './components/PreviewPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { TicketDetailPage } from './components/TicketDetailPage';
import { GenerateWorklogPage } from './components/GenerateWorklogPage';
import { AIWorklogReviewPage } from './components/AIWorklogReviewPage';
import { Notification as _Notification, NotificationProps } from './components/Notification';
import { jiraApi } from './services/jiraApi';
import { aiService } from './services/aiService';
import { allocateTime, validateTimeAllocation } from './services/timeAllocator';
import { formatWorkBreakdownTable } from './utils/tableFormatter';
import { saveSubmissionHistory, getSubmissionHistory } from './utils/storage';
import { JiraConfig, JiraIssue, JiraWorklogEntry } from './types/jira';
import { WorkItem, SubmissionHistory, DayWorkPlan } from './types/worklog';

type LoadingState = 'idle' | 'fetching' | 'generating' | 'submitting' | 'loading-tickets';

function App() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isConfigured, setIsConfigured] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [loginError, setLoginError] = useState<string | undefined>();
  const [notification, setNotification] = useState<Omit<NotificationProps, 'onClose'> | null>(null);
  const [username, setUsername] = useState('');

  // Active tab is stored in ?tab= URL param so back/forward works
  const activeTab = (searchParams.get('tab') as TabKey) || 'dashboard';
  const setActiveTab = (tab: TabKey) => navigate(`/?tab=${tab}`);
  
  const [currentTicket, setCurrentTicket] = useState<JiraIssue | null>(null);
  const [ticketKey, setTicketKey] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [workDate, setWorkDate] = useState<Date>(new Date());
  const [workDescription, setWorkDescription] = useState('');
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  // Multi-day plans (one per date)
  const [multiDayPlans, setMultiDayPlans] = useState<DayWorkPlan[]>([]);
  
  // Ticket list state
  const [userTickets, setUserTickets] = useState<JiraIssue[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>(() => getSubmissionHistory());
  const [jiraWorklogs, setJiraWorklogs] = useState<JiraWorklogEntry[]>([]);

  const handleConfigSaved = async (jiraConfig: JiraConfig) => {
    console.log('App: handleConfigSaved called with:', { domain: jiraConfig.domain, username: jiraConfig.username });
    setLoginError(undefined);
    try {
      jiraApi.initialize(jiraConfig);
      setIsConfigured(true);
      setUsername(jiraConfig.username);
      showNotification('success', '✅ Logged in successfully! Loading your tickets...');
      
      // Fetch user's tickets after login
      await fetchUserTickets();
    } catch (error: any) {
      console.error('Failed to initialize Jira API:', error);
      setLoginError('Failed to connect: ' + error.message);
      setIsConfigured(false);
    }
  };

  const fetchUserTickets = async () => {
    setLoadingState('loading-tickets');
    try {
      const [tickets, worklogs] = await Promise.all([
        jiraApi.fetchUserIssues(),
        jiraApi.fetchUserWorklogs(),
      ]);
      setUserTickets(tickets);
      setJiraWorklogs(worklogs);
      console.log(`Loaded ${tickets.length} tickets, ${worklogs.length} worklog entries`);
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      showNotification('error', 'Failed to load your tickets: ' + error.message);
      setUserTickets([]);
    } finally {
      setLoadingState('idle');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const handleGenerate = async (ticket: string, hours: number, date: Date, workDescription: string, prevWorklogs?: any[]) => {
    setTicketKey(ticket);
    setTotalHours(hours);
    setWorkDate(date);
    setWorkDescription(workDescription);
    setWorkItems([]);
    setCurrentTicket(null);

    try {
      // Step 1: Fetch Jira issue
      setLoadingState('fetching');
      const issue = await jiraApi.fetchIssue(ticket);
      setCurrentTicket(issue);

      // Step 2: Generate work descriptions with AI (using user's work description)
      setLoadingState('generating');
      const aiGeneratedItems = await aiService.generateWorkDescriptions(issue, hours, workDescription, undefined, prevWorklogs);

      // Step 3: Allocate time based on complexity
      const itemsWithTime = allocateTime(aiGeneratedItems, hours);
      setWorkItems(itemsWithTime);

      setLoadingState('idle');
      showNotification(
        'success',
        `Generated ${itemsWithTime.length} work items for ${ticket}`
      );
    } catch (error: any) {
      setLoadingState('idle');
      
      // Check if it's a network/CORS error
      if (error.message && error.message.includes('Cannot connect to Jira')) {
        showNotification(
          'error',
          'Network Error: Cannot connect to Jira. Try: 1) Install CORS extension 2) Check VPN 3) See browser console (F12)'
        );
      } else {
        showNotification('error', error.message || 'Failed to generate work breakdown');
      }
      
      console.error('Generation error:', error);
    }
  };

  const handleRegenerate = () => {
    if (ticketKey && totalHours && workDate && workDescription) {
      handleGenerate(ticketKey, totalHours, workDate, workDescription);
    }
  };

  const handleGenerateMultiDay = async (
    key: string,
    dates: Date[],
    hoursPerDay: number,
    description: string,
    prevWorklogs?: any[]
  ) => {
    setTicketKey(key);
    setTotalHours(hoursPerDay);
    setWorkDescription(description);
    setMultiDayPlans([]);
    try {
      setLoadingState('fetching');
      const issue = await jiraApi.fetchIssue(key);
      setCurrentTicket(issue);
      setLoadingState('generating');
      const plans = await aiService.generateMultiDayWorkDescriptions(issue, dates, hoursPerDay, description, prevWorklogs);
      setMultiDayPlans(plans);
      setLoadingState('idle');
      showNotification('success', `Generated worklogs for ${plans.length} days!`);
    } catch (error: any) {
      setLoadingState('idle');
      showNotification('error', error.message || 'Failed to generate worklogs');
    }
  };

  const handleSubmitMultiDay = async (dates: Date[]) => {
    const validation = validateTimeAllocation(workItems, totalHours);
    if (!validation.valid) {
      showNotification('error', validation.message || 'Invalid time allocation');
      return;
    }
    setLoadingState('submitting');
    try {
      const markdownTable = formatWorkBreakdownTable(workItems, totalHours);
      for (const date of dates) {
        const worklogDate = new Date(date);
        worklogDate.setHours(9, 0, 0, 0);
        await jiraApi.addWorklog(ticketKey, {
          started: jiraApi.formatWorklogDate(worklogDate),
          timeSpentSeconds: jiraApi.hoursToSeconds(totalHours),
          comment: markdownTable,
        });
        const historyEntry: SubmissionHistory = {
          id: `submission-${Date.now()}-${date.getTime()}`,
          ticketKey,
          workDate: date.toISOString(),
          totalHours,
          itemCount: workItems.length,
          submittedAt: new Date(),
          success: true,
        };
        saveSubmissionHistory(historyEntry);
      }
      setSubmissionHistory(getSubmissionHistory());
      setLoadingState('idle');
      showNotification('success', `Logged ${totalHours}h/day to ${ticketKey} for ${dates.length} day(s)!`);
      setWorkItems([]);
      setCurrentTicket(null);
      setTicketKey('');
    } catch (error: any) {
      setLoadingState('idle');
      showNotification('error', error.message || 'Failed to submit worklog');
      console.error('Multi-day submission error:', error);
    }
  };

  const handleSubmit = async () => {
    // Validate time allocation
    const validation = validateTimeAllocation(workItems, totalHours);
    if (!validation.valid) {
      showNotification('error', validation.message || 'Invalid time allocation');
      return;
    }

    setLoadingState('submitting');

    try {
      // Format the work breakdown as markdown table
      const markdownTable = formatWorkBreakdownTable(workItems, totalHours);

      // Prepare worklog data
      const worklogDate = new Date(workDate);
      worklogDate.setHours(9, 0, 0, 0); // Set to 9 AM

      const worklog = {
        started: jiraApi.formatWorklogDate(worklogDate),
        timeSpentSeconds: jiraApi.hoursToSeconds(totalHours),
        comment: markdownTable,
      };

      // Submit to Jira
      await jiraApi.addWorklog(ticketKey, worklog);

      // Save to history
      const historyEntry: SubmissionHistory = {
        id: `submission-${Date.now()}`,
        ticketKey,
        workDate: workDate.toISOString(),
        totalHours,
        itemCount: workItems.length,
        submittedAt: new Date(),
        success: true,
      };
      saveSubmissionHistory(historyEntry);
      setSubmissionHistory(getSubmissionHistory());

      setLoadingState('idle');
      showNotification(
        'success',
        `Successfully logged ${totalHours}h to ${ticketKey}!`
      );

      // Reset form
      setWorkItems([]);
      setCurrentTicket(null);
      setTicketKey('');
    } catch (error: any) {
      setLoadingState('idle');
      
      const historyEntry: SubmissionHistory = {
        id: `submission-${Date.now()}`,
        ticketKey,
        workDate: workDate.toISOString(),
        totalHours,
        itemCount: workItems.length,
        submittedAt: new Date(),
        success: false,
        error: error.message,
      };
      saveSubmissionHistory(historyEntry);
      setSubmissionHistory(getSubmissionHistory());

      showNotification('error', error.message || 'Failed to submit worklog');
      console.error('Submission error:', error);
    }
  };

  const handleTicketSelect = (selectedTicketKey: string) => {
    navigate(`/ticket/${selectedTicketKey}`);
  };

  const isLoading = loadingState !== 'idle';
  const loadingMessage = {
    fetching: 'Fetching ticket from Jira...',
    generating: 'AI is generating work descriptions...',
    submitting: 'Submitting worklog to Jira...',
    'loading-tickets': 'Loading your tickets...',
    idle: '',
  }[loadingState];

  // Show login page when not authenticated
  if (!isConfigured) {
    return (
      <LoginPage
        onLogin={handleConfigSaved}
        isLoading={loadingState === 'loading-tickets' || loadingState === 'fetching'}
        errorMessage={loginError}
      />
    );
  }

  // ── Shared layout wrapper ──────────────────────────────────
  const layout = (children: React.ReactNode) => (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLoading={isLoading}
      loadingMessage={loadingMessage}
      notification={notification}
      onCloseNotification={() => setNotification(null)}
    >
      {children}
    </DashboardLayout>
  );

  return (
    <Routes>
      {/* ── AI worklog review page ── */}
      <Route
        path="/ticket/:key/review"
        element={layout(
          <AIWorklogReviewPage
            workItems={workItems}
            onItemsChange={setWorkItems}
            multiDayPlans={multiDayPlans}
            onMultiDayPlansChange={setMultiDayPlans}
            totalHours={totalHours}
            onSubmit={handleSubmit}
            onSubmitMultiDay={handleSubmitMultiDay}
            onRegenerate={handleRegenerate}
            isSubmitting={loadingState === 'submitting'}
          />
        )}
      />

      {/* ── Generate worklog page ── */}
      <Route
        path="/ticket/:key/generate"
        element={layout(
          <GenerateWorklogPage
            onGenerate={handleGenerate}
            onGenerateMultiDay={handleGenerateMultiDay}
            isLoading={loadingState === 'fetching' || loadingState === 'generating'}
          />
        )}
      />

      {/* ── Ticket detail page ── */}
      <Route
        path="/ticket/:key"
        element={layout(
          <TicketDetailPage
            onGenerateWorklog={(key) => navigate(`/ticket/${key}/generate`)}
            onLogManual={(key) => {
              setTicketKey(key);
              navigate('/?tab=worklogs');
            }}
          />
        )}
      />

      {/* ── All other paths → dashboard tabs ── */}
      <Route path="*" element={layout(renderContent())} />
    </Routes>
  );

  // ── Dashboard tab content ──────────────────────────────────
  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardHome
            username={username}
            userTickets={userTickets}
            submissionHistory={submissionHistory}
            jiraWorklogs={jiraWorklogs}
            isLoading={loadingState === 'loading-tickets'}
            onLogWork={(key) => navigate(`/ticket/${key}`)}
            onNavigateToTickets={() => setActiveTab('my-tickets')}
          />
        );

      case 'my-tickets':
        return (
          <Box sx={{ p: 3 }}>
            <TicketList
              tickets={userTickets}
              isLoading={loadingState === 'loading-tickets'}
              onTicketSelect={handleTicketSelect}
              submissionHistory={submissionHistory}
            />
          </Box>
        );

      case 'worklogs':
        return (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TicketInputForm
              onGenerate={handleGenerate}
              isLoading={isLoading}
              initialTicketKey={ticketKey}
            />

            {currentTicket && (
              <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E1B4B', mb: 1.5 }}>
                  Ticket Information
                </Typography>
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '10px', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {currentTicket.fields.issuetype.iconUrl && (
                      <img src={currentTicket.fields.issuetype.iconUrl} alt={currentTicket.fields.issuetype.name} style={{ width: 20, height: 20, marginTop: 2 }} />
                    )}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace' }}>
                        {currentTicket.key}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E1B4B' }}>
                        {currentTicket.fields.summary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentTicket.fields.issuetype.name} · {currentTicket.fields.status.name}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )}

            {workItems.length > 0 && (
              <>
                <WorkBreakdownTable
                  items={workItems}
                  onItemsChange={setWorkItems}
                  onRegenerate={handleRegenerate}
                  isLoading={isLoading}
                />
                <PreviewPanel
                  ticketKey={ticketKey}
                  workDate={workDate}
                  totalHours={totalHours}
                  items={workItems}
                  onSubmit={handleSubmit}
                  isSubmitting={loadingState === 'submitting'}
                />
              </>
            )}

            <HistoryPanel />
          </Box>
        );

      case 'calendar':
        return (
          <Box sx={{ p: 3 }}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', p: 6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E1B4B', mb: 1 }}>Calendar</Typography>
              <Typography color="text.secondary">Calendar view coming soon.</Typography>
            </Paper>
          </Box>
        );

      case 'settings':
        return (
          <Box sx={{ p: 3 }}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', p: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E1B4B', mb: 2 }}>
                Jira Settings
              </Typography>
              <ConfigPanel onConfigSaved={handleConfigSaved} />
            </Paper>
          </Box>
        );

      case 'help':
        return (
          <Box sx={{ p: 3 }}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', p: 6, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E1B4B', mb: 1 }}>Help & Support</Typography>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                Need help? Check out the documentation or contact support.
              </Typography>
              <Typography variant="body2" sx={{ color: '#1D4ED8' }}>support@logijira.com</Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  }
}

export default App;
