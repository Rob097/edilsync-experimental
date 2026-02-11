import { base44 } from '@/api/base44Client';

// Helper per le operazioni sicure sulle entità tramite backend functions
export const secureApi = {
  // Company operations
  company: {
    create: (data) => base44.functions.invoke('companyOperations', { operation: 'create', data }).then(res => res.data.data),
    list: () => base44.functions.invoke('companyOperations', { operation: 'list' }).then(res => res.data.data),
    filter: (query) => base44.functions.invoke('companyOperations', { operation: 'filter', query }).then(res => res.data.data),
    get: (id) => base44.functions.invoke('companyOperations', { operation: 'get', id }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('companyOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('companyOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // CompanyMember operations
  companyMember: {
    list: (company_id) => base44.functions.invoke('companyMemberOperations', { operation: 'list', company_id }).then(res => res.data.data),
    filter: (company_id) => base44.functions.invoke('companyMemberOperations', { operation: 'filter', company_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('companyMemberOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('companyMemberOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('companyMemberOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // Project operations
  project: {
    create: (data) => base44.functions.invoke('projectOperations', { operation: 'create', data }).then(res => res.data.data),
    list: () => base44.functions.invoke('projectOperations', { operation: 'list' }).then(res => res.data.data),
    filter: (query) => base44.functions.invoke('projectOperations', { operation: 'filter', query }).then(res => res.data.data),
    get: (id) => base44.functions.invoke('projectOperations', { operation: 'get', id }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('projectOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('projectOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // ProjectParticipant operations
  projectParticipant: {
    list: (project_id) => base44.functions.invoke('projectParticipantOperations', { operation: 'list', project_id }).then(res => res.data.data),
    filter: (project_id) => base44.functions.invoke('projectParticipantOperations', { operation: 'filter', project_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('projectParticipantOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('projectParticipantOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('projectParticipantOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // Task operations
  task: {
    list: (project_id) => base44.functions.invoke('taskOperations', { operation: 'list', project_id }).then(res => res.data.data),
    filter: (project_id) => base44.functions.invoke('taskOperations', { operation: 'filter', project_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('taskOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('taskOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('taskOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // Milestone operations
  milestone: {
    list: (project_id) => base44.functions.invoke('milestoneOperations', { operation: 'list', project_id }).then(res => res.data.data),
    filter: (project_id) => base44.functions.invoke('milestoneOperations', { operation: 'filter', project_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('milestoneOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('milestoneOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('milestoneOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // ChangeRequest operations
  changeRequest: {
    list: (project_id) => base44.functions.invoke('changeRequestOperations', { operation: 'list', project_id }).then(res => res.data.data),
    filter: (project_id) => base44.functions.invoke('changeRequestOperations', { operation: 'filter', project_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('changeRequestOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('changeRequestOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('changeRequestOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // Event operations
  event: {
    list: () => base44.functions.invoke('eventOperations', { operation: 'list' }).then(res => res.data.data),
    filter: () => base44.functions.invoke('eventOperations', { operation: 'filter' }).then(res => res.data.data),
    get: (id) => base44.functions.invoke('eventOperations', { operation: 'get', id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('eventOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('eventOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('eventOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // ProjectDocument operations
  document: {
    list: (project_id) => base44.functions.invoke('documentOperations', { operation: 'list', project_id }).then(res => res.data.data),
    filter: (project_id) => base44.functions.invoke('documentOperations', { operation: 'filter', project_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('documentOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('documentOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('documentOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // DocumentComment operations
  documentComment: {
    list: (project_id) => base44.functions.invoke('documentCommentOperations', { operation: 'list', project_id }).then(res => res.data.data),
    filter: (project_id) => base44.functions.invoke('documentCommentOperations', { operation: 'filter', project_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('documentCommentOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('documentCommentOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('documentCommentOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // Channel operations
  channel: {
    list: (project_id, company_id) => base44.functions.invoke('channelOperations', { operation: 'list', project_id, company_id }).then(res => res.data.data),
    filter: (project_id, company_id) => base44.functions.invoke('channelOperations', { operation: 'filter', project_id, company_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('channelOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('channelOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('channelOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // ChannelMember operations
  channelMember: {
    list: (channel_id) => base44.functions.invoke('channelMemberOperations', { operation: 'list', channel_id }).then(res => res.data.data),
    filter: (channel_id) => base44.functions.invoke('channelMemberOperations', { operation: 'filter', channel_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('channelMemberOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('channelMemberOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('channelMemberOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // Message operations
  message: {
    list: (channel_id) => base44.functions.invoke('messageOperations', { operation: 'list', channel_id }).then(res => res.data.data),
    filter: (channel_id) => base44.functions.invoke('messageOperations', { operation: 'filter', channel_id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('messageOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('messageOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('messageOperations', { operation: 'delete', id }).then(res => res.data),
  },

  // Notification operations
  notification: {
    list: () => base44.functions.invoke('notificationOperations', { operation: 'list' }).then(res => res.data.data),
    filter: () => base44.functions.invoke('notificationOperations', { operation: 'filter' }).then(res => res.data.data),
    get: (id) => base44.functions.invoke('notificationOperations', { operation: 'get', id }).then(res => res.data.data),
    create: (data) => base44.functions.invoke('notificationOperations', { operation: 'create', data }).then(res => res.data.data),
    update: (id, data) => base44.functions.invoke('notificationOperations', { operation: 'update', id, data }).then(res => res.data.data),
    delete: (id) => base44.functions.invoke('notificationOperations', { operation: 'delete', id }).then(res => res.data),
  },
};