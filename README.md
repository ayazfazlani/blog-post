```markdown
# Project Setup Guide

This guide will walk you through setting up the project locally for development.

## 1. Prerequisites

Before starting, make sure you have the following:

- Node.js (version 18 or higher recommended)
- MongoDB (either a local installation or a MongoDB Atlas cluster)
- A Cloudinary account (the free tier is sufficient for development)

## 2. Clone the Repository (if applicable)

```bash
git clone <your-repository-url>
cd <project-folder>
```

## 3. Create the Environment File

In the root directory of the project, create a file named `.env.local` (standard for Next.js projects).

Copy and paste the following content into `.env.local`:

```env
NODE_ENV="development"
JWT_SECRET=

MONGODB_URI=

CLOUDINARY_URL=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=
```

Now fill in the empty values as described below.

## 4. Filling in the Environment Variables

### NODE_ENV
Leave as `"development"` for local development.

### JWT_SECRET
Generate a strong, random secret key (at least 32 characters recommended):

```bash
openssl rand -hex 32
```

Copy the output and paste it as the value:

```env
JWT_SECRET=your_generated_secret_here
```

**Important:** Never commit this value to version control.

### MONGODB_URI
Your MongoDB connection string.

- **Local MongoDB**:
  ```env
  MONGODB_URI=mongodb://127.0.0.1:27017/your_database_name
  ```

- **MongoDB Atlas** (recommended for production-ready setup):
  1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Create a free cluster
  3. Create a database user
  4. Add your current IP to the whitelist (or 0.0.0.0/0 for testing)
  5. Get the connection string and replace `<username>`, `<password>`, and database name

  Example:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/your_database_name?retryWrites=true&w=majority
  ```

### Cloudinary Configuration

1. Sign up or log in at [https://cloudinary.com](https://cloudinary.com)
2. From the **Console/Dashboard** page, copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**

3. Fill the individual variables:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Construct the full Cloudinary URL:
   ```env
   CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
   ```

5. Create an **Unsigned Upload Preset**:
   - Go to **Settings** → **Upload** → **Upload presets**
   - Click **Add upload preset**
   - Set **Signing Mode** to **Unsigned**
   - Give it a name (e.g., `nextjs_upload`)
   - Save the preset
   - Copy the preset name and set:
     ```env
     CLOUDINARY_UPLOAD_PRESET=nextjs_upload
     ```

## 5. Install Dependencies

Run one of the following commands:

```bash
npm install
# or
yarn install
# or
pnpm install
```

## 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 7. Security Best Practices

- Ensure `.env.local` is listed in your `.gitignore` file (it usually is by default in Next.js)
- Never share or commit your `.env.local` file
- Use different secrets, database URLs, and Cloudinary credentials for production
- In production, set `NODE_ENV=production`

You're all set! Happy coding! 🚀