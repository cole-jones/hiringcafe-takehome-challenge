export const JobFilterSchema = {
  name: "JobFilterTokens",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "semanticIntent",
      "searchSuggestions",
      "jobTitles",
      "skills",
      "experience",
      "education",
      "compensation",
      "location",
      "workArrangement",
      "company",
      "benefits",
      "security",
      "schedule",
      "languages",
      "companyActivities",
      "keywords"
    ],
    properties: {
      semanticIntent: {
        type: "string"
      },

      searchSuggestions: {
        type: "string"
      },

      jobTitles: {
        type: ["array", "null"],
        items: { type: "string" }
      },

      skills: {
        type: ["array", "null"],
        items: { type: "string" }
      },

      experience: {
        type: ["object", "null"],
        additionalProperties: false,
        required: [
          "minYears",
          "maxYears",
          "seniorityLevels",
          "managementRequired"
        ],
        properties: {
          minYears: { type: ["number", "null"] },
          maxYears: { type: ["number", "null"] },
          seniorityLevels: {
            type: ["array", "null"],
            items: {
              type: "string",
              enum: [
                "Internship",
                "Entry Level",
                "Mid Level",
                "Senior Level",
                "Director",
                "Executive"
              ]
            }
          },
          managementRequired: { type: ["boolean", "null"] }
        }
      },

      education: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["degreeTypes", "fieldsOfStudy", "required"],
        properties: {
          degreeTypes: {
            type: ["array", "null"],
            items: {
              type: "string",
              enum: [
                "HighSchool",
                "Associates",
                "Bachelors",
                "Masters",
                "Doctorate"
              ]
            }
          },
          fieldsOfStudy: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          required: { type: ["boolean", "null"] }
        }
      },

      compensation: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["minSalary", "maxSalary", "currency", "frequency"],
        properties: {
          minSalary: { type: ["number", "null"] },
          maxSalary: { type: ["number", "null"] },
          currency: { type: ["string", "null"] },
          frequency: {
            type: ["string", "null"],
            enum: [
              "Hourly",
              "Daily",
              "Weekly",
              "Bi-Weekly",
              "Monthly",
              "Yearly"
            ]
          }
        }
      },

      location: {
        type: ["object", "null"],
        additionalProperties: false,
        required: [
          "continents",
          "countries",
          "states",
          "cities",
          "remoteAllowed",
          "workplaceType"
        ],
        properties: {
          continents: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          countries: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          states: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          cities: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          remoteAllowed: { type: ["boolean", "null"] },
          workplaceType: {
            type: ["array", "null"],
            items: {
              type: "string",
              enum: ["Remote", "Hybrid", "Onsite"]
            }
          }
        }
      },

      workArrangement: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["commitmentTypes", "travelRequirements"],
        properties: {
          commitmentTypes: {
            type: ["array", "null"],
            items: {
              type: "string",
              enum: [
                "Full Time",
                "Part Time",
                "Contract",
                "Temporary",
                "Internship"
              ]
            }
          },
          travelRequirements: {
            type: ["array", "null"],
            items: {
              type: "string",
              enum: [
                "None",
                "Minimal",
                "Moderate",
                "Frequent"
              ]
            }
          }
        }
      },

      company: {
        type: ["object", "null"],
        additionalProperties: false,
        required: [
          "names",
          "industries",
          "organizationTypes",
          "publicCompanyOnly",
          "nonProfitOnly",
          "headquartersCountries"
        ],
        properties: {
          names: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          industries: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          organizationTypes: {
            type: ["array", "null"],
            items: { type: "string" }
          },
          publicCompanyOnly: { type: ["boolean", "null"] },
          nonProfitOnly: { type: ["boolean", "null"] },
          headquartersCountries: {
            type: ["array", "null"],
            items: { type: "string" }
          }
        }
      },

      benefits: {
        type: ["object", "null"],
        additionalProperties: false,
        required: [
          "visaSponsorship",
          "relocationAssistance",
          "retirementPlan",
          "tuitionReimbursement",
          "parentalLeave",
          "fourDayWorkWeek",
          "fairChance",
          "militaryVeterans"
        ],
        properties: {
          visaSponsorship: { type: ["boolean", "null"] },
          relocationAssistance: { type: ["boolean", "null"] },
          retirementPlan: { type: ["boolean", "null"] },
          tuitionReimbursement: { type: ["boolean", "null"] },
          parentalLeave: { type: ["boolean", "null"] },
          fourDayWorkWeek: { type: ["boolean", "null"] },
          fairChance: { type: ["boolean", "null"] },
          militaryVeterans: { type: ["boolean", "null"] }
        }
      },

      security: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["clearanceRequired"],
        properties: {
          clearanceRequired: {
            type: ["array", "null"],
            items: { type: "string" }
          }
        }
      },

      schedule: {
        type: ["object", "null"],
        additionalProperties: false,
        required: [
          "weekendRequired",
          "holidayRequired",
          "overtimeRequired",
          "shiftTypes"
        ],
        properties: {
          weekendRequired: { type: ["boolean", "null"] },
          holidayRequired: { type: ["boolean", "null"] },
          overtimeRequired: { type: ["boolean", "null"] },
          shiftTypes: {
            type: ["array", "null"],
            items: { type: "string" }
          }
        }
      },

      languages: {
        type: ["array", "null"],
        items: { type: "string" }
      },

      companyActivities: {
        type: ["array", "null"],
        items: { type: "string" }
      },

      keywords: {
        type: ["array", "null"],
        items: { type: "string" }
      }
    }
  }
};
