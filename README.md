# Swadhin Enterprize ERP System

A modern, Bangla-first Enterprize Resource Planning (ERP) web application built for Swadhin Enterprize. This system manages orders, inventory (stock), customers, cash flow, and employee salaries.

Built with **Next.js 14 (App Router)**, **Supabase**, **Tailwind CSS**, and **Shadcn UI**.

## Features

- **PWA Ready**: Installable on mobile and desktop via Chrome/Safari.
- **Order Management**: Track orders through a Kanban board (Designing -> Printing -> Delivery).
- **Stock Management**: Track raw materials and finished goods with real-time value calculation.
- **Cash Flow**: Track daily income and expenses.
- **Role-Based Access**: Granular permissions (Admin, Manager, Staff).
- **Activity Log**: Full audit trail of every database mutation.
- **SMS Integration**: Automated SMS via GreenWeb API on order placement and delivery.

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18 or newer)
- npm or yarn
- A [Supabase](https://supabase.com/) account and project.
- A [GreenWeb BD](https://greenweb.com.bd/) API account (for SMS).

### 2. Environment Variables
Create a `.env.local` file in the root of the project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SMS API (GreenWeb BD)
GREENWEB_API_TOKEN=your_greenweb_token
```

### 3. Database Setup (Supabase)
Navigate to your Supabase project's SQL Editor. You need to run the initial migration file to set up the tables, triggers, and RPC functions.

1. Open `supabase/migrations/001_initial_schema.sql` from this codebase.
2. Copy the entire contents and run it in the Supabase SQL Editor.

### 4. First Run: Seed Admin User
To log in for the first time, you need an Administrator account. Since Supabase handles authentication, it is easiest to create the user via the Supabase Auth Dashboard, but you can also run this SQL snippet:

```sql
-- Run this after migrations to create the first admin profile manually.
-- IMPORTANT: First, create a user in the Supabase Auth Dashboard (with Phone Number + Password).
-- Copy that newly created user's UUID and replace `YOUR_AUTH_USER_ID` below.

INSERT INTO public.profiles (id, user_id, full_name, phone, role, active) 
VALUES (
  gen_random_uuid(), 
  'YOUR_AUTH_USER_ID', -- The UUID from auth.users
  'Super Admin', 
  '01700000000', 
  'admin', 
  true
);
```
*(Alternatively, you can just sign up via the app and manually change the `role` to `admin` in the `profiles` table).*

### 5. Install Dependencies & Run
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 📱 SMS API Setup
The system uses GreenWeb BD for sending SMS to customers.
1. Sign up at [GreenWeb BD](https://greenweb.com.bd/).
2. Get your API Token from the dashboard.
3. Add it to `GREENWEB_API_TOKEN` in your `.env.local`.
4. The system automatically triggers SMS on:
   - Order Creation
   - Order Delivery

*Note: SMS sending has a built-in rate limit of 10 messages per minute per to prevent accidental spam or abuse.*

---

## 🚀 Deployment to Vercel

1. Push your code to a GitHub repository.
2. Log into [Vercel](https://vercel.com/) and click **Add New... > Project**.
3. Import your GitHub repository.
4. Add the following Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GREENWEB_API_TOKEN`
5. Click **Deploy**.

Because this app utilizes Next.js 14 Server Actions and React Server Components, Vercel will automatically optimize everything for edge and serverless execution.
