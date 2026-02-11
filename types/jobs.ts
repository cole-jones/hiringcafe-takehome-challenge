export interface Job {
  "id": string;
  "apply_url": string;
  "job_information": JobInformation;
  "v5_processed_job_data": v5ProcessedJobData;
  "v5_processed_company_data": v5ProcessedCompanyData;
  "v7_processed_job_data": v7ProcessedJobData;
  "_geoloc": GeographicCoordinate;
}

type JobInformation = {
  "title": string;
  "job_title_raw": string;
  "description": string;
  "stripped_description": string;
  "company_info": { name: string };
}

type v5ProcessedJobData = {
  "core_job_title": string | null;
  "requirements_summary": string | null;
  "technical_tools": string[] | null;
  "technical_tools_synonyms": string[] | null;
  "licenses_or_certifications": string[] | null;
  "licenses_or_certifications_synonyms": string[] | null;
  "associates_degree_requirement": string | null;
  "associates_degree_fields_of_study": string[] | null;
  "bachelors_degree_requirement": string | null;
  "bachelors_degree_fields_of_study": string[] | null;
  "masters_degree_requirement": string | null;
  "masters_degree_fields_of_study": string[] | null;
  "doctorate_degree_requirement": string | null;
  "doctorate_degree_fields_of_study": string[] | null;
  "licenses_or_certifications_not_mentioned": boolean | null;
  "min_industry_and_role_yoe": number | null;
  "401k_matching": boolean | null;
  "is_min_industry_and_role_yoe_not_mentioned": boolean | null;
  "min_management_and_leadership_yoe": number | null;
  "is_min_management_and_leadership_yoe_not_mentioned": boolean | null;
  "job_category": string | null;
  "role_activities": string[] | null;
  "commitment": string[] | null;
  "role_type": string | null;
  "seniority_level": string | null;
  "workplace_countries": string[] | null;
  "boundless_workplace_states": string[] | null;
  "boundless_workplace_countries": string[] | null;
  "boundless_workplace_continents": string[] | null;
  "workplace_continents": string[] | null;
  "workplace_states": string[] | null;
  "workplace_cities": string[] | null;
  "workplace_counties": string[] | null;
  "workplace_type": string | null;
  "workplace_physical_environment": string | null;
  "oral_communication_level": string | null;
  "physical_labor_intensity": string | null;
  "physical_position": string | null;
  "computer_usage": string | null;
  "cognitive_demand": string | null;
  "air_travel_requirement": string | null;
  "land_travel_requirement": string | null;
  "morning_shift_work": string | null;
  "evening_shift_work": string | null;
  "overnight_work": string | null;
  "formatted_workplace_location": string | null;
  "on_call_requirement": string | null;
  "weekend_availability_required": boolean | null;
  "holiday_availability_required": boolean | null;
  "generous_paid_time_off": boolean | null;
  "four_day_work_week": boolean | null;
  "overtime_required": boolean | null;
  "is_workplace_worldwide_ok": boolean | null;
  "language_requirements": string[] | null;
  "num_language_requirements": number | null;
  "number_of_workplace_cities": number | null;
  "number_of_workplace_counties": number | null;
  "number_of_workplace_states": number | null;
  "number_of_workplace_countries": number | null;
  "number_of_workplace_continents": number | null;
  "yearly_max_compensation": number | null;
  "yearly_min_compensation": number | null;
  "monthly_max_compensation": number | null;
  "monthly_min_compensation": number | null;
  "weekly_max_compensation": number | null;
  "weekly_min_compensation": number | null;
  "hourly_max_compensation": number | null;
  "hourly_min_compensation": number | null;
  "bi-weekly_min_compensation": number | null;
  "bi-weekly_max_compensation": number | null;
  "daily_min_compensation": number | null;
  "daily_max_compensation": number | null;
  "estimated_publish_date": string | null;
  "estimated_publish_date_millis": number | null;
  "fair_chance": boolean | null;
  "visa_sponsorship": boolean | null;
  "relocation_assistance": boolean | null;
  "military_veterans": boolean | null;
  "tuition_reimbursement": boolean | null;
  "retirement_plan": boolean | null;
  "generous_parental_leave": boolean | null;
  "is_high_school_required": boolean | null;
  "is_driver_license_required": boolean | null;
  "is_compensation_transparent": boolean | null;
  "listed_compensation_currency": string | null;
  "listed_compensation_frequency": string | null;
  "security_clearance": string | null;
  "position_employer_type": string | null;
  "company_name": string | null;
  "company_website": string | null;
  "company_sector_and_industry": string | null;
  "company_activities": string[] | null;
  "company_tagline": string | null;
  "associates_degree_fields_of_study_synonyms": string[] | null;
  "bachelors_degree_fields_of_study_synonyms": string[] | null;
  "masters_degree_fields_of_study_synonyms": string[] | null;
  "doctorate_degree_fields_of_study_synonyms": string[] | null;
  "company_activities_synonyms": string[] | null | null;
}

