import { useState, useMemo } from 'react';
import { MessageCircle, Mail, Calendar, Save, CheckCircle, XCircle, Send, Clock, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';

const TABS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'green' },
  { key: 'email', label: 'Email', icon: Mail, color: 'blue' },
  { key: 'calendar', label: 'Calendar', icon: Calendar, color: 'purple' },
];

export default function Integrations() {
  const { integrationSettings, saveIntegrationSetting, notificationLogs, employees, sessions, programs, addNotificationLog } = useData();
  const [tab, setTab] = useState('whatsapp');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const whatsappSetting = integrationSettings.find(s => s.id === 'whatsapp') || { config: {}, enabled: false };
  const emailSetting = integrationSettings.find(s => s.id === 'email') || { config: {}, enabled: false };
  const calendarSetting = integrationSettings.find(s => s.id === 'calendar') || { config: {}, enabled: false };

  const [waForm, setWaForm] = useState({
    accountSid: whatsappSetting.config?.accountSid || '',
    authToken: whatsappSetting.config?.authToken || '',
    fromNumber: whatsappSetting.config?.fromNumber || '',
    enabled: whatsappSetting.enabled || false,
  });
  const [emailForm, setEmailForm] = useState({
    apiKey: emailSetting.config?.apiKey || '',
    fromEmail: emailSetting.config?.fromEmail || '',
    fromName: emailSetting.config?.fromName || 'Novaamind LMS',
    enabled: emailSetting.enabled || false,
  });
  const [calForm, setCalForm] = useState({
    provider: calendarSetting.config?.provider || 'microsoft',
    clientId: calendarSetting.config?.clientId || '',
    tenantId: calendarSetting.config?.tenantId || '',
    enabled: calendarSetting.enabled || false,
  });

  const recentLogs = useMemo(() =>
    notificationLogs.filter(l => l.type === tab).slice(0, 10),
    [notificationLogs, tab]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const saveWhatsApp = async () => {
    setSaving(true);
    const { accountSid, authToken, fromNumber, enabled } = waForm;
    await saveIntegrationSetting('whatsapp', { accountSid, authToken, fromNumber }, enabled);
    showToast('WhatsApp settings saved');
    setSaving(false);
  };

  const saveEmail = async () => {
    setSaving(true);
    const { apiKey, fromEmail, fromName, enabled } = emailForm;
    await saveIntegrationSetting('email', { apiKey, fromEmail, fromName }, enabled);
    showToast('Email settings saved');
    setSaving(false);
  };

  const saveCalendar = async () => {
    setSaving(true);
    const { provider, clientId, tenantId, enabled } = calForm;
    await saveIntegrationSetting('calendar', { provider, clientId, tenantId }, enabled);
    showToast('Calendar settings saved');
    setSaving(false);
  };

  const sendTestWhatsApp = async () => {
    await addNotificationLog({
      type: 'whatsapp',
      recipient: waForm.fromNumber || 'sandbox',
      subject: 'Test Message',
      body: 'This is a test message from Novaamind LMS',
      status: waForm.accountSid ? 'sent' : 'simulated',
      sent_at: new Date().toISOString(),
    });
    showToast(waForm.accountSid ? 'Test message sent' : 'Test message simulated (add API keys to send real messages)');
  };

  const sendTestEmail = async () => {
    await addNotificationLog({
      type: 'email',
      recipient: emailForm.fromEmail || 'test@example.com',
      subject: 'Test Email from Novaamind LMS',
      body: 'This is a test email to verify your SendGrid integration.',
      status: emailForm.apiKey ? 'sent' : 'simulated',
      sent_at: new Date().toISOString(),
    });
    showToast(emailForm.apiKey ? 'Test email sent' : 'Test email simulated (add API key to send real emails)');
  };

  const upcomingSessions = sessions.filter(s => s.status === 'Scheduled');

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease]">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 text-sm mt-1">Connect WhatsApp, Email, and Calendar services</p>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1.5 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => {
          const setting = integrationSettings.find(s => s.id === key);
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
              {setting?.enabled && <span className="w-2 h-2 rounded-full bg-green-400" />}
            </button>
          );
        })}
      </div>

      {/* ===== WHATSAPP TAB ===== */}
      {tab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Twilio WhatsApp Sandbox</h3>
                    <p className="text-xs text-gray-400">Send session reminders, overdue alerts, and weekly digests</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">Enable</span>
                  <div className="relative">
                    <input type="checkbox" checked={waForm.enabled} onChange={e => setWaForm({ ...waForm, enabled: e.target.checked })} className="sr-only" />
                    <div className={`w-10 h-5 rounded-full transition-colors ${waForm.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${waForm.enabled ? 'translate-x-5.5 ml-1' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twilio Account SID</label>
                  <input type="text" value={waForm.accountSid} onChange={e => setWaForm({ ...waForm, accountSid: e.target.value })} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                  <input type="password" value={waForm.authToken} onChange={e => setWaForm({ ...waForm, authToken: e.target.value })} placeholder="Your Twilio auth token" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Sandbox Number</label>
                  <input type="text" value={waForm.fromNumber} onChange={e => setWaForm({ ...waForm, fromNumber: e.target.value })} placeholder="+14155238886" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                </div>
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t">
                <button onClick={saveWhatsApp} disabled={saving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
                </button>
                <button onClick={sendTestWhatsApp} className="flex items-center gap-2 border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50">
                  <Send className="w-4 h-4" /> Send Test
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Message Templates</h4>
              <div className="space-y-3">
                {[
                  { name: 'Session Reminder', desc: 'Sent 24h before a session', example: 'Hi {name}, reminder: {program} session tomorrow at {time} in {venue}.' },
                  { name: 'Overdue Alert', desc: 'Sent when training is overdue', example: 'Hi {name}, your {program} training is overdue. Please complete it by {date}.' },
                  { name: 'Score Notification', desc: 'Sent after scoring', example: 'Hi {name}, you scored {score}% in {program} - Session {n}. {status}!' },
                  { name: 'Weekly Digest', desc: 'Sent every Monday to admins', example: 'Weekly LMS Report: {completed} completed, {overdue} overdue, {upcoming} sessions this week.' },
                ].map(t => (
                  <div key={t.name} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{t.name}</span>
                      <span className="text-xs text-gray-400">{t.desc}</span>
                    </div>
                    <p className="text-xs text-gray-500 bg-white p-2 rounded border font-mono">{t.example}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 h-fit">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Activity</h4>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No messages sent yet</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map(log => (
                  <div key={log.id} className="p-2.5 border rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{log.subject}</span>
                      {log.status === 'sent' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <p className="text-gray-400">{log.recipient}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== EMAIL TAB ===== */}
      {tab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">SendGrid Email</h3>
                    <p className="text-xs text-gray-400">Automated reminders, score notifications, and certifications</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">Enable</span>
                  <div className="relative">
                    <input type="checkbox" checked={emailForm.enabled} onChange={e => setEmailForm({ ...emailForm, enabled: e.target.checked })} className="sr-only" />
                    <div className={`w-10 h-5 rounded-full transition-colors ${emailForm.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${emailForm.enabled ? 'translate-x-5.5 ml-1' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SendGrid API Key</label>
                  <input type="password" value={emailForm.apiKey} onChange={e => setEmailForm({ ...emailForm, apiKey: e.target.value })} placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                    <input type="email" value={emailForm.fromEmail} onChange={e => setEmailForm({ ...emailForm, fromEmail: e.target.value })} placeholder="lms@novaamind.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                    <input type="text" value={emailForm.fromName} onChange={e => setEmailForm({ ...emailForm, fromName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t">
                <button onClick={saveEmail} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
                </button>
                <button onClick={sendTestEmail} className="flex items-center gap-2 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50">
                  <Send className="w-4 h-4" /> Send Test Email
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Email Automation Rules</h4>
              <div className="space-y-3">
                {[
                  { trigger: 'Session in 7 days', action: 'Send pre-session reminder', active: true },
                  { trigger: 'Session in 24 hours', action: 'Send day-before reminder with venue/link', active: true },
                  { trigger: 'Score submitted', action: 'Send score notification to employee', active: true },
                  { trigger: 'Program completed', action: 'Send certification email', active: true },
                  { trigger: 'Training overdue', action: 'Send overdue alert to employee + manager', active: false },
                ].map(r => (
                  <div key={r.trigger} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{r.trigger}</span>
                      <p className="text-xs text-gray-400">{r.action}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.active ? 'Active' : 'Inactive'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 h-fit">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Emails</h4>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No emails sent yet</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map(log => (
                  <div key={log.id} className="p-2.5 border rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">{log.subject}</span>
                      {log.status === 'sent' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                    </div>
                    <p className="text-gray-400 truncate">{log.recipient}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CALENDAR TAB ===== */}
      {tab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Microsoft Outlook Calendar</h3>
                    <p className="text-xs text-gray-400">Auto-create calendar invites for scheduled sessions</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">Enable</span>
                  <div className="relative">
                    <input type="checkbox" checked={calForm.enabled} onChange={e => setCalForm({ ...calForm, enabled: e.target.checked })} className="sr-only" />
                    <div className={`w-10 h-5 rounded-full transition-colors ${calForm.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${calForm.enabled ? 'translate-x-5.5 ml-1' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Microsoft Azure Client ID</label>
                  <input type="text" value={calForm.clientId} onChange={e => setCalForm({ ...calForm, clientId: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
                  <input type="text" value={calForm.tenantId} onChange={e => setCalForm({ ...calForm, tenantId: e.target.value })} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono" />
                </div>
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t">
                <button onClick={saveCalendar} disabled={saving} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Calendar Sync Behavior</h4>
              <div className="space-y-3">
                {[
                  { action: 'New session created', result: 'Auto-create Outlook invite for all enrolled employees + trainer' },
                  { action: 'Session rescheduled', result: 'Update existing calendar event with new date/time' },
                  { action: 'Session cancelled', result: 'Send cancellation to all invitees' },
                  { action: 'Employee enrolled', result: 'Add to existing session calendar events' },
                ].map(r => (
                  <div key={r.action} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                    <Calendar className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{r.action}</span>
                      <p className="text-xs text-gray-400">{r.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 h-fit">
            <h4 className="font-semibold text-gray-900 mb-3">Upcoming Sessions</h4>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No upcoming sessions</p>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.slice(0, 8).map(s => {
                  const prog = programs.find(p => p.id === s.programId);
                  return (
                    <div key={s.id} className="p-2.5 border rounded-lg text-xs">
                      <p className="font-medium text-gray-900">{prog?.name || 'Unknown'}</p>
                      <p className="text-gray-400">{s.sessionDate} · {s.startTime}-{s.endTime}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs ${calForm.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                        {calForm.enabled ? 'Will sync' : 'Not synced'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
