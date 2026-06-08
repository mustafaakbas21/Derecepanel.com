export type CoachProfileDto = {
  role: "coach";
  coachId: string;
  username: string;
  displayName: string;
  loginEmail: string;
  phone?: string;
  specialty?: string;
  status: string;
};

export type StudentProfileDto = {
  role: "student";
  ogrenciId: string;
  coachId: string;
  username: string;
  loginEmail: string;
  name: string;
  studentCode: string;
  sinifBranch: string;
  alan: string;
  goal: string;
  targetUniversity?: string;
  targetDepartment?: string;
  status: string;
  kayitDate: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  city?: string;
  ilce?: string;
  address?: string;
  parent: string;
  parentPhone: string;
  parentEmail?: string;
  parentRelation?: string;
  emergencyNotes?: string;
  counselorNote?: string;
  notes?: string;
};

export type PanelProfileDto = CoachProfileDto | StudentProfileDto;
