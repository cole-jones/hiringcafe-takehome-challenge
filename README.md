This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Requirements

[Node.js](https://nodejs.org/en/download) (v20 or higher recommended, I used v22.11.0)\
[Python 3](https://www.python.org/downloads/) (v3.10 or higher recommended, I used v3.13)

## Getting Started

First, create a file `.env.local` in root.
Then, place OpenAI Key as follows:
```OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx```

A virtual environment is recommended for the python modules. Create one then activate it by running the following commands:
#### Windows:
```
python -m venv venv
.\venv\Scripts\activate
```
#### Linux:
```
python3 -m venv venv
source ./venv/bin/activate
```


Install python dependencies from the root directory by running the following command:\
```pip install -r vector_service/requirements.txt```



Then, install node dependencies listed in `package-lock.json` using package manager like `npm` or `yum`.\
```npm install``` or ```yum install```

Then, run the development server:\
```npm run dev```

The Next.js server will come up first, and the Python server will follow shortly after. You'll know they're both up when you see the following text in the terminal:
```
> hiringcafe-takehome-challenge@0.1.0 dev
> concurrently "npm run next" "npm run vector"

[0] 
[0] > hiringcafe-takehome-challenge@0.1.0 next
[0] > next dev
[0]
[1]
[1] > hiringcafe-takehome-challenge@0.1.0 vector
[1] > cd vector_service && uvicorn server:app --port 8000
[1]
[0] ▲ Next.js 16.1.6 (Turbopack)
[0] - Local:         http://localhost:3000
[0] - Network:       http://10.0.0.185:3000
[0] - Environments: .env.local
[0]
[0] ✓ Starting...
[0] ✓ Ready in 840ms
[0] ○ Compiling / ...
[0]  GET / 200 in 5.4s (compile: 5.3s, render: 91ms)
[1] INFO:     Started server process [19176]
[1] INFO:     Waiting for application startup.
[1] INFO:     Application startup complete.
[1] INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Explanation of Approach

#### How did you process/represent the jobs data?
Looking at the jobs.jsonl file, I quickly realized that the embedded vectors were taking up many thousands of lines. After a bit of research, and asking ChatGPT directly what the most efficient way of having it operate on a large dataset, I settled on Facebook AI Similarity Search. FAISS is a library made by Meta for quickly searching embeddings. I believed that this was a good choice because it was able to leave the files in the project directory, so I didn't have to connect to an external database.

The three sets of vectors were stripped from the job metadata and placed into three files:
* jobs.faiss - Contains the vectors
* jobs_metadata.jsonl - Contains the job metadata
* vector_metadata - Vector indices, used to connect to job metadata

#### How does your search work?
The first thing that is done is that the user's input into the prompt is sent to ChatGPT along with a type schema for a JSON object. This object contains many fields that were stripped from `v5_processed_job_data`, `v5_processed_company_data`, and `v7_processed_job_data`. ChatGPT would then, knowing that it's meant to be searching job data, strip the user's semantic input into these search fields. I would use the model "gpt-4.1-mini", as it was the most token-efficient, cheapest, and best at stripping semantic input (I tried "gpt-4.1-nano", but it seemed to have trouble stripping all of the fields).

For example, if a user enters the prompt `Python developer with mentorship responsibilities, requiring a masters degree, in Beaverton, Oregon, remote or hybrid, minimal or no travel requirement, paid parental leave, making at least $80,000 per year`, ChatGPT will strip that input, rewrite the semantic string to exclude most of what was stripped, and return the following object (nulled fields omitted to save space):
```
{
	"semanticIntent": "python developer with mentorship responsibilities",
	"jobTitles": [ "Python Developer" ]
	"skills": [ "mentorship" ],
	"education": {
		"degreeTypes": [ "Masters" ],
		"required": true
	},
	"compensation": {
		"minSalary": 80000,
		"maxSalary": null,
		"currency": "USD",
		"frequency": "Yearly"
	},
	"location": {
		"countries": [ "United States" ],
		"states": [ "Oregon" ],
		"cities": [ "Beaverton" ],
		"remoteAllowed": true,
		"workplaceType": [ "Remote", "Hybrid"]
	},
	"workArrangement": {
		"travelRequirements": [ "None", "Minimal" ]
	},
	"benefits": {
		"parentalLeave": true,
    ...
	},
  ...
}
```

When the user submits another prompt in order to refine the search, only that sentence is sent to the same endpoint to have its tokens stripped, so it's not re-sending everything that the user has said up to that point. The filter object that's returned is then combined with the cached version. So as the user continues to refine the search, the filter object grows larger, containing the sum of everything they've entered to that point. Additionally, ChatGPT will return recommendations to the user for what they could enter to refine the search.

Finally, this filter object is sent to the Python backend, where it's assembled into a string (FAISS can only accept strings) that has more structure than the semantic user input. ChatGPT is invoked to search the embeddings/vectors in the aforementioned files, oversearching by a factor of 5 (10 desired results, 50 are obtained out of the 100,000 jobs). Those jobs are then sorted by weight, and filtered according to a few things, namely salary, since operating on numbers is easier outside of FAISS (it seemed to have trouble looking for salaries, probably because they're fragmented across different fields in the metadata). After all the filtering, the top 10 weighted jobs are then returned to the front end, where they are displayed to the user.

The token cost of the first call to strip semantic input of course scales with the complexity of the user's input and that of the search filter schema, but typically used `800-1200` tokens. The FAISS search typically used around `90-120` tokens.

#### How do you determine relevance/ranking?
Relevance is determined by FAISS during its search using the vectors that were embedded in the original `jobs.jsonl` file that was provided. It will also look at the three embedded metadata sections as well as the job description to look for matching words, or in the case of boolean values in the embedded metadata, matches on those keys. There's a good amount of trust in this process, as I don't really have a way of knowing if the 10 jobs that were pulled out of the 100,000 really are the 10 best matches, as unfortunately I am not omnipotent. But at least for the metadata that overlaps with the filters, it can be assured that those are working properly.

#### What trade-offs did you make?
The metadata that I'm using to build the query string for FAISS unfortunately does not completely overlap with all of the embedded metadata, as doing so would produce an astronomically large object. In order to try to keep token usage at a manageable amount, it's operating on what I believed to be important fields. Another tradeoff is that I'm only telling it to search for 10 jobs at a time, as increasing that value will increase token usage and the wait time for the user. In order for the application to feel snappy and respond to the user in a reasonable amount of time, these are the sacrifices that had to be made.

#### What queries work well? What's tricky?
It seems to be good at querying a specific job type, like `python developer` or `full-stack web developer`, and as far as I can tell, is good at finding the overlap between the user's requested skills and those listed within the job listing's description. It's very good at filtering for salary ranges, in part due to the fact that it's looking for fields within the embedded metadata. The best queries are ones where the search fields obtained from the stripping of semantic intent directly line up with the embedded metadata, such as `parental_leave: true`, since that's operating on an exact match. It's when it has to start searching the job description that it starts to have trouble.

It has trouble with location, possibly because it's not hooked up to look at the geolocation data, as I was unsure how to deal with it. So any location information is gleaned from the job description. It is also not capable of undoing a search, so if the user says they want remote jobs, but then later says that they only want onsite, the search fields are still going to contain remote jobs because there's no method for removing search fields.

#### What would you improve if you had more time?
I would absolutely add more metadata and post-FAISS filtering. There is an insane amount of embedded metadata that could be used to precisely find a job that has total overlap. However, I am only human, and I didn't have the ability to produce a filtering object that overlaps entirely with the thousands of lines of metadata. That being said, the more fields that are added to that initial semantic strip, the more precise the FAISS search could be, and the more accurate the results. I could also add more post-FAISS filtering to manually filter the list of overfetched jobs for the things that FAISS seems to have more trouble with, such as location. This would require more poking around with FAISS to determine what it's good at finding and what it struggles with, and due to time constraints, I simply worked with what I thought was the most important metadata.

I would also improve the user interface more, as I do like working on the front-end, although this was out of the scope of this project. I ended up settling on something that looked clean, but at its core was fairly simple.
