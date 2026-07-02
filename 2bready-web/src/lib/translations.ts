type Locale = 'en' | 'kh';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'app.name': '2bReady',
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.logout': 'Sign Out',
    'auth.forgot_password': 'Forgot Password?',
    'nav.dashboard': 'Dashboard',
    'nav.companies': 'Companies',
    'nav.journey': 'Compliance Journey',
    'nav.documents': 'Documents',
    'nav.audit': 'Audits',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.support': 'Support',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.no_data': 'No data found',
  },
  kh: {
    'app.name': '2bReady',
    'auth.login': 'ចូល',
    'auth.register': 'បង្កើតគណនី',
    'auth.logout': 'ចាកចេញ',
    'auth.forgot_password': 'ភ្លេចពាក្យសម្ងាត់?',
    'nav.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'nav.companies': 'ក្រុមហ៊ុន',
    'nav.journey': 'ដំណើរអនុលោមភាព',
    'nav.documents': 'ឯកសារ',
    'nav.audit': 'សវនកម្ម',
    'nav.reports': 'របាយការណ៍',
    'nav.settings': 'ការកំណត់',
    'nav.support': 'ជំនួយ',
    'common.save': 'រក្សាទុក',
    'common.cancel': 'បោះបង់',
    'common.delete': 'លុប',
    'common.edit': 'កែប្រែ',
    'common.loading': 'កំពុងផ្ទុក...',
    'common.error': 'មានបញ្ហាកើតឡើង',
    'common.no_data': 'រកមិនឃើញទិន្នន័យ',
  },
};

export function useTranslations(locale: Locale = 'en') {
  return (key: string): string => translations[locale]?.[key] ?? translations['en'][key] ?? key;
}
