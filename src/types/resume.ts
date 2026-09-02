export type ResumeBullet = {
  id: string;
  text: string;
};

export type PersonalInfo = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
};

export type Experience = {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: ResumeBullet[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  bullets: ResumeBullet[];
  startDate?: string;
  endDate?: string;
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
};

export type SkillGroup = {
  id: string;
  category: string;
  skills: string[];
};

export type Language = {
  id: string;
  name: string;
  proficiency: string;
};

export type ResumeData = {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  skills: SkillGroup[];
  languages: Language[];
};
