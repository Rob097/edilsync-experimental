export const APPLICATION_ROLES = ['admin', 'normal'];

export const COMPANY_TYPES = [
  'general_contractor',
  'excavation',
  'demolition',
  'foundations',
  'concrete_structures',
  'metal_carpentry',
  'masonry',
  'roofing_tinsmithing',
  'waterproofing_insulation',
  'electrical_systems',
  'plumbing_hvac',
  'drywall',
  'flooring_cladding',
  'painting',
  'fixtures_windows',
  'blacksmith',
  'restoration',
  'architecture_studio',
  'engineering_studio',
  'surveying_studio',
  'design_studio',
  'supplier',
  'other',
];

export const COMPANY_MEMBER_ROLES = [
  'owner_admin',
  'project_manager',
  'site_manager',
  'crew_leader',
  'technical_office',
  'safety_manager',
  'worker',
  'backoffice',
  'external_consultant',
];

export const PROJECT_PARTICIPATION_ROLES = [
  'homeowner',
  'contractor',
  'subcontractor',
  'architect',
  'engineer',
  'surveyor',
  'designer',
  'consultant',
  'supplier',
];

const COMPANY_TYPE_ROLE_COMPATIBILITY = {
  general_contractor: PROJECT_PARTICIPATION_ROLES,
  excavation: ['subcontractor'],
  demolition: ['subcontractor'],
  foundations: ['subcontractor'],
  concrete_structures: ['subcontractor'],
  metal_carpentry: ['subcontractor'],
  masonry: ['subcontractor'],
  roofing_tinsmithing: ['subcontractor'],
  waterproofing_insulation: ['subcontractor'],
  electrical_systems: ['subcontractor'],
  plumbing_hvac: ['subcontractor'],
  drywall: ['subcontractor'],
  flooring_cladding: ['subcontractor'],
  painting: ['subcontractor'],
  fixtures_windows: ['subcontractor'],
  blacksmith: ['subcontractor'],
  restoration: ['subcontractor', 'consultant'],
  architecture_studio: ['architect', 'consultant'],
  engineering_studio: ['engineer', 'consultant'],
  surveying_studio: ['surveyor', 'consultant'],
  design_studio: ['designer', 'consultant'],
  supplier: ['supplier'],
  other: PROJECT_PARTICIPATION_ROLES,
};

