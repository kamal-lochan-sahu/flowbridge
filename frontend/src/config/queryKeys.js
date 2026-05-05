export const KEYS = {
  // Auth
  ME: ['me'],

  // Workflows
  WORKFLOWS:        (params) => ['workflows', params],
  WORKFLOW:         (id)     => ['workflow', id],
  WORKFLOW_LOGS:    (id)     => ['workflow-logs', id],
  WORKFLOW_STATS:   (id)     => ['workflow-stats', id],

  // Actions
  ACTIONS:          (id)     => ['actions', id],

  // Credentials
  CREDENTIALS:      ['credentials'],

  // Logs
  LOGS:             (params) => ['logs', params],
  LOG:              (id)     => ['log', id],
  LOG_STEPS:        (id)     => ['log-steps', id],

  // Dashboard
  DASHBOARD_STATS:  ['dashboard-stats'],
  DASHBOARD_CHART:  ['dashboard-chart'],
  DASHBOARD_RECENT: ['dashboard-recent'],

  // Integrations
  INTEGRATIONS:     ['integrations'],

  // Notifications
  NOTIFICATIONS:    ['notifications'],
  UNREAD_COUNT:     ['unread-count'],
}
