require('dotenv').config();
const mongoose = require('mongoose');

const Workflow = require('./src/models/Workflow');
const Trigger = require('./src/models/Trigger');
const Action = require('./src/models/Action');
const Credential = require('./src/models/Credential');
const ExecutionLog = require('./src/models/ExecutionLog');
const ExecutionStep = require('./src/models/ExecutionStep');
const Notification = require('./src/models/Notification');

const USER_ID = new mongoose.Types.ObjectId('69fd5b35555441bbb2fe6405');

function daysAgo(n, hourOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset % 24, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ---------- CLEAN OLD DEMO DATA (only ones we created, tagged with 'demo-seed') ----------
  const oldWorkflows = await Workflow.find({ userId: USER_ID, tags: 'demo-seed' });
  const oldWfIds = oldWorkflows.map(w => w._id);
  await Trigger.deleteMany({ workflowId: { $in: oldWfIds } });
  await Action.deleteMany({ workflowId: { $in: oldWfIds } });
  const oldLogs = await ExecutionLog.find({ workflowId: { $in: oldWfIds } });
  await ExecutionStep.deleteMany({ logId: { $in: oldLogs.map(l => l._id) } });
  await ExecutionLog.deleteMany({ workflowId: { $in: oldWfIds } });
  await Notification.deleteMany({ userId: USER_ID, workflowId: { $in: oldWfIds } });
  await Workflow.deleteMany({ _id: { $in: oldWfIds } });
  console.log(`Cleaned ${oldWfIds.length} old demo workflows`);

  // ---------- 4 CREDENTIALS (skip if already exist from previous run) ----------
  const credDefs = [
    { name: 'Gmail - Support Inbox', service: 'gmail', authType: 'oauth2' },
    { name: 'Slack - Team Workspace', service: 'slack', authType: 'oauth2' },
    { name: 'Google Sheets - Orders', service: 'google-sheets', authType: 'oauth2' },
    { name: 'Twilio - SMS Gateway', service: 'twilio', authType: 'api_key' },
  ];
  const credentials = [];
  for (const c of credDefs) {
    let cred = await Credential.findOne({ userId: USER_ID, service: c.service, name: c.name });
    if (!cred) {
      cred = await Credential.create({
        userId: USER_ID,
        name: c.name,
        service: c.service,
        authType: c.authType,
        credentials: 'demo_encrypted_placeholder_' + c.service,
        isValid: true,
        lastTestedAt: daysAgo(Math.floor(Math.random() * 3)),
      });
    }
    credentials.push(cred);
  }
  console.log(`Using ${credentials.length} credentials (created or reused)`);

  // ---------- 4 WORKFLOWS + TRIGGERS + ACTIONS ----------
  const workflowDefs = [
    {
      name: 'Order Confirmation Flow',
      description: 'Webhook → Update Sheet → Send Email + SMS confirmation',
      status: 'active',
      triggerType: 'webhook',
      action: { service: 'gmail', actionType: 'send_email', config: { to: '{{trigger.email}}', subject: 'Order Confirmed' } },
      cred: credentials[0],
    },
    {
      name: 'Daily Sales Report',
      description: 'Scheduled 8PM → Read Sheet → Generate PDF → Email to owner',
      status: 'active',
      triggerType: 'schedule',
      cron: '0 20 * * *',
      action: { service: 'google-sheets', actionType: 'read_row', config: { sheetId: 'demo_sheet_123' } },
      cred: credentials[2],
    },
    {
      name: 'Team Slack Notifier',
      description: 'Manual trigger → Post update to Slack channel',
      status: 'paused',
      triggerType: 'manual',
      action: { service: 'slack', actionType: 'send_message', config: { channel: '#general', text: 'Update from FlowBridge' } },
      cred: credentials[1],
    },
    {
      name: 'Lead SMS Follow-up',
      description: 'Form submission → Send SMS to new lead (draft, not yet finished)',
      status: 'draft',
      triggerType: 'form',
      action: { service: 'twilio', actionType: 'send_sms', config: { to: '{{trigger.phone}}', body: 'Thanks for reaching out!' } },
      cred: credentials[3],
    },
  ];

  const workflows = [];
  for (const wd of workflowDefs) {
    const wf = await Workflow.create({
      userId: USER_ID,
      name: wd.name,
      description: wd.description,
      status: wd.status,
      tags: ['demo-seed'],
      stats: { totalRuns: 0, successRuns: 0, failedRuns: 0, lastRunAt: null },
    });

    const triggerData = { workflowId: wf._id, userId: USER_ID, type: wd.triggerType };
    if (wd.triggerType === 'webhook') {
      triggerData.webhook = { url: `/api/webhooks/receive/${wf._id}`, secret: 'demo_secret', method: 'POST', service: 'custom', event: 'order.created' };
    }
    if (wd.triggerType === 'schedule') {
      triggerData.schedule = { cronExpression: wd.cron, timezone: 'Asia/Kolkata', humanReadable: 'Every day at 8 PM' };
    }
    if (wd.triggerType === 'form') {
      triggerData.form = { embedCode: '<iframe src="https://flowbridge.app/forms/demo"></iframe>' };
    }
    const trigger = await Trigger.create(triggerData);

    const action = await Action.create({
      workflowId: wf._id,
      userId: USER_ID,
      order: 1,
      service: wd.action.service,
      actionType: wd.action.actionType,
      config: wd.action.config,
      credentialId: wd.cred._id,
    });

    wf.trigger = trigger._id;
    wf.actions = [{ order: 1, actionId: action._id }];
    await wf.save();

    workflows.push({ wf, triggerType: wd.triggerType, action });
  }
  console.log(`Created ${workflows.length} workflows with triggers + actions`);

  // ---------- EXECUTION LOGS (last 7 days, only for active workflows) ----------
  const activeWorkflows = workflows.filter(w => w.wf.status === 'active');
  let totalLogs = 0;

  for (const { wf, action } of activeWorkflows) {
    const runsPerDay = wf.name.includes('Order') ? [3, 5] : [1, 2]; // order flow runs more often
    let totalRuns = 0, successRuns = 0, failedRuns = 0, lastRunAt = null;

    for (let day = 6; day >= 0; day--) {
      const numRuns = Math.floor(Math.random() * (runsPerDay[1] - runsPerDay[0] + 1)) + runsPerDay[0];
      for (let r = 0; r < numRuns; r++) {
        const isSuccess = Math.random() > 0.15; // 85% success rate
        const startedAt = daysAgo(day, 8 + r * 3);
        const duration = Math.floor(Math.random() * 2500) + 200;
        const completedAt = new Date(startedAt.getTime() + duration);

        const log = await ExecutionLog.create({
          workflowId: wf._id,
          userId: USER_ID,
          status: isSuccess ? 'success' : 'failed',
          triggerType: wf.name.includes('Sales') ? 'schedule' : 'webhook',
          triggerData: { test: true, source: 'demo-seed' },
          startedAt,
          completedAt,
          duration,
          error: isSuccess ? undefined : { message: 'Service temporarily unavailable', step: 1, service: action.service },
        });

        await ExecutionStep.create({
          logId: log._id,
          workflowId: wf._id,
          order: 1,
          service: action.service,
          actionType: action.actionType,
          status: isSuccess ? 'success' : 'failed',
          input: action.config,
          output: isSuccess ? { ok: true, messageId: 'demo_' + log._id } : undefined,
          error: isSuccess ? undefined : 'HTTP 503: Service Temporarily Unavailable',
          duration,
        });

        totalRuns++;
        if (isSuccess) successRuns++; else failedRuns++;
        if (!lastRunAt || startedAt > lastRunAt) lastRunAt = startedAt;
        totalLogs++;
      }
    }

    await Workflow.findByIdAndUpdate(wf._id, {
      'stats.totalRuns': totalRuns,
      'stats.successRuns': successRuns,
      'stats.failedRuns': failedRuns,
      'stats.lastRunAt': lastRunAt,
    });
  }
  console.log(`Created ${totalLogs} execution logs with steps`);

  // ---------- 4 NOTIFICATIONS ----------
  const orderWf = workflows.find(w => w.wf.name.includes('Order'));
  const notifDefs = [
    { type: 'workflow_failed', title: 'Workflow Failed', message: `"${orderWf.wf.name}" failed during execution`, workflowId: orderWf.wf._id, isRead: false },
    { type: 'workflow_success', title: 'Workflow Succeeded', message: `"${orderWf.wf.name}" completed successfully`, workflowId: orderWf.wf._id, isRead: true },
    { type: 'credential_expired', title: 'Credential Expiring Soon', message: 'Your Gmail credential will expire in 3 days', isRead: false },
    { type: 'system', title: 'Welcome to FlowBridge', message: 'Your account is set up and ready to go!', isRead: true },
  ];
  for (const n of notifDefs) {
    await Notification.create({ userId: USER_ID, ...n });
  }
  console.log(`Created ${notifDefs.length} notifications`);

  console.log('\n✅ DEMO SEED COMPLETE');
  console.log(`   Workflows: ${workflows.length} (active: ${activeWorkflows.length}, paused: 1, draft: 1)`);
  console.log(`   Credentials: ${credentials.length}`);
  console.log(`   Execution Logs: ${totalLogs}`);
  console.log(`   Notifications: ${notifDefs.length}`);

  process.exit(0);
}

run().catch(e => { console.error('SEED FAILED:', e); process.exit(1); });
