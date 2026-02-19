export type SeniorityLevel =
  | "Internship"
  | "Entry Level"
  | "Mid Level"
  | "Senior Level"
  | "Director"
  | "Executive";

export type DegreeType =
  | "HighSchool"
  | "Associates"
  | "Bachelors"
  | "Masters"
  | "Doctorate";

export type CompensationFrequency =
  | "Hourly"
  | "Daily"
  | "Weekly"
  | "Bi-Weekly"
  | "Monthly"
  | "Yearly";

export type WorkplaceType =
  | "Remote"
  | "Hybrid"
  | "Onsite";

export type CommitmentType =
  | "Full Time"
  | "Part Time"
  | "Contract"
  | "Temporary"
  | "Internship";

export type TravelRequirementLevel =
  | "None"
  | "Minimal"
  | "Moderate"
  | "Frequent";

export interface JobFilterTokens {
  semanticIntent: string;
  searchSuggestions?: string;
  jobTitles?: string[];
  skills?: string[];
  experience?: {
    minYears?: number;
    maxYears?: number;
    seniorityLevels?: SeniorityLevel[];
    managementRequired?: boolean;
  };
  education?: {
    degreeTypes?: DegreeType[];
    fieldsOfStudy?: string[];
    required?: boolean;
  };
  compensation?: {
    minSalary?: number;
    maxSalary?: number;
    currency?: string; // ISO 4217
    frequency?: CompensationFrequency;
  };
  location?: {
    continents?: string[];
    countries?: string[];       // ISO country codes
    states?: string[];
    cities?: string[];
    remoteAllowed?: boolean;
    workplaceType?: WorkplaceType[];
  };
  workArrangement?: {
    commitmentTypes?: CommitmentType[];
    travelRequirements?: TravelRequirementLevel[];
  };
  company?: {
    names?: string[];
    industries?: string[];
    organizationTypes?: string[];
    publicCompanyOnly?: boolean;
    nonProfitOnly?: boolean;
    headquartersCountries?: string[];
  };
  benefits?: {
    visaSponsorship?: boolean;
    relocationAssistance?: boolean;
    retirementPlan?: boolean;
    tuitionReimbursement?: boolean;
    parentalLeave?: boolean;
    fourDayWorkWeek?: boolean;
    fairChance?: boolean;
    militaryVeterans?: boolean;
  };
  security?: {
    clearanceRequired?: string[]; // e.g. ["Secret", "Top Secret"]
  };
  schedule?: {
    weekendRequired?: boolean;
    holidayRequired?: boolean;
    overtimeRequired?: boolean;
    shiftTypes?: string[];
  };
  languages?: string[];
  companyActivities?: string[];
  // --- Freeform fallback tokens (for hybrid filtering) ---
  keywords?: string[];
}