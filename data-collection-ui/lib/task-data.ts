export interface Task {
  id: string;
  label: string;
  website: string;
  averageDuration: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  tasks: Task[];
}

export const taskCategories: TaskCategory[] = [
  {
    id: "ecommerce",
    name: "E-commerce & Online Shopping",
    tasks: [
      {
        id: "ecom-1",
        label:
          "Browse and filter products: Search for a specific product on Amazon and apply filters (e.g. price range, 4+ star rating) to narrow the results.",
        website: "amazon.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ecom-2",
        label:
          "Read product details: Navigate to an Amazon product page and read the customer reviews and Q&A section for that item.",
        website: "amazon.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ecom-3",
        label:
          "Add to cart and simulate checkout: Add an item to the cart on an e-commerce site (e.g. Amazon) and proceed to the checkout page (stop before actual payment).",
        website: "amazon.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ecom-4",
        label:
          "Check order status: Log in to an Amazon account and navigate to the orders page to check the shipping status of a recent purchase.",
        website: "amazon.com",
        averageDuration: "3-5 min",
      },
      {
        id: "ecom-5",
        label:
          "Place a bid on an auction: Log into an eBay account and place a bid on an active auction listing for a product.",
        website: "ebay.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ecom-6",
        label:
          "Interact with a marketplace seller: On Etsy, find a handmade item and send a message to the seller asking about customization or shipping options.",
        website: "etsy.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ecom-7",
        label:
          "Compare prices across sites: Use a price-comparison website or Google Shopping to compare prices for a specific model of laptop across multiple retailers.",
        website: "google.com/shopping",
        averageDuration: "10-15 min",
      },
      {
        id: "ecom-8",
        label:
          "Online grocery shopping: Go to an online grocery store (e.g. Walmart Grocery or Instacart), search for three items (e.g. milk, bread, eggs), add them to the cart, and view the cart.",
        website: "walmart.com",
        averageDuration: "10-15 min",
      },
      {
        id: "ecom-9",
        label:
          "Apply a coupon code: During checkout on an e-commerce site, enter a promo code (e.g. a 10% off coupon) and verify that the discount is applied to the order total.",
        website: "any-ecommerce.com",
        averageDuration: "3-5 min",
      },
      {
        id: "ecom-10",
        label:
          "Submit a product review: After purchasing an item, navigate to the product page and submit a star rating and written review of the product on the site (e.g. write a review on Amazon for a bought item).",
        website: "amazon.com",
        averageDuration: "5-10 min",
      },
    ],
  },
  {
    id: "social",
    name: "Social Media & Online Communities",
    tasks: [
      {
        id: "social-1",
        label:
          "Upvote content on Reddit: Log into a Reddit account, navigate to a chosen subreddit, and upvote a specific post that you found interesting.",
        website: "reddit.com",
        averageDuration: "2-3 min",
      },
      {
        id: "social-2",
        label:
          "Comment on a discussion: Find a popular thread on Reddit and post a comment in response to one of the top comments, then refresh to see it appear.",
        website: "reddit.com",
        averageDuration: "3-5 min",
      },
      {
        id: "social-3",
        label:
          "Send a private message on Facebook: Log into Facebook, go to Messenger, and send a direct message to a friend saying hello or sharing a quick update.",
        website: "facebook.com",
        averageDuration: "2-3 min",
      },
      {
        id: "social-4",
        label:
          "Post on Instagram (web): From an Instagram web account, create a new post by uploading a photo and adding a caption, then share it to your feed.",
        website: "instagram.com",
        averageDuration: "3-5 min",
      },
      {
        id: "social-5",
        label:
          "Tweet and follow: Log into Twitter (X) and publish a new tweet (e.g. a status update of one sentence), then search for a specific account and follow that user.",
        website: "twitter.com",
        averageDuration: "2-3 min",
      },
      {
        id: "social-6",
        label:
          "Search and like on Twitter: Use the Twitter search bar to find tweets with a specific hashtag (e.g. #AI), and like one of the recent tweets in the results.",
        website: "twitter.com",
        averageDuration: "2-3 min",
      },
      {
        id: "social-7",
        label:
          "Update LinkedIn status: Log into LinkedIn and share an update on your feed (e.g. a link to an interesting article with a brief comment).",
        website: "linkedin.com",
        averageDuration: "3-5 min",
      },
      {
        id: "social-8",
        label:
          "Join and post in a group: On Facebook, join a public group related to a hobby or topic (if not already a member), then create a new post in that group introducing yourself or asking a question.",
        website: "facebook.com",
        averageDuration: "3-5 min",
      },
      {
        id: "social-9",
        label:
          "Watch and like a TikTok: Navigate to TikTok’s website (or app if accessible via web) and search for a particular user or hashtag, watch one video, and click the like (heart) button on it.",
        website: "tiktok.com",
        averageDuration: "2-3 min",
      },
      {
        id: "social-10",
        label:
          "Pin an item on Pinterest: Log into Pinterest, search for “home office setup” (for example), select one image Pin you like, and save (pin) it to one of your boards.",
        website: "pinterest.com",
        averageDuration: "2-3 min",
      },
    ],
  },
  {
    id: "job",
    name: "Job Search & Application",
    tasks: [
      {
        id: "job-1",
        label:
          "Job search on LinkedIn: Log into LinkedIn, go to the Jobs section, and search for “Software Engineer” jobs in “New York” with the filter for “Remote” enabled. Scroll through results.",
        website: "linkedin.com",
        averageDuration: "5-10 min",
      },
      {
        id: "job-2",
        label:
          "Apply on Indeed: On Indeed.com, search for a “Marketing Manager” job, click on one result, and go through the process of filling out the application form (enter dummy information up to the point of submission).",
        website: "indeed.com",
        averageDuration: "5-10 min",
      },
      {
        id: "job-3",
        label:
          "Upload resume to company portal: Visit a company’s careers page (e.g. a Fortune 500 company site), navigate to their job application portal, and upload a resume file and cover letter for a sample position (stop before final submit if needed).",
        website: "company-portal.com",
        averageDuration: "10-15 min",
      },
      {
        id: "job-4",
        label:
          "LinkedIn InMail to recruiter: Using LinkedIn, find a recruiter’s profile at a target company and send a brief polite InMail message expressing interest in opportunities (requires a premium account or connection, but writing the message is the task).",
        website: "linkedin.com",
        averageDuration: "5-10 min",
      },
      {
        id: "job-5",
        label:
          "Check application status: Log into a job application tracking portal (e.g. Taleo or Greenhouse used by an employer) to check the status of a submitted job application (e.g. see if it’s marked “Under Review”).",
        website: "taleo.com",
        averageDuration: "3-5 min",
      },
      {
        id: "job-6",
        label:
          "Set up job alert: On Indeed or LinkedIn Jobs, set an email job alert for “Data Scientist” positions in your area – selecting frequency and criteria – and save the alert.",
        website: "indeed.com",
        averageDuration: "3-5 min",
      },
      {
        id: "job-7",
        label:
          "Search company reviews: Go to Glassdoor, search for a specific company, and navigate to the reviews section to read what employees have posted about working there.",
        website: "glassdoor.com",
        averageDuration: "5-10 min",
      },
      {
        id: "job-8",
        label:
          "Fill profile on job site: Create a profile on a job site like Monster or LinkedIn (if not already) – fill in details like work experience, education, and skills, and save the profile information.",
        website: "monster.com",
        averageDuration: "10-15 min",
      },
      {
        id: "job-9",
        label:
          "Take an online skills test: On LinkedIn or another job platform, find a skills assessment (for example, a quiz on Excel or Python) and start the test to see a few questions (you can stop before finishing).",
        website: "linkedin.com",
        averageDuration: "5-10 min",
      },
      {
        id: "job-10",
        label:
          "Use a resume builder tool: Navigate to a resume-building web app (e.g. resume.com or NovoResume), choose a template, input sample data into a couple of fields (name, work history), and preview the generated resume.",
        website: "resume.com",
        averageDuration: "10-15 min",
      },
    ],
  },
  {
    id: "saas",
    name: "SaaS & Business Tools",
    tasks: [
      {
        id: "saas-1",
        label:
          "Post a message in Slack: Log into a Slack workspace via the web client, navigate to a specific channel, and post a message (“Hello team, this is a test message”) in that channel.",
        website: "slack.com",
        averageDuration: "2-3 min",
      },
      {
        id: "saas-2",
        label:
          "Manage a task in Trello: Open Trello, create a new card on a project board in the “To Do” list named “Draft report”, then drag that card to the “Done” list to simulate completing the task.",
        website: "trello.com",
        averageDuration: "3-5 min",
      },
      {
        id: "saas-3",
        label:
          "Add a CRM contact in Salesforce: Log into Salesforce (or a CRM demo environment), navigate to the Contacts (or Leads) section, and fill out the form to add a new contact with name, email, and phone number, then save it.",
        website: "salesforce.com",
        averageDuration: "5-10 min",
      },
      {
        id: "saas-4",
        label:
          "Open a ticket in Jira: Using Jira’s web interface, create a new issue/ticket in a project (e.g. issue type “Bug” with a summary and description), assign it to someone (or yourself), and mark its priority.",
        website: "jira.com",
        averageDuration: "5-10 min",
      },
      {
        id: "saas-5",
        label:
          "Create a GitHub issue: On GitHub via web, go to the “Issues” tab of a repository and open a new issue – write a title and a brief description of a bug or feature request, then submit it.",
        website: "github.com",
        averageDuration: "3-5 min",
      },
      {
        id: "saas-6",
        label:
          "Schedule a Zoom meeting: Log in to the Zoom web portal, schedule a new meeting for tomorrow (set time and topic), and copy the invitation link/details once the meeting is created.",
        website: "zoom.us",
        averageDuration: "3-5 min",
      },
      {
        id: "saas-7",
        label:
          "Design in Canva: On Canva’s website, create a new design (e.g. an Instagram post template), add some text or an image element to the canvas, then save the design or download a preview image.",
        website: "canva.com",
        averageDuration: "5-10 min",
      },
      {
        id: "saas-8",
        label:
          "Upload and share from Dropbox: Log into Dropbox web, upload a small file (e.g. a PDF or image) from your computer, then generate a shareable link for that file.",
        website: "dropbox.com",
        averageDuration: "3-5 min",
      },
      {
        id: "saas-9",
        label:
          "Compose a document in Notion: Open Notion.so, create a new page in a workspace, add a few lines of text with basic formatting (bullet list, heading), and share the page with a link (view access).",
        website: "notion.so",
        averageDuration: "3-5 min",
      },
      {
        id: "saas-10",
        label:
          "Sign a document in DocuSign: Use the DocuSign web app (or a demo if available) to upload a sample PDF, add a signature or initials in the designated area, and complete the signing process electronically.",
        website: "docusign.com",
        averageDuration: "5-10 min",
      },
    ],
  },
  {
    id: "support",
    name: "Customer Service & Support",
    tasks: [
      {
        id: "support-1",
        label:
          "Initiate live chat support: Go to an e-commerce website that offers live chat support (or an ISP/mobile provider site), click on the chat icon, and start a live chat with customer service (e.g. type “Hello, I need help with my order”).",
        website: "amazon.com",
        averageDuration: "2-3 min",
      },
      {
        id: "support-2",
        label:
          "Submit a support ticket: Navigate to a company’s “Contact Us” or support portal (for example, a web hosting company or software provider), fill out the support request form with a subject and description of an issue, and submit a ticket.",
        website: "zendesk.com",
        averageDuration: "5-10 min",
      },
      {
        id: "support-3",
        label:
          "Track a support ticket: Log into a support center (like Zendesk or Freshdesk customer portal) using provided credentials, and check the status or response on a previously submitted support ticket.",
        website: "zendesk.com",
        averageDuration: "3-5 min",
      },
      {
        id: "support-4",
        label:
          "Use an AI chatbot assistant: On a banking or retail site that has an AI chatbot, ask the chatbot a question (e.g. “Where is my order?” or “What’s your return policy?”) and observe the automated answer.",
        website: "bank-chatbot.com",
        averageDuration: "2-3 min",
      },
      {
        id: "support-5",
        label:
          "Request a refund online: Through an online order management system (Amazon, for instance), select an item you purchased, go through the return/refund process by selecting a reason and submitting the request.",
        website: "amazon.com",
        averageDuration: "5-10 min",
      },
      {
        id: "support-6",
        label:
          "Cancel a subscription: Log into an account on a SaaS website or streaming service, navigate to account settings or subscriptions, and follow the steps to cancel the subscription or free trial (stopping just before final confirmation if needed).",
        website: "netflix.com",
        averageDuration: "3-5 min",
      },
      {
        id: "support-7",
        label:
          "Search the FAQ/Knowledge Base: On a software product’s support site, use the search bar to find an article in the FAQ/knowledge base (e.g. search “reset password issue” and click on a relevant FAQ article).",
        website: "support.example.com",
        averageDuration: "2-3 min",
      },
      {
        id: "support-8",
        label:
          "Fill feedback form: Scroll to a website’s feedback form (often in Contact Us), fill out your name, email, and type a message providing feedback or reporting a bug, then submit the form.",
        website: "website.com/contact",
        averageDuration: "3-5 min",
      },
      {
        id: "support-9",
        label:
          "Email customer support: Use a webmail client (or the site’s contact feature) to draft and send a support email to a company’s support address (for example, composing an email about a service issue via Gmail or via a website contact widget).",
        website: "gmail.com",
        averageDuration: "5-10 min",
      },
      {
        id: "support-10",
        label:
          "Follow up on an order via chat: On a food delivery app’s web interface (or similar service), use the support chat to ask about the status of an ongoing order or to report a problem with an order (simulating a common customer service scenario).",
        website: "ubereats.com",
        averageDuration: "3-5 min",
      },
    ],
  },
  {
    id: "travel",
    name: "Travel Booking & Transportation",
    tasks: [
      {
        id: "travel-1",
        label:
          "Search for flights: Go to Expedia (or Kayak) and search for a round-trip flight from New York to Los Angeles, with specific dates next month. Apply a filter to only show nonstop flights, and sort the results by price.",
        website: "expedia.com",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-2",
        label:
          "Book a hotel room: On Booking.com, search for hotels in Paris for a given date range, filter by 4-star rating and “Breakfast included”, then select one hotel and go through the booking steps (choose a room, enter guest details) up until the payment page.",
        website: "booking.com",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-3",
        label:
          "Find an Airbnb: Navigate to Airbnb’s website, search for accommodations in Tokyo for certain dates, and use filters (e.g. entire place, 2 bedrooms, max price $150/night). Scroll through the map and listings, and click on one listing to view details and reviews.",
        website: "airbnb.com",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-4",
        label:
          "Reserve a restaurant table: Using OpenTable (or a similar reservation platform), search for Italian restaurants in your city, pick a restaurant, and make a reservation for 2 people for tomorrow evening at 7 PM (stop after getting to the confirmation page).",
        website: "opentable.com",
        averageDuration: "3-5 min",
      },
      {
        id: "travel-5",
        label:
          "Plan a route on Google Maps: Open Google Maps in a browser, input a starting address and a destination, and switch to the “Directions” view. Select the public transit option and note the suggested route and travel time.",
        website: "maps.google.com",
        averageDuration: "2-3 min",
      },
      {
        id: "travel-6",
        label:
          "Check flight status: Go to an airline’s website (or a site like FlightStats), enter a flight number and date (for a flight that’s scheduled for today), and retrieve the current status (on-time, delayed, etc.).",
        website: "flightstats.com",
        averageDuration: "2-3 min",
      },
      {
        id: "travel-7",
        label:
          "Rent a car online: Visit Hertz.com (or any major car rental site), enter a pickup location, dates, and times for a rental, and search. Select a car category (e.g. economy) and proceed to the reservation details page.",
        website: "hertz.com",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-8",
        label:
          "Look up travel visa info: Go to an official government travel advisory site or an embassy page, and find the visa requirements for citizens of your country traveling to Brazil (for example).",
        website: "travel.state.gov",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-9",
        label:
          "Read travel reviews: On TripAdvisor, search for “Top things to do in London”. Click on one attraction (e.g. British Museum) and read some of the user reviews for that attraction, then go back and look at another attraction’s page.",
        website: "tripadvisor.com",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-10",
        label:
          "Buy a train ticket: Use a railway website (e.g. Amtrak for U.S., or Eurostar for Europe) to search for a train from one city to another. Select a specific departure time, and proceed to the seat selection or passenger info page (without finalizing payment).",
        website: "amtrak.com",
        averageDuration: "5-10 min",
      },
    ],
  },
  {
    id: "education",
    name: "Education & E-Learning",
    tasks: [
      {
        id: "edu-1",
        label:
          "Enroll in an online course: Go to Coursera and search for a course (e.g. “Machine Learning”). Click on a course from the results, and go through the enrollment process (sign up or log in, then click “Enroll” for the free version of the course).",
        website: "coursera.org",
        averageDuration: "5-10 min",
      },
      {
        id: "edu-2",
        label:
          "Complete a lesson on Khan Academy: Log into Khan Academy, navigate to a math topic (e.g. Algebra), and start a practice quiz. Answer a couple of questions and submit to see feedback, simulating a learning session.",
        website: "khanacademy.org",
        averageDuration: "5-10 min",
      },
      {
        id: "edu-3",
        label:
          "Join a Zoom class via web: Receive a Zoom meeting invite link (for a virtual class) and open it in the browser. Join the meeting through the web client, entering your name and waiting for the host to admit you (you can leave after verifying the join process works).",
        website: "zoom.us",
        averageDuration: "2-3 min",
      },
      {
        id: "edu-4",
        label:
          "Submit an assignment on LMS: Log into a learning management system like Canvas or Moodle (assuming a demo course or account), navigate to an assignment upload page, attach a file (e.g. a PDF as your “homework”), and submit the assignment.",
        website: "canvas.instructure.com",
        averageDuration: "5-10 min",
      },
      {
        id: "edu-5",
        label:
          "Search academic papers: Use Google Scholar to search for a research paper on “machine translation”. Click on one of the results, then attempt to download the PDF either directly or via a university proxy (if accessible).",
        website: "scholar.google.com",
        averageDuration: "5-10 min",
      },
      {
        id: "edu-6",
        label:
          "Use a digital library: Log into an online library portal (for example, a local library or university library site), search the catalog for a book or publication, and place a hold or request an e-book loan for that item.",
        website: "library.example.edu",
        averageDuration: "5-10 min",
      },
      {
        id: "edu-7",
        label:
          "Take a language lesson on Duolingo: On Duolingo’s website, sign in and start the next lesson in a French (for example) course. Go through a few interactive exercises (translating a sentence, matching words) and complete the lesson.",
        website: "duolingo.com",
        averageDuration: "5-10 min",
      },
      {
        id: "edu-8",
        label:
          "Participate in a course forum: Within an online course platform (Coursera, edX, or even a private LMS forum), navigate to the discussion section and post a question or reply in one of the course discussion threads.",
        website: "coursera.org",
        averageDuration: "3-5 min",
      },
      {
        id: "edu-9",
        label:
          "Watch an educational video: Go to an educational site like edX or MIT OpenCourseWare, find a lecture video for a course, and watch a portion of the video (e.g. first 5 minutes), noting the controls like captions or playback speed if used.",
        website: "edx.org",
        averageDuration: "5-10 min",
      },
      {
        id: "edu-10",
        label:
          "Use a flashcard tool: Visit Quizlet (web version), search for a set of flashcards on “Spanish vocabulary basics,” practice with the flashcards by flipping through a few terms, and test yourself with the quiz or match game mode.",
        website: "quizlet.com",
        averageDuration: "5-10 min",
      },
    ],
  },
  {
    id: "banking",
    name: "Banking & Finance",
    tasks: [
      {
        id: "bank-1",
        label:
          "Log into online banking: Go to a bank’s website (e.g. Chase, Bank of America) and log in with demo or test credentials (if available, or just navigate to the login page and describe the process). Once in, navigate to the account summary to view the current balance of a checking account.",
        website: "chase.com",
        averageDuration: "2-3 min",
      },
      {
        id: "bank-2",
        label:
          "Download a bank statement: Still in the online banking portal, find the statements section for one of your accounts, select a recent month’s statement, and download the PDF file of the statement.",
        website: "chase.com",
        averageDuration: "3-5 min",
      },
      {
        id: "bank-3",
        label:
          "Transfer funds: Use the bank’s transfer feature to move money from a checking to a savings account (enter an amount, choose immediate transfer, and confirm the details on the review screen).",
        website: "bankofamerica.com",
        averageDuration: "5-10 min",
      },
      {
        id: "bank-4",
        label:
          "Pay a bill online: Go to the bill payment section, add a payee (if not already added, e.g. “Electric Company”), and set up a one-time payment of $50, scheduling it for today (you can stop before final confirmation if needed).",
        website: "bankofamerica.com",
        averageDuration: "5-10 min",
      },
      {
        id: "bank-5",
        label:
          "Use a budgeting tool: Log into a personal finance tool like Mint or YNAB via web, connect a sample bank account (or use demo mode), and review the automatically categorized transactions. Adjust one transaction’s category (e.g. change a “Coffee Shop” expense from Uncategorized to “Food & Dining”).",
        website: "mint.com",
        averageDuration: "5-10 min",
      },
      {
        id: "bank-6",
        label:
          "Apply for a credit card: On a bank or credit card company’s site, navigate to the credit card offerings, select one card, and click “Apply”. Fill out the application form fields (name, address, income, etc.) up until the point of submission to simulate the application process.",
        website: "bankofamerica.com",
        averageDuration: "5-10 min",
      },
      {
        id: "bank-7",
        label:
          "Check credit score: Log into a credit monitoring service like Credit Karma (or a bank’s provided credit score tool), and view your current credit score and report summary. Navigate through the report to see accounts or inquiries.",
        website: "creditkarma.com",
        averageDuration: "2-3 min",
      },
      {
        id: "bank-8",
        label:
          "Update account info: In the bank’s profile/settings section, update personal information – for example, change the phone number or address on file (or at least go to the form and see the fields where you would do so, without necessarily saving if not allowed).",
        website: "bankofamerica.com",
        averageDuration: "3-5 min",
      },
      {
        id: "bank-9",
        label:
          "Send money via PayPal: Log in to PayPal, use the “Send Money” feature to send $5 to a friend’s email address, choose the funding source, and review the transaction (you can cancel before final submit if you don’t want to actually send money).",
        website: "paypal.com",
        averageDuration: "3-5 min",
      },
      {
        id: "bank-10",
        label:
          "Trade stock on brokerage site: Log into an online brokerage (like Robinhood Web or E*TRADE), search for a stock (e.g. AAPL for Apple), view the stock’s detail page with price chart, and go through the steps to buy 1 share (click buy, enter quantity 1, review order) without finalizing the trade.",
        website: "robinhood.com",
        averageDuration: "5-10 min",
      },
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment & Media",
    tasks: [
      {
        id: "ent-1",
        label:
          "Add to Netflix watchlist: Log into Netflix on the web, search for a specific show or movie (e.g. “Stranger Things”), click on it, and add it to “My List” (your watchlist).",
        website: "netflix.com",
        averageDuration: "2-3 min",
      },
      {
        id: "ent-2",
        label:
          "Rate a show on Netflix: After watching something on Netflix (or in the details page), give it a thumbs up or thumbs down rating to provide feedback on your preference.",
        website: "netflix.com",
        averageDuration: "1-2 min",
      },
      {
        id: "ent-3",
        label:
          "Comment on a YouTube video: Go to YouTube, search for a music video or tutorial, play the video, scroll down and write a comment in the comment box, then post it.",
        website: "youtube.com",
        averageDuration: "3-5 min",
      },
      {
        id: "ent-4",
        label:
          "Create a playlist on YouTube: While logged into YouTube, create a new playlist (e.g. “My Favorite Trailers”), then add a currently-watching video to that playlist via the “Save” button.",
        website: "youtube.com",
        averageDuration: "3-5 min",
      },
      {
        id: "ent-5",
        label:
          "Add songs to Spotify playlist: Open Spotify’s web player, create a new playlist (if one doesn’t exist), search for a song (e.g. by an artist name), and add that song to your playlist. Also click the heart icon to “like” the song.",
        website: "spotify.com",
        averageDuration: "3-5 min",
      },
      {
        id: "ent-6",
        label:
          "Check movie showtimes: Visit a movie ticket booking site like Fandango, enter your city or ZIP code, and pick a movie that’s currently playing. Select a theater and showtime, then proceed to the seat selection interface (you can stop before purchasing tickets).",
        website: "fandango.com",
        averageDuration: "3-5 min",
      },
      {
        id: "ent-7",
        label:
          "Write a review on IMDb: Go to IMDb, search for a movie you’ve seen, navigate to the “User Reviews” section, and submit a review by giving a star rating and writing a brief comment about the film.",
        website: "imdb.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ent-8",
        label:
          "Browse and buy on Steam: Log into the Steam website, search for a game title (e.g. “Minecraft”), view the game’s store page, add the game to your cart, and proceed to checkout (halt before payment).",
        website: "store.steampowered.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ent-9",
        label:
          "Read an eBook online: Using Kindle Cloud Reader or Google Books, open a book (maybe a free classic or a sample), read a few pages, adjust a setting like font size or color mode (day/night), and add a bookmark.",
        website: "read.amazon.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ent-10",
        label:
          "Join a Twitch stream: Go to Twitch.tv, find a live stream of interest (e.g. a popular gamer or a live podcast channel), click on it to start watching, and send a message in the chat (requires logging in with a Twitch account) to interact with the stream.",
        website: "twitch.tv",
        averageDuration: "3-5 min",
      },
    ],
  },
  {
    id: "productivity",
    name: "Productivity & Utility Tools",
    tasks: [
      {
        id: "prod-1",
        label:
          "Send an email with Gmail: Log into Gmail on the web, click “Compose”, write an email to yourself or a friend (e.g. subject “Hello” and a short body), and hit send. Then check the Sent folder to verify it was sent.",
        website: "gmail.com",
        averageDuration: "2-3 min",
      },
      {
        id: "prod-2",
        label:
          "Schedule a calendar event: Open Google Calendar (web), create a new event on a specific date/time (e.g. meeting tomorrow at 3 PM titled “Project Sync”), add a video conferencing link or location, invite one participant by email, and save the event.",
        website: "calendar.google.com",
        averageDuration: "2-3 min",
      },
      {
        id: "prod-3",
        label:
          "Collaborate on a Google Doc: In Google Drive, create a new Google Document, type a few lines of text, then use the “Share” button to invite someone (enter an email with “Viewer” or “Editor” access). Copy the sharable link as if you were going to send it.",
        website: "docs.google.com",
        averageDuration: "3-5 min",
      },
      {
        id: "prod-4",
        label:
          "Set a task in Todoist: Log into Todoist (web version or a similar to-do app like Microsoft To Do), create a new task called “Finish report” with a due date of tomorrow, mark its priority as High, then check it off as complete.",
        website: "todoist.com",
        averageDuration: "2-3 min",
      },
      {
        id: "prod-5",
        label:
          "Organize files in Google Drive: In Google Drive, create a new folder named “TestFolder”, upload a file (any small text or image file) into that folder, and then move that file from “TestFolder” into the main “My Drive” (simulating reorganizing files).",
        website: "drive.google.com",
        averageDuration: "3-5 min",
      },
      {
        id: "prod-6",
        label:
          "Fill out a Google Form: Access a Google Form (perhaps a sample survey or quiz), fill in several fields (name, multiple-choice questions, etc.), and submit your responses to the form.",
        website: "forms.google.com",
        averageDuration: "2-3 min",
      },
      {
        id: "prod-7",
        label:
          "Convert a file online: Use an online file converter service (e.g. SmallPDF or Zamzar). Upload a Word document and convert it to PDF (or vice versa), wait for processing, and then download the converted file.",
        website: "smallpdf.com",
        averageDuration: "3-5 min",
      },
      {
        id: "prod-8",
        label:
          "Use an online timer: Visit an online timer or Pomodoro web app (e.g. tomato-timer.com), set a countdown for 1 minute, start the timer, and let it run to completion (or stop it midway). Observe the alarm or notification when time is up.",
        website: "tomato-timer.com",
        averageDuration: "1-2 min",
      },
      {
        id: "prod-9",
        label:
          "Do a calculation in Google Sheets: Open Google Sheets (web), create a new spreadsheet, and in cell A1 and A2 enter two numbers. In cell A3, write a formula =A1 + A2 to sum them, pressing Enter to see the result. (This simulates a simple use of an online spreadsheet for calculation.)",
        website: "sheets.google.com",
        averageDuration: "2-3 min",
      },
      {
        id: "prod-10",
        label:
          "Take notes in Evernote (web): Log into Evernote Web, create a new note in a notebook, give it a title “Meeting Notes”, type a short list of bullet points in the body of the note, and add a tag “Work” to the note for organization.",
        website: "evernote.com",
        averageDuration: "3-5 min",
      },
    ],
  },
  {
    id: "devops",
    name: "Dev Ops",
    tasks: [
      {
        id: "dev-1",
        label: "Log into GitHub and review a pull request.",
        website: "github.com",
        averageDuration: "3-5 min",
      },
      {
        id: "dev-2",
        label: "Leave a review comment with a code suggestion on a diff.",
        website: "github.com",
        averageDuration: "3-5 min",
      },
      {
        id: "dev-3",
        label: "Merge the PR into main and trigger a GitHub Action.",
        website: "github.com",
        averageDuration: "2-3 min",
      },
      {
        id: "dev-4",
        label: "Roll back a recent deploy on Vercel dashboard.",
        website: "vercel.com",
        averageDuration: "3-5 min",
      },
      {
        id: "dev-5",
        label: "Deploy a staging site via Netlify with a new commit.",
        website: "netlify.com",
        averageDuration: "5-10 min",
      },
      {
        id: "dev-6",
        label: "Link a preview deployment URL to a Jira ticket.",
        website: "jira.com",
        averageDuration: "3-5 min",
      },
      {
        id: "dev-7",
        label: "Create a branch in GitLab and assign an issue to it.",
        website: "gitlab.com",
        averageDuration: "3-5 min",
      },
      {
        id: "dev-8",
        label: "View CI/CD logs for a failed deployment.",
        website: "github.com",
        averageDuration: "3-5 min",
      },
      {
        id: "dev-9",
        label: "Approve a workflow run in a restricted GitHub org.",
        website: "github.com",
        averageDuration: "2-3 min",
      },
      {
        id: "dev-10",
        label: "Generate a new personal access token in GitHub settings.",
        website: "github.com",
        averageDuration: "2-3 min",
      },
    ],
  },
];
