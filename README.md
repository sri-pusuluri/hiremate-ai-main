# HireSort GenAI

**AI-Powered Hiring Platform**

HireSort GenAI is a modern recruitment management system designed to streamline the hiring process. It provides tools for managing job postings, tracking candidates, and collaborating with your hiring team, all wrapped in a sleek, responsive interface.

## 🚀 Features

- **📊 Dashboard**: Get a high-level overview of your hiring pipeline and key metrics.
- **💼 Job Management**: Create, edit, and manage job postings efficiently.
- **busts_in_silhouette Candidates**: Track and organize candidate applications.
- **⭐ Shortlisting**: Easily manage shortlisted candidates for further review.
- **👥 User Management**: Administer team members and access controls.
- **⚙️ Settings**: Configure your account and application preferences.
- **🔒 Authentication**: Secure login and sign-up functionality (integrated with Supabase).

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
```

## 🚀 Deployment

To build the project for production:

```sh
npm run build
```

This will generate a `dist` folder ready for deployment to any static hosting service like Vercel, Netlify, or GitHub Pages.

---

*Verified running with Vite v5.4.19*
