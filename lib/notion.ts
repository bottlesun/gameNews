import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Format Database ID to UUID format (with hyphens)
function formatDatabaseId(id: string): string {
  // Remove all hyphens first
  const clean = id.replace(/-/g, "");
  // Add hyphens in UUID format: 8-4-4-4-12
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(
    12,
    16
  )}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

const DATABASE_ID = formatDatabaseId(process.env.NOTION_DATABASE_ID!);

// TypeScript interfaces
export interface NotionPost {
  id: string;
  title: string;
  info: string; // Markdown string
  status: string;
  createdat: string | null;
  updatedat: string | null;
}

// Notion block interface
export interface NotionBlock {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface NotionPostDetail extends NotionPost {
  blocks: NotionBlock[];
}

// Rich text type
interface RichTextItem {
  plain_text: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    strikethrough?: boolean;
  };
  href?: string | null;
}

/**
 * Convert Notion RichText array to plain Markdown string
 */
function richTextToMarkdown(richTextArray: RichTextItem[]): string {
  if (!richTextArray || richTextArray.length === 0) return "";

  return richTextArray
    .map((richText) => {
      if (!richText.plain_text) return "";

      let text = richText.plain_text;

      // Apply formatting based on annotations
      if (richText.annotations) {
        if (richText.annotations.bold) text = `**${text}**`;
        if (richText.annotations.italic) text = `*${text}*`;
        if (richText.annotations.code) text = `\`${text}\``;
        if (richText.annotations.strikethrough) text = `~~${text}~~`;
      }

      // Handle links
      if (richText.href) {
        text = `[${text}](${richText.href})`;
      }

      return text;
    })
    .join("");
}

/**
 * Fetch all published posts from Notion database
 */
export async function getPublishedPosts(): Promise<NotionPost[]> {
  try {
    const response = await notion.dataSources.query({
      data_source_id: DATABASE_ID,
      sorts: [
        {
          property: "createdat",
          direction: "descending",
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPosts = response.results.map((page: any) => {
      const properties = page.properties || {};

      // Extract title from 'info' (title type property)
      let title = "Untitled";
      for (const key of Object.keys(properties)) {
        const prop = properties[key];
        if (prop.type === "title" && prop.title && prop.title.length > 0) {
          title = prop.title[0].plain_text || "Untitled";
          break;
        }
      }

      // info is no longer used (content goes in page blocks)
      const info = "";

      // Extract status
      let status = "Draft";
      const statusProp = properties.status || properties.Status;
      if (statusProp) {
        if (statusProp.type === "select" && statusProp.select) {
          status = statusProp.select.name || "Draft";
        } else if (statusProp.type === "status" && statusProp.status) {
          status = statusProp.status.name || "Draft";
        } else if (statusProp.type === "rich_text" && statusProp.rich_text) {
          status = richTextToMarkdown(statusProp.rich_text);
        } else if (statusProp.type === "checkbox") {
          status = statusProp.checkbox ? "완료" : "Draft";
        }
      }

      // Extract createdat
      let createdat = null;
      const createdatProp = properties.createdat || properties.Createdat;
      if (createdatProp) {
        if (createdatProp.type === "date" && createdatProp.date) {
          createdat = createdatProp.date.start;
        } else if (
          createdatProp.type === "created_time" &&
          createdatProp.created_time
        ) {
          createdat = createdatProp.created_time;
        }
      }

      // Extract updatedat
      let updatedat = null;
      const updatedatProp = properties.updatedat || properties.Updatedat;
      if (updatedatProp) {
        if (updatedatProp.type === "date" && updatedatProp.date) {
          updatedat = updatedatProp.date.start;
        } else if (
          updatedatProp.type === "last_edited_time" &&
          updatedatProp.last_edited_time
        ) {
          updatedat = updatedatProp.last_edited_time;
        }
      }

      const post = {
        id: page.id,
        title,
        info,
        status,
        createdat,
        updatedat,
      };

      return post;
    });

    // Filter for published posts
    const publishedPosts = allPosts.filter(
      (post) =>
        post.status.toLowerCase() === "published" ||
        post.status.toLowerCase() === "publish" ||
        post.status === "완료"
    );

    return publishedPosts;
  } catch (error) {
    console.error("Error fetching published posts:", error);
    throw error;
  }
}

/**
 * Fetch all blocks from a Notion page
 */
export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
  try {
    const formattedPageId = formatDatabaseId(pageId);
    const blocks: NotionBlock[] = [];

    let cursor: string | undefined = undefined;

    // Fetch all blocks with pagination
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await notion.blocks.children.list({
        block_id: formattedPageId,
        start_cursor: cursor,
        page_size: 100,
      });

      blocks.push(...(response.results as NotionBlock[]));
      cursor = response.next_cursor || undefined;
    } while (cursor);

    return blocks;
  } catch (error) {
    console.error(`Error fetching blocks for page ${pageId}:`, error);
    return [];
  }
}

/**
 * Fetch a single post detail by page ID
 */
export async function getPostDetail(pageId: string): Promise<NotionPostDetail> {
  try {
    // Format pageId to ensure it has hyphens (UUID format)
    const formattedPageId = formatDatabaseId(pageId);

    // Fetch page metadata (requires hyphens)
    const page = await notion.pages.retrieve({
      page_id: formattedPageId,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties = (page as any).properties || {};

    // Extract title from 'info' (title type property)
    let title = "Untitled";
    for (const key of Object.keys(properties)) {
      const prop = properties[key];
      if (prop.type === "title" && prop.title && prop.title.length > 0) {
        title = prop.title[0].plain_text || "Untitled";
        break;
      }
    }

    // info is no longer used (content goes in page blocks)
    const info = "";

    let status = "Draft";
    const statusProp = properties.status || properties.Status;
    if (statusProp) {
      if (statusProp.type === "select" && statusProp.select) {
        status = statusProp.select.name || "Draft";
      } else if (statusProp.type === "status" && statusProp.status) {
        status = statusProp.status.name || "Draft";
      }
    }

    let createdat = null;
    const createdatProp = properties.createdat || properties.Createdat;
    if (createdatProp) {
      if (createdatProp.type === "date" && createdatProp.date) {
        createdat = createdatProp.date.start;
      } else if (
        createdatProp.type === "created_time" &&
        createdatProp.created_time
      ) {
        createdat = createdatProp.created_time;
      }
    }

    let updatedat = null;
    const updatedatProp = properties.updatedat || properties.Updatedat;
    if (updatedatProp) {
      if (updatedatProp.type === "date" && updatedatProp.date) {
        updatedat = updatedatProp.date.start;
      } else if (
        updatedatProp.type === "last_edited_time" &&
        updatedatProp.last_edited_time
      ) {
        updatedat = updatedatProp.last_edited_time;
      }
    }

    // Fetch page content blocks
    const blocks = await getPageBlocks(formattedPageId);

    return {
      id: formattedPageId,
      title,
      info,
      status,
      createdat,
      updatedat,
      blocks,
    };
  } catch (error) {
    console.error(`Error fetching post detail for ${pageId}:`, error);
    throw error;
  }
}

/**
 * Get all page IDs for static generation
 */
export async function getAllPostIds(): Promise<string[]> {
  try {
    const posts = await getPublishedPosts();
    return posts.map((post) => post.id);
  } catch (error) {
    console.error("Error fetching all post IDs:", error);
    return [];
  }
}
