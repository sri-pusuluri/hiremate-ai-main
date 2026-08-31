# HireSortAi

**AI-Powered Hiring Platform**

HireSortAi is a modern recruitment management system designed to streamline the hiring process. It provides tools for managing job postings, tracking candidates, and collaborating with your hiring team, all wrapped in a sleek, responsive interface.

## 🚀 Features

- **📊 Dashboard**: Get a high-level overview of your hiring pipeline and key metrics.
- **💼 Job Management**: Create, edit, and manage job postings efficiently.
- **busts_in_silhouette Candidates**: Track and organize candidate applications.
- **⭐ Shortlisting**: Easily manage shortlisted candidates for further review.
- **👥 User Management**: Administer team members and access controls.
- **⚙️ Settings**: Configure your account and application preferences.
- **🔒 Authentication**: Secure login and sign-up functionality (integrated with Supabase).
- **🤖 AI Matching**: Real-time evaluation of candidates against job descriptions using LLMs, integrated directly via Supabase Edge Functions.
- **✉️ Team Management**: Secure, invite-only team provisioning with role-based access control (Admin vs Recruiter). Fully integrates with Custom SMTP (Resend) for branded invite emails.

## 🌟 Recent Updates (August 2026)

- **Complete Invitation Flow**: Admins can seamlessly invite team members. Supabase Edge Functions (`invite-user` and `delete-user`) securely handle creating, resending, and deleting user access without exposing sensitive keys to the frontend.
- **Dynamic Redirects**: Invite links intelligently redirect users back to their origin (e.g., `localhost:8080` for development or `hiresortai.zool.in` for production).
- **Custom SMTP Integration**: Configured to use Resend for fully customizable, branded email templates.
- **UI Refinements**: Standardized sentence-case tooltips across the app and refactored the Predictive Insights view into a highly readable row-based structure.
- **State Management Polish**: Fixed local component state to ensure AI Processing details cleanly reset when navigating between different candidate records.

## 🛠️ Tech Stack

This project is built using a modern frontend stack ensuring performance and developer experience:

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management & Data**: [TanStack Query](https://tanstack.com/query/latest)
- **Routing**: [React Router](https://reactrouter.com/)
- **Backend/Auth**: [Supabase](https://supabase.com/)

## 🏁 Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1.  **Clone the repository**
    ```sh
    git clone <YOUR_GIT_URL>
    cd hiremate-ai-main
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Start the development server**
    ```sh
    npm run dev
    ```

4.  **Open in Browser**
    Visit `http://localhost:8080/` (or the port shown in your terminal) to view the application.

## 📂 Project Structure

```
src/
├── components/      # Reusable UI components (buttons, inputs, etc.)
├── hooks/           # Custom React hooks (including authentication)
├── pages/           # Main application pages (Dashboard, Jobs, Auth, etc.)
├── lib/             # Utility functions and configurations
├── integrations/    # External service integrations (Supabase etc.)
└── App.tsx          # Main application entry point with routing

supabase/
├── functions/       # Serverless Edge Functions (e.g., invite-user, delete-user)
└── migrations/      # Database schema definitions and trigger setup
```

## 🚀 Deployment

To build the project for production:

```sh
npm run build
```

This will generate a `dist` folder ready for deployment to any static hosting service like Vercel, Netlify, or GitHub Pages.

---

*Verified running with Vite v5.4.19*
