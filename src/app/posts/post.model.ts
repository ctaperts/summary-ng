export interface Post {
  id: string;
  title: string;
  content: string;
  docPath: string;
  creator: string;
}


export interface NLP {
  summary: string;
  topics: Array<string>;
  highlights: Array<string>;
  entities: {[k: string]: any};
  postId: string;
}
