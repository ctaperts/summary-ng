import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { Post } from './post.model';
import { environment } from '../../environments/environment'

const BACKEND_URL = environment.apiUrl + '/posts/'

@Injectable({providedIn: 'root'})
export class PostsService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{posts: Post[], postCount: number}>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
    this.http
      .get<{message: string, posts: any, maxPosts: number}>(BACKEND_URL + queryParams)
      .pipe(map((postData) => {
        return {
          posts: postData.posts.map(post => {
          return {
            title: post.title,
            content: post.content,
            id: post._id,
            docPath: post.docPath,
            creator: post.creator,
          }
        }),
          maxPosts: postData.maxPosts
        };
      }))
      .subscribe((transformedPostData) => {
        this.posts = transformedPostData.posts;
        this.postsUpdated.next({posts: [...this.posts], postCount: transformedPostData.maxPosts });
      });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.http.get<{ _id: string, title: string, content: string, docPath: string, creator: string }>(BACKEND_URL + id);
  }

  addPost(title: string, content: string, doc: File ) {
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('doc', doc, title);
    this.http
      .post<{ message: string, post: Post }>(
        BACKEND_URL,
        postData
      )
      .subscribe((responseData) => {
        this.router.navigate(['/']);
      });
  }

  processNlpPost(postId: string) {
    return this.http
      .post<{ message: string, summary: any }>(
        environment.apiUrl + '/nlp/doc',
        {'postId': postId}
      );
  }

  updatePost(id: string, title: string, content: string, doc: File | string ) {
    let postData: Post | FormData;
    if (typeof(doc) === 'object') {
      postData = new FormData();
      postData.append('id', id);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('doc', doc, title);
    } else {
      postData = { id: id, title: title, content: content, docPath: doc, creator: null };
    }
    this.http
      .put<{ message: string }>(BACKEND_URL + id, postData)
      .subscribe((responseData) => {
        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    return this.http
      .delete(BACKEND_URL + postId);
  }
}