const LABELS = {
  it: {
    companyTypes: {
      general_contractor: 'Impresa generale di costruzioni',
      excavation: 'Impresa di scavi e movimento terra',
      demolition: 'Impresa di demolizioni',
      foundations: 'Impresa di fondazioni',
      concrete_structures: 'Impresa strutture in cemento armato',
      metal_carpentry: 'Carpenteria metallica',
      masonry: 'Impresa di muratura',
      roofing_tinsmithing: 'Coperture e lattoneria',
      waterproofing_insulation: 'Impermeabilizzazione e isolamento',
      electrical_systems: 'Impianti elettrici',
      plumbing_hvac: 'Impianti termoidraulici',
      drywall: 'Cartongessista',
      flooring_cladding: 'Pavimentazioni e rivestimenti',
      painting: 'Tinteggiatura',
      fixtures_windows: 'Serramentista',
      blacksmith: 'Fabbro',
      restoration: 'Impresa di restauro',
      architecture_studio: 'Studio di architettura',
      engineering_studio: 'Studio di ingegneria',
      surveying_studio: 'Studio tecnico/geometra',
      design_studio: 'Studio di design interni',
      supplier: 'Fornitore',
      other: 'Altro',
    },
    companyMemberRoles: {
      owner_admin: 'Titolare / Amministratore',
      project_manager: 'Responsabile commessa',
      site_manager: 'Capo cantiere',
      crew_leader: 'Caposquadra',
      technical_office: 'Ufficio tecnico',
      safety_manager: 'Responsabile sicurezza',
      worker: 'Operaio',
      backoffice: 'Back office amministrativo',
      external_consultant: 'Consulente esterno',
    },
    projectRoles: {
      homeowner: 'Committente',
      contractor: 'Contractor',
      subcontractor: 'Subappaltatore',
      architect: 'Architetto',
      engineer: 'Ingegnere',
      surveyor: 'Geometra',
      designer: 'Designer',
      consultant: 'Consulente',
      supplier: 'Fornitore',
    },
  },
  en: {
    companyTypes: {
      general_contractor: 'General contractor',
      excavation: 'Excavation company',
      demolition: 'Demolition company',
      foundations: 'Foundations company',
      concrete_structures: 'Concrete structures company',
      metal_carpentry: 'Metal carpentry company',
      masonry: 'Masonry company',
      roofing_tinsmithing: 'Roofing and tinsmithing company',
      waterproofing_insulation: 'Waterproofing and insulation company',
      electrical_systems: 'Electrical systems company',
      plumbing_hvac: 'Plumbing and HVAC company',
      drywall: 'Drywall company',
      flooring_cladding: 'Flooring and cladding company',
      painting: 'Painting company',
      fixtures_windows: 'Fixtures and windows company',
      blacksmith: 'Blacksmith company',
      restoration: 'Restoration company',
      architecture_studio: 'Architecture studio',
      engineering_studio: 'Engineering studio',
      surveying_studio: 'Surveying studio',
      design_studio: 'Interior design studio',
      supplier: 'Supplier',
      other: 'Other',
    },
    companyMemberRoles: {
      owner_admin: 'Owner / Administrator',
      project_manager: 'Project manager',
      site_manager: 'Site manager',
      crew_leader: 'Crew leader',
      technical_office: 'Technical office',
      safety_manager: 'Safety manager',
      worker: 'Worker',
      backoffice: 'Backoffice',
      external_consultant: 'External consultant',
    },
    projectRoles: {
      homeowner: 'Homeowner',
      contractor: 'Contractor',
      subcontractor: 'Subcontractor',
      architect: 'Architect',
      engineer: 'Engineer',
      surveyor: 'Surveyor',
      designer: 'Designer',
      consultant: 'Consultant',
      supplier: 'Supplier',
    },
  },
};

const normalizeLanguage = (language) => (language === 'it' ? 'it' : 'en');

export const getCompanyTypeLabel = (companyType, language = 'it') => {
  const lang = normalizeLanguage(language);
  return LABELS[lang].companyTypes[companyType] || companyType;
};

export const getCompanyMemberRoleLabel = (memberRole, language = 'it') => {
  const lang = normalizeLanguage(language);
  return LABELS[lang].companyMemberRoles[memberRole] || memberRole;
};

export const getProjectRoleLabel = (projectRole, language = 'it') => {
  const lang = normalizeLanguage(language);
  return LABELS[lang].projectRoles[projectRole] || projectRole;
};

export const getCompanyTypeOptions = (language = 'it') =>
  COMPANY_TYPES.map((value) => ({ value, label: getCompanyTypeLabel(value, language) }));

export const getCompanyMemberRoleOptions = (language = 'it') =>
  COMPANY_MEMBER_ROLES.map((value) => ({ value, label: getCompanyMemberRoleLabel(value, language) }));

export const getProjectRoleOptions = (language = 'it') =>
  PROJECT_PARTICIPATION_ROLES.map((value) => ({ value, label: getProjectRoleLabel(value, language) }));

export const getCompatibleProjectRolesForCompanyType = (companyType) => {
  if (!companyType) {
    return PROJECT_PARTICIPATION_ROLES;
  }
  return COMPANY_TYPE_ROLE_COMPATIBILITY[companyType] || PROJECT_PARTICIPATION_ROLES;
};

export const isCompanyTypeCompatibleWithProjectRole = (companyType, projectRole) =>
  getCompatibleProjectRolesForCompanyType(companyType).includes(projectRole);
