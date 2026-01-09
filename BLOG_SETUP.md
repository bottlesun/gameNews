# Tech Blog Setup Guide

This guide will help you set up the Tech Blog feature powered by Notion as a headless CMS.

## Prerequisites

- A Notion account
- A Notion database for your blog posts

## Step 1: Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g., "Game News Blog")
4. Select the workspace where your blog database is located
5. Click **"Submit"**
6. Copy the **Internal Integration Token** (this is your `NOTION_API_KEY`)

## Step 2: Create Your Blog Database

1. In Notion, create a new database (Table view recommended)
2. Add the following properties **exactly as specified**:

   | Property Name | Type      | Description                   |
   | ------------- | --------- | ----------------------------- |
   | `title`       | Title     | Post title                    |
   | `info`        | Rich Text | Markdown intro/description    |
   | `status`      | Select    | Options: 'Draft', 'Published' |
   | `createdat`   | Date      | Creation date                 |
   | `updatedat`   | Date      | Last updated date             |

3. Share the database with your integration:
   - Click **"Share"** in the top right
   - Search for your integration name
   - Click **"Invite"**

## Step 3: Get Your Database ID

The Database ID is in the URL of your Notion database:

```
https://www.notion.so/{workspace}/{database_id}?v={view_id}
```

Copy the `database_id` part (it's a 32-character string).

## Step 4: Configure Environment Variables

1. Open or create `.env.local` in your project root
2. Add the following variables:

```env
# Notion API Configuration
NOTION_API_KEY=your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
```

3. Replace the placeholder values with your actual credentials

## Step 5: Install Dependencies

The required packages should already be installed. If not, run:

```bash
npm install @notionhq/client react-notion-x notion-client react-markdown remark-gfm
```

## Step 6: Test Your Setup

1. Create a test post in your Notion database:

   - Set `title` to "My First Post"
   - Add some Markdown content to `info` (e.g., "This is **bold** and this is _italic_")
   - Set `status` to "Published"
   - Set `createdat` to today's date

2. Start your development server:

   ```bash
   npm run dev
   ```

3. Navigate to `http://localhost:3000/blog`
4. You should see your test post!

## Folder Structure

```s
gameNews/
├── app/
│   └── blog/
│       ├── page.tsx              # Blog list page (/blog)
│       └── [pageId]/
│           └── page.tsx          # Blog detail page (/blog/[pageId])
├── components/
│   └── markdown-renderer.tsx    # Reusable Markdown renderer
├── lib/
│   └── notion.ts                # Notion API service layer
└── .env.local                   # Environment variables
```

## Features

### Blog List Page (`/blog`)

- Displays all published posts in a grid layout
- Shows post title, creation date, and Markdown-rendered intro
- ISR with 60-second revalidation

### Blog Detail Page (`/blog/[pageId]`)

- Full post content rendered using `react-notion-x`
- Displays creation and update dates
- Static generation with ISR (60s revalidation)
- Back navigation to blog list

## Writing Posts

1. Create a new page in your Notion database
2. Fill in all required properties:
   - **title**: Your post title
   - **info**: A Markdown description/intro (supports **bold**, _italic_, `code`, links, etc.)
   - **status**: Set to "Published" when ready
   - **createdat**: Publication date
   - **updatedat**: Last modified date (optional)
3. Write your main content in the Notion page body
4. Your post will appear on the blog within 60 seconds!

## Troubleshooting

### Posts not showing up?

- Verify `status` is set to "Published"
- Check that the integration has access to the database
- Verify environment variables are correct
- Restart your dev server after changing `.env.local`

### Markdown not rendering?

- Ensure the `info` property is type "Rich Text" in Notion
- Check that you're using valid Markdown syntax

### Build errors?

- Run `npm install` to ensure all dependencies are installed
- Check that TypeScript types are correct
- Verify Notion API credentials are valid

## Production Deployment

1. Add environment variables to your hosting platform (Vercel, Netlify, etc.)
2. Build the project: `npm run build`
3. Deploy!

The blog uses ISR, so new posts will appear within 60 seconds without rebuilding.
