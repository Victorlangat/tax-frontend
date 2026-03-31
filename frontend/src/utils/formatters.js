export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'KES 0';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(value);
};

export const calculateAgeFromYear = (year) => {
  return new Date().getFullYear() - (year || 0);
};

export default formatCurrency;

