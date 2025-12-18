// 데이터베이스 타입 정의

export interface Post {
  id: string;
  title: string;
  summary: string;
  original_link: string;
  category: string;
  view_count: number;
  created_at: string;
}

export interface Upvote {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface PostWithUpvotes extends Post {
  upvote_count: number;
  user_has_upvoted: boolean;
}

export type Category = "Dev" | "Business" | "Tech" | "Release" | "Esports";
