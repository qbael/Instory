import api from "./api";
import type { Hashtag, PaginatedResponse, PaginationParams, Post } from "@/types";

const BASE_HASHTAG = "v1/hashtags";
const BASE_POST = "v1/posts";

export const hashtagService = {
  getTrendingHashtags(top: number = 10) {
    return api.get<Hashtag[]>(`${BASE_HASHTAG}/trending`, { params: { top } });
  },

  getPostsByHashtag(tag: string, params?: PaginationParams) {
    return api.get<PaginatedResponse<Post>>(`${BASE_POST}/search`, {
      params: { hashtag: tag, ...params },
    });
  },

  searchHashtags(query: string, limit: number = 10) {
    return api.get<Hashtag[]>(`${BASE_HASHTAG}/search`, {
      params: { query, limit },
    });
  },
};
