import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material'
import { Subscription } from 'rxjs';

import { Post, NLP } from '../post.model';
import { PostsService } from '../posts.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  postNLP = <NLP>{};
  postsAndSettings = {};
  private postsSub: Subscription;
  private authStatusSub: Subscription;
  isLoading = false;
  isLoadingNlp = false;
  totalPosts = 0;
  postsPerPage = 2;
  currentPage = 1;
  userId: string;
  pageSizeOptions = [1, 2, 5, 10];
  userIsAuthenticated = false;

  PDFSizes = [0.5, 0.75, 1];


  constructor(public postsService: PostsService, private authService: AuthService) {}

  ngOnInit() {
    this.isLoading = true;
    this.postsService.getPosts(this.postsPerPage, this.currentPage);
    this.userId = this.authService.getUserID();
    this.postsSub = this.postsService.getPostUpdateListener()
      .subscribe((postData: {posts: Post[], postCount: number}) => {
        this.isLoading = false;
        this.totalPosts = postData.postCount;
        this.posts = postData.posts;
        this.posts.map(post => {
          this.postsAndSettings[post.id] = {
            ...post,
            nlp: this.postNLP,
            showSummary: false,
            showPDF: true,
            showAllPDFPages: false,
            PDFSize: this.PDFSizes[0]
          };
        });
      });
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.isLoading = false;
    this.authStatusSub = this.authService.getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserID();
      });
  }

  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1
    this.postsPerPage = pageData.pageSize
    this.postsAndSettings = {};
    this.postsService.getPosts(this.postsPerPage, this.currentPage);
  }

  onProcessNLP(postId: string) {
    let newPostAndSetting = this.postsAndSettings[postId]
    this.isLoadingNlp = true;
    this.postsService.processNlpPost(postId)
      .subscribe((nlpResponseData) => {
        if (nlpResponseData.summary.text) {
          newPostAndSetting.nlp.summary = this.transform(nlpResponseData.summary.text);
        } else {
          newPostAndSetting.nlp.summary = 'Summary could not be created';
        }
        this.postsAndSettings[postId] = newPostAndSetting;
        this.isLoadingNlp = false;
      });
  }

  onDelete(postId: string) {
    this.isLoading = true;
    this.postsService.deletePost(postId).subscribe(() => {
      this.postsAndSettings = {};
      this.postsService.getPosts(this.postsPerPage, this.currentPage);
    }, () => {
      this.isLoading = false;
    });
  }

  onShowSummary(postId: string) {
    let newPostAndSetting = this.postsAndSettings[postId]
    if (newPostAndSetting.showSummary) {
      newPostAndSetting.showSummary = false
    } else {
      newPostAndSetting.showSummary = true
    }
    this.postsAndSettings[postId] = newPostAndSetting
  }

  onChangePageLayout(postId: string) {
    let newPostAndSetting = this.postsAndSettings[postId]
    if (newPostAndSetting.showAllPDFPages) {
      newPostAndSetting.showAllPDFPages = false;
    } else {
      newPostAndSetting.showAllPDFPages = true;
    }
    this.postsAndSettings[postId] = newPostAndSetting
  }

  transform(value: string): any {
    return value.replace(/\\n\\n/g, '<br>').replace(/\\n/g, ' ').split(/\ {10,}/g).join('<br><br>')
  }

  onResize(postId: string) {
    let newPostAndSetting = this.postsAndSettings[postId]
    let currentPDFSize;
    let currentPDFSizeIndex = this.PDFSizes.indexOf(newPostAndSetting.PDFSize) + 1
    if (currentPDFSizeIndex !== this.PDFSizes.length) {
      currentPDFSize = this.PDFSizes[currentPDFSizeIndex];
    } else {
      currentPDFSize =this.PDFSizes[0];
    }
    newPostAndSetting.PDFSize = currentPDFSize;
    this.postsAndSettings[postId] = newPostAndSetting
  }

  ngOnDestroy() {
    this.postsSub.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
