import React from 'react';
import '../../styles/components/icons.css';




// Material Icons name mapping (kebab-case)
const materialIconMap = {
  // Navigation
  car: 'directions_car',
  dashboard: 'dashboard',
  search: 'search',
  calculate: 'calculate',
  description: 'description',
  logout: 'logout',
  login: 'login',
  
  // Stats & Charts
  barChart: 'bar_chart',
  target: 'precision_manufacturing',
  money: 'attach_money',
  people: 'group',
  
  // Status
  success: 'check_circle',
  check: 'check',
  warning: 'warning',
  error: 'error',
  info: 'info',
  
  // Actions
  refresh: 'refresh',
  download: 'download',
  upload: 'cloud_upload',
  print: 'print',
  share: 'share',
  edit: 'edit',
  delete: 'delete',
  add: 'add',
  filter: 'filter_list',
  
  // Navigation arrows
  chevronRight: 'chevron_right',
  arrowForward: 'arrow_forward',
  
  // Others
  settings: 'settings',
  home: 'home',
  user: 'person',
  clock: 'schedule',
  calendar: 'event',
  trophy: 'emoji_events',
  receipt: 'receipt_long',
  dollar: 'currency_exchange',
  truck: 'local_shipping',
  file: 'description',
  eye: 'visibility',
  star: 'star',
  heart: 'favorite'
};

// Icon component wrapper for Material Icons
export const Icon = ({ name, size = 24, color = 'currentColor', className = '' }) => {
  const iconName = materialIconMap[name] || name;
  
  return (
    <i 
      className={`material-icons ${className}`}
      style={{ 
        fontSize: size, 
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1
      }}
    >
      {iconName}
    </i>
  );
};

export default Icon;
