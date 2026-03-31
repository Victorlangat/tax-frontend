export const calculateAgeFromYear = (year) => {
  return new Date().getFullYear() - year;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-KE');
};

export const getCategoryDescription = (category) => {
  return category.name + ` (${category.engineMax || category.engineMin || 'Special'}cc)`;
};

export default { calculateAgeFromYear, formatDate, getCategoryDescription };

