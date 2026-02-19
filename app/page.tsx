"use client";

import { SyntheticEvent, useState, useEffect, useRef, Fragment } from "react";
import { JobFilterTokens } from "@/types/job_filters";
import parse from "html-react-parser";
import { AIResponse } from "./api/extract_semantic_query/route";
import { Modal } from "./modal";
import "./styles/page.css";

export default function Home() {
  // Used to forcibly scroll the conversation
  const endRef = useRef<HTMLDivElement>(null);

  // Text in the text input, token cost of the conversation, loading state, error state
  const [prompt, setPrompt] = useState<string>("");
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");

  // Modal controls for viewing jobs returned from ChatGPT
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<any | null>(null);

  // Hold the search filters obtained from parsing semantic user input
  const [jobSearchFilters, setJobSearchFilters] = useState<JobFilterTokens | null>(null);

  // Hold what the user inputted and what ChatGPT outputted
  const [userInput, setUserInput] = useState<string[]>([]);
  const [aiJobsOutput, setAiJobsOutput] = useState<string[]>([]);
  const [aiSearchSuggestions, setAiSearchSuggestions] = useState<string[]>([]);

  // When the user enters a prompt or when ChatGPT responds, scroll the content into view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userInput, aiJobsOutput]);

  // Set all states back to their initial values, except for tokenCount
  const reset = () => {
    setError(false);
    setErrorText("");
    setPrompt("");
    setLoading(false);
    setJobSearchFilters(null);
    setUserInput([]);
    setAiJobsOutput([]);
    setAiSearchSuggestions([]);
  };

  // Open the modal. Indices are used to index the state variables that hold ChatGPT's responses
  const openModal = (chatResponseIndex: number, jobIndex: number) => {
    const jobsJson = JSON.parse(aiJobsOutput[chatResponseIndex]);

    setModalContent(jobsJson[jobIndex].job);
    setModalOpen(true);
  };

  // Close the modal, clearing the content
  const closeModal = () => {
    setModalContent(null);
    setModalOpen(false);
  };

  // Merge newly-obtained filters with existing filters, overwriting primitives
  // and concatenating arrays and the semanticIntent string
  const mergeJobFilters = (a: JobFilterTokens, b: JobFilterTokens): JobFilterTokens => {
    const result: JobFilterTokens = { ...a };

    for (const key in b) {
      const valA = a[key as keyof JobFilterTokens];
      const valB = b[key as keyof JobFilterTokens];

      // Skip undefined or null in b
      if (valB !== undefined && valB !== null) {
        // Special handling for semanticIntent: concatenate
        if (key === "semanticIntent") {
          const parts: string[] = [];
          if (valA && valA.trim() !== "") parts.push(valA);
          if (valB && valB.trim() !== "") parts.push(valB);
          result.semanticIntent = parts.join(", ");
          continue;
        }

        // Arrays: merge and deduplicate
        if (Array.isArray(valA) || Array.isArray(valB)) {
          const arrA = Array.isArray(valA) ? valA : [];
          const arrB = Array.isArray(valB) ? valB : [];
          result[key as keyof JobFilterTokens] = Array.from(new Set([...arrA, ...arrB])) as any;
          continue;
        }

        // Nested objects: merge recursively
        if (
          valA &&
          typeof valA === "object" &&
          !Array.isArray(valA) &&
          typeof valB === "object" &&
          !Array.isArray(valB)
        ) {
          result[key as keyof JobFilterTokens] = mergeJobFilters(
            valA as any,
            valB as any
          ) as any;
          continue;
        }

        // Primitive: overwrite
        result[key as keyof JobFilterTokens] = valB as any;
      }
    }

    return result;
  };

  // When the user submits their prompt, first send it to the /extract_semantic_query endpoint
  // and get back a list of filters. Then send this list of filters to the /search endpoint,
  // where they are then used to query FAISS for jobs matching the user's input
  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setPrompt("");

    // Capture the user's input
    setUserInput([...userInput, prompt]);

    // Keep track of the number of tokens that have been used this session
    let tokens_used = 0;

    try {
      // Extract filters from user's semantic prompt
      const extract_semantic_query_response = await fetch("/api/extract_semantic_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt })
      });
      
      if (extract_semantic_query_response.status !== 200)
        throw new Error(`${extract_semantic_query_response.status} ${extract_semantic_query_response.statusText} | Error to extract semantic query. Maybe you entered a bad string?`);
      
      const extract_semantic_query_data = (await extract_semantic_query_response.json()) as AIResponse;
      let filters = JSON.parse(extract_semantic_query_data.result ?? "");

      // Add number of tokens used to running total
      if (extract_semantic_query_data.token_usage?.total_tokens)
        tokens_used += extract_semantic_query_data.token_usage?.total_tokens;

      // Save the job suggestions, remove them from saved filters
      if (filters?.searchSuggestions) {
        setAiSearchSuggestions([...aiSearchSuggestions, filters.searchSuggestions]);
        delete filters.searchSuggestions;
      }

      // Search refinement doesn't pass the whole prompt to extract_semantic_query, just what the user entered at that time.
      // If this is not the first search, it means that semantics were already extracted, so the new results should be
      // combined with the existing ones before being passed to the FAISS search.
      if (jobSearchFilters)
        filters = mergeJobFilters(jobSearchFilters, filters);

      // Save the search filters so they can be reused later
      setJobSearchFilters(filters);

      // Query FAISS using modified semantic prompt with filters removed and placed into their own object
      const faiss_search_response = await fetch("api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters)
      });

      if (faiss_search_response.status !== 200)
        throw new Error(`${extract_semantic_query_response.status} ${extract_semantic_query_response.statusText} | Error querying FAISS file. Please make a new chat and try again.`);

      const faiss_search_data = (await faiss_search_response.json());
      if (faiss_search_data.error || faiss_search_data.result === undefined)
        throw new Error("Error querying FAISS file, no response. Perhaps it was a bad user query? Please make a new chat and try again.")

      // Capture ChatGPT's output
      setAiJobsOutput([...aiJobsOutput, faiss_search_data.result]);

      // Add number of tokens used to running total
      if (faiss_search_data.tokens_used)
        tokens_used += faiss_search_data.tokens_used;

      setTokenCount(prevCount => prevCount + tokens_used);
    } catch (err) {
      console.error(err);
      setError(true);
      setErrorText(err as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mainContainer">
      <div className="contentContainer">
        <div className="conversationScrollbox">
          {error === true ?
            <div>Error: {errorText}</div>
            :
            <div className="conversationContainer" style={{ justifyContent: userInput.length > 0 ? 'flex-end' : 'center' }}>
              {userInput.length > 0 ?
                <>
                  {userInput.map((input, conversationIndex: number) => {
                    let jobMatches = null
                    let searchSuggestions = null
                    if (aiJobsOutput.length >= conversationIndex + 1)
                      jobMatches = JSON.parse(aiJobsOutput[conversationIndex])
                    if (aiSearchSuggestions.length >= conversationIndex + 1)
                      searchSuggestions = aiSearchSuggestions[conversationIndex];


                    return (
                      <Fragment key={`call-response-${conversationIndex}`}>
                        <div key={`user-${conversationIndex}`} className="conversationItemUser">
                          <div className="userMessage">
                            {input}
                          </div>
                        </div>
                        {jobMatches ?
                          <div key={`ai-${conversationIndex}`} className="conversationItemAi">
                            <div className="aiMessage">
                              {jobMatches.map((jobMatch: any, jobIndex: number) => {
                                let salaryRange = "No salary listed"
                                const salaryMin = jobMatch.job.job_information?.salary?.yearly_min_compensation ?? null;
                                const salaryMax = jobMatch.job.job_information?.salary?.yearly_max_compensation ?? null;
                                if (salaryMin)
                                  if (salaryMax)
                                    salaryRange = `$${salaryMin.toLocaleString('en-US')}${salaryMin < 500 ? "/hr" : ""} - $${salaryMax.toLocaleString('en-US')}${salaryMin < 500 ? "/hr" : ""}`
                                  else
                                    salaryRange = `$${salaryMin.toLocaleString('en-US')}${salaryMin < 500 ? "/hr" : ""}`
                                else if (salaryMax)
                                  salaryRange = `$${salaryMax.toLocaleString('en-US')}${salaryMin < 500 ? "/hr" : ""}`

                                return (
                                  <div
                                    key={`ai-${conversationIndex}-${jobMatch.job.id}`}
                                    className="jobCard"
                                    onClick={() => openModal(conversationIndex, jobIndex)}
                                  >
                                    <div>{jobMatch.job.job_information.company_info.name}</div>
                                    <div>{jobMatch.job.job_information.title}</div>
                                    <div>{salaryRange}</div>
                                  </div>
                                )
                              })}
                              <div className="searchSuggestions">
                                {searchSuggestions}
                              </div>
                            </div>
                          </div>
                          :
                          null
                        }
                      </Fragment>
                      )
                  })}
                  <div ref={endRef} />
                </>
                :
                <div className="splashScreen">
                  <div>AI Job Search</div>
                  <br />
                  <div>Search 100,000 jobs with the power of OpenAI&apos;s ChatGPT</div>
                </div>
              }
            </div>
          }
        </div>

        {/* Modal for presenting job information. */}
        <Modal open={modalOpen} onClose={closeModal}>
          {modalContent ?
            <div className="modalContainer">
              <div className="modalTitle">
                {modalContent.job_information.title}
              </div>
              <div className="modalCompany">
                @ {modalContent.job_information.company_info.name ?? "Missing Name"}
              </div>
              <div className="modalSalary">
                {modalContent.job_information.salary.yearly_min_compensation !== null ?
                  <>
                    ${modalContent.job_information.salary.yearly_min_compensation.toLocaleString('en-US')}{modalContent.job_information.salary.yearly_max_compensation !== null ? " to " : ""}
                  </>
                  :
                  null
                }
                {modalContent.job_information.salary.yearly_max_compensation !== null ?
                  <>
                    ${modalContent.job_information.salary.yearly_max_compensation.toLocaleString('en-US')}
                  </>
                  :
                  null
                }
                {modalContent.job_information.salary.yearly_min_compensation === null && modalContent.job_information.salary.yearly_max_compensation === null ?
                  "No salary listed"
                  :
                  null
                }
              </div>
              <div className="modalBodyScrollbox">
                <div className="modalBodyHeader">
                  Job Description:
                </div>
                {parse(modalContent.job_information.description)}
              </div>
              <a href={modalContent.apply_url} target="_blank" rel="noopener noreferrer">
                <div className="modalApplyButtonContainer">
                  <span className="modalApplyButton">
                    Apply to this position
                  </span>
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <use href="/external-link.svg" />
                  </svg>
                </div>
              </a>
            </div>
            :
            null
          }
        </Modal>

        <div className="footerContainer">
          <div className="promptContainer">
            <div className="promptHeader">
              <div>AI-Powered Job Search</div>
              <div>{tokenCount > 0 ? `${tokenCount.toLocaleString('en-US')} Tokens Used` : ""}</div>
            </div>
            <form onSubmit={handleSubmit} className="promptForm">
              <button
                className="promptFormResetButton"
                type="reset"
                disabled={userInput.length === 0}
                onClick={reset}
              >
                New Chat
              </button>
              <input
                className="promptFormInput"
                type="text"
                placeholder="What are you looking for in your next job?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                className="promptFormSubmitButton"
                type="submit"
                disabled={loading || !prompt.trim()}
              >
                {loading ? "Thinking…" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
