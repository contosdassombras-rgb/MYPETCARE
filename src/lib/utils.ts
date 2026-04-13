import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthDate: string, t: (key: string) => string) {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  if (isNaN(birth.getTime())) return '';
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  
  if (years > 0) return `${years} ${t('years')}`;
  return `${months} ${t('months')}`;
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '---';
  const date = new Date(`${dateStr}T00:00:00`);
  return isNaN(date.getTime()) ? '---' : date.toLocaleDateString();
}
