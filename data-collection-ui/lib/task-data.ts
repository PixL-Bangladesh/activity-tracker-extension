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

// Task categories and their tasks
export const taskCategories: TaskCategory[] = [
  {
    id: "ecommerce",
    name: "E-commerce & Online Shopping",
    tasks: [
      {
        id: "ecom-1",
        label: "Complete a purchase on an online store",
        website: "amazon.com",
        averageDuration: "10-15 min",
      },
      {
        id: "ecom-2",
        label: "Add items to a shopping cart",
        website: "walmart.com",
        averageDuration: "5-10 min",
      },
      {
        id: "ecom-3",
        label: "Compare product prices across different sites",
        website: "pricegrabber.com",
        averageDuration: "15-20 min",
      },
      {
        id: "ecom-4",
        label: "Write a product review",
        website: "bestbuy.com",
        averageDuration: "10-15 min",
      },
    ],
  },
  {
    id: "social",
    name: "Social Media & Online Communities",
    tasks: [
      {
        id: "social-1",
        label: "Create a post on a social media platform",
        website: "twitter.com",
        averageDuration: "5-10 min",
      },
      {
        id: "social-2",
        label: "Comment on someone else's content",
        website: "reddit.com",
        averageDuration: "3-5 min",
      },
      {
        id: "social-3",
        label: "Join an online community or group",
        website: "facebook.com",
        averageDuration: "5-10 min",
      },
      {
        id: "social-4",
        label: "Share content with friends or followers",
        website: "instagram.com",
        averageDuration: "3-5 min",
      },
    ],
  },
  {
    id: "job",
    name: "Job Search & Application",
    tasks: [
      {
        id: "job-1",
        label: "Update your resume or CV",
        website: "linkedin.com",
        averageDuration: "20-30 min",
      },
      {
        id: "job-2",
        label: "Apply for a job online",
        website: "indeed.com",
        averageDuration: "15-25 min",
      },
      {
        id: "job-3",
        label: "Create or update a professional profile",
        website: "linkedin.com",
        averageDuration: "10-20 min",
      },
      {
        id: "job-4",
        label: "Research a company before an interview",
        website: "glassdoor.com",
        averageDuration: "20-30 min",
      },
    ],
  },
  {
    id: "saas",
    name: "SaaS & Business Tools",
    tasks: [
      {
        id: "saas-1",
        label: "Use a project management tool",
        website: "asana.com",
        averageDuration: "15-20 min",
      },
      {
        id: "saas-2",
        label: "Create a document in a collaborative workspace",
        website: "notion.so",
        averageDuration: "10-15 min",
      },
      {
        id: "saas-3",
        label: "Schedule a meeting using an online calendar",
        website: "calendar.google.com",
        averageDuration: "5-10 min",
      },
      {
        id: "saas-4",
        label: "Use a CRM system to track customer interactions",
        website: "salesforce.com",
        averageDuration: "15-25 min",
      },
    ],
  },
  {
    id: "support",
    name: "Customer Service & Support",
    tasks: [
      {
        id: "support-1",
        label: "Submit a support ticket",
        website: "zendesk.com",
        averageDuration: "10-15 min",
      },
      {
        id: "support-2",
        label: "Use a live chat for customer service",
        website: "intercom.com",
        averageDuration: "5-15 min",
      },
      {
        id: "support-3",
        label: "Track an order or service request",
        website: "fedex.com",
        averageDuration: "5-10 min",
      },
      {
        id: "support-4",
        label: "Provide feedback on a service experience",
        website: "trustpilot.com",
        averageDuration: "10-15 min",
      },
    ],
  },
  {
    id: "travel",
    name: "Travel Booking & Transportation",
    tasks: [
      {
        id: "travel-1",
        label: "Book a flight or accommodation online",
        website: "booking.com",
        averageDuration: "15-25 min",
      },
      {
        id: "travel-2",
        label: "Use a map or navigation service",
        website: "maps.google.com",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-3",
        label: "Check in for a flight online",
        website: "united.com",
        averageDuration: "5-10 min",
      },
      {
        id: "travel-4",
        label: "Book a ride-sharing service",
        website: "uber.com",
        averageDuration: "3-5 min",
      },
    ],
  },
  {
    id: "education",
    name: "Education & E-Learning",
    tasks: [
      {
        id: "edu-1",
        label: "Enroll in an online course",
        website: "coursera.org",
        averageDuration: "10-15 min",
      },
      {
        id: "edu-2",
        label: "Complete a lesson or module",
        website: "udemy.com",
        averageDuration: "30-45 min",
      },
      {
        id: "edu-3",
        label: "Take an online quiz or assessment",
        website: "khanacademy.org",
        averageDuration: "15-25 min",
      },
      {
        id: "edu-4",
        label: "Participate in a virtual classroom",
        website: "zoom.us",
        averageDuration: "45-60 min",
      },
    ],
  },
  {
    id: "banking",
    name: "Banking & Finance",
    tasks: [
      {
        id: "bank-1",
        label: "Check account balance online",
        website: "chase.com",
        averageDuration: "3-5 min",
      },
      {
        id: "bank-2",
        label: "Make an online payment or transfer",
        website: "paypal.com",
        averageDuration: "5-10 min",
      },
      {
        id: "bank-3",
        label: "Set up automatic bill payments",
        website: "bankofamerica.com",
        averageDuration: "10-15 min",
      },
      {
        id: "bank-4",
        label: "Review transaction history",
        website: "mint.com",
        averageDuration: "5-10 min",
      },
    ],
  },
];
