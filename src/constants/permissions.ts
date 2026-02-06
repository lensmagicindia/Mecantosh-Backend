export const PERMISSIONS = {
  STAFF: 'staff',
  USERS: 'users',
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.STAFF]: 'Staff Management',
  [PERMISSIONS.USERS]: 'User Management',
  [PERMISSIONS.BOOKINGS]: 'Booking Management',
  [PERMISSIONS.SERVICES]: 'Services',
  [PERMISSIONS.SETTINGS]: 'Settings',
  [PERMISSIONS.NOTIFICATIONS]: 'Notifications',
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [PERMISSIONS.STAFF]: 'Manage staff config, availability, and unavailability',
  [PERMISSIONS.USERS]: 'View and export customer data',
  [PERMISSIONS.BOOKINGS]: 'Approve, reject, and cancel bookings',
  [PERMISSIONS.SERVICES]: 'Create, update, and delete services',
  [PERMISSIONS.SETTINGS]: 'Manage business and system settings',
  [PERMISSIONS.NOTIFICATIONS]: 'View and manage notifications',
};
