// 데이터베이스 타입 정의

export interface Post {
  id: string;
  title: string;
  summary: string;
  original_link: string;
  category: string;
  created_at: string;
}

export type Category = "Game Developer" | "GamesIndustry.biz" | "Polygon";