type v5ProcessedCompanyData = {
  "name": string;
  "image_url": string;
  "subsidiaries": string[];
  "parent_company": string | null;
  "website": string;
  "linkedin_url": string;
  "industries": string[];
  "activities": string[];
  "tagline": string;
  "is_non_profit": boolean;
  "is_public_company": boolean;
  "is_dissolved": boolean;
  "is_acquired": boolean;
  "num_employees": number;
  "year_founded": number;
  "headquarters_country": string;
  "total_funding_amount": number | null;
  "total_funding_currency": string | null;
  "latest_investment_amount": number | null;
  "latest_investment_currency": string | null;
  "latest_investment_year": number | null;
  "latest_investment_series": string | null;
  "investors": string[];
  "stock_exchange": string;
  "stock_symbol": string;
  "latest_revenue": number;
  "latest_revenue_currency": string;
  "latest_revenue_year": number;
}

type v7ProcessedJobData = {
  "estimated_post_date": string;
  "schedule_requirements": {
    "shifts": {
      "on_call_requirement": string;
      "holiday_availability_required": boolean;
      "weekend_availability_required": boolean;
      "overtime_required": boolean;
      "shift_types_available": string[];
    };
    "travel": {
      "land_travel_requirement": string;
      "air_travel_requirement": string;
    };
  };
  "embedding_text_explicit": string;
  "education": {
    "explicit": EducationExplicit[];
    "inferred": EducationInferred[];
  };
  "work_arrangement": {
    "workplace_type": string;
    "individual_contributor_or_people_manager": string;
    "commitment": string[];
    "workplace_locations": WorkplaceLocation[];
  };
  "original_job_description_language": string;
  "credentials": {
    "explicit": string[];
    "inferred": string[];
  };
  "diversity_hiring": {
    "military_veterans": boolean;
    "fair_chance": boolean;
  };
  "embedding_inferred_vector": number[];
  "geo_locations": string[];
  "embedding_text_company": string;
  "skills": {
    "explicit": ExpandedTerms[];
    "inferred": ExpandedTerms[];
  };
  "company_profile": {
    "website": string;
    "activities": string[];
    "name": string;
    "organization_types": string[];
    "tagline": string;
    "industry": string;
  };
  "job_titles": {
    "explicit": ExpandedTerms;
    "inferred": ExpandedTerms[];
  };
  "embedding_company_vector": number[];
  "compensation_and_benefits": {
    "benefits": {
      "tuition_reimbursement": boolean;
      "retirement_plan": boolean;
      "visa_sponsorship": boolean;
      "relocation_assistance": boolean;
      "generous_paid_time_off": boolean;
      "generous_parental_leave": boolean;
      "401k_matching": boolean;
      "four_day_work_week": boolean;
    };
    "salary": {
      "high": number;
      "low": number;
      "currency": string;
      "frequency": string;
    }
  };
  "embedding_text_inferred": string;
  "processed_at": string;
  "embedding_explicit_vector": number[];
  "experience_requirements": {
    "min_years_breakdown": {
      "industry_and_role_yoe": number;
      "management_and_leadership_yoe": number;
    };
    "security_clearance": string;
    "seniority_level": string;
    "language_requirements": string[];
    "is_driver_license_required": boolean;
    "requirements_summary": string;
  };
}

type EducationExplicit = {
  "fields_of_study": string[];
  "degree_type": string;
  "requirement": string;
}

type EducationInferred = {
  "fields_of_study": string[];
  "degree_type": string;
}

type GeographicCoordinate = {
  "lon": number;
  "lat": number;
}

type WorkplaceLocation = {
  "continent": string;
  "country_code": string;
  "city": string;
  "kind": string;
  "county": string;
  "geographic_coordinates": GeographicCoordinate
  "state": string;
}

type ExpandedTerms = {
  "expanded_terms": string[];
  "value": string;
}