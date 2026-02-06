export const PERMISSIONS = {
  STAFF: 'staff',
  USERS: 'users',
  BOOKINGS: 'bookings',
  SERVICES: 'services',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  ADMINS: 'admins',
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
  [PERMISSIONS.ADMINS]: 'Admin Management',
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [PERMISSIONS.STAFF]: 'Manage staff config, availability, and unavailability',
  [PERMISSIONS.USERS]: 'View and export customer data',
  [PERMISSIONS.BOOKINGS]: 'Approve, reject, and cancel bookings',
  [PERMISSIONS.SERVICES]: 'Create, update, and delete services',
  [PERMISSIONS.SETTINGS]: 'Manage business and system settings',
  [PERMISSIONS.NOTIFICATIONS]: 'View and manage notifications',
  [PERMISSIONS.ADMINS]: 'Create, edit, and delete admin users',
};
