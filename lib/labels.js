const translations = {
  en: {
    professionalSummary: 'Professional Summary',
    workExperience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    technologies: 'Technologies',
    native: 'Native',
    fluent: 'Fluent',
    advanced: 'Advanced',
    intermediate: 'Intermediate',
    basic: 'Basic',
    conversational: 'Conversational',
    professional: 'Professional',
  },
  da: {
    professionalSummary: 'Professionel Sammendrag',
    workExperience: 'Erhvervserfaring',
    education: 'Uddannelse',
    skills: 'Færdigheder',
    projects: 'Projekter',
    certifications: 'Certificeringer',
    languages: 'Sprog',
    email: 'E-mail',
    phone: 'Telefon',
    address: 'Adresse',
    technologies: 'Teknologier',
    native: 'Modersmål',
    fluent: 'Flydende',
    advanced: 'Avanceret',
    intermediate: 'Mellemliggende',
    basic: 'Grundlæggende',
    conversational: 'Samtale',
    professional: 'Professionel',
  },
  de: {
    professionalSummary: 'Berufliche Zusammenfassung',
    workExperience: 'Berufserfahrung',
    education: 'Bildung',
    skills: 'Fähigkeiten',
    projects: 'Projekte',
    certifications: 'Zertifizierungen',
    languages: 'Sprachen',
    email: 'E-Mail',
    phone: 'Telefon',
    address: 'Adresse',
    technologies: 'Technologien',
    native: 'Muttersprache',
    fluent: 'Fließend',
    advanced: 'Fortgeschritten',
    intermediate: 'Mittelstufe',
    basic: 'Grundkenntnisse',
    conversational: 'Konversation',
    professional: 'Beruflich',
  },
};

function getLabel(cvData, key) {
  const custom = cvData.customLabels?.[key];
  if (custom && custom.trim()) {
    return custom;
  }
  const lang = cvData.language || 'en';
  return translations[lang]?.[key] || translations.en[key] || key;
}

function getProficiencyLabel(cvData, level) {
  if (!level) return level;
  const lang = cvData.language || 'en';
  const t = translations[lang] || translations.en;
  const levelLower = level.toLowerCase();
  if (levelLower === 'native') return t.native;
  if (levelLower === 'fluent') return t.fluent;
  if (levelLower === 'advanced') return t.advanced;
  if (levelLower === 'intermediate') return t.intermediate;
  if (levelLower === 'basic') return t.basic;
  if (levelLower === 'conversational') return t.conversational;
  if (levelLower === 'professional') return t.professional;
  return level;
}

module.exports = { getLabel, getProficiencyLabel, translations };

