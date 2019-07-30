import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material'
import { Subscription } from 'rxjs';

import { Post } from '../post.model';
import { PostsService } from '../posts.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  private postsSub: Subscription;
  private authStatusSub: Subscription;
  isLoading = false;
  totalPosts = 0;
  postsPerPage = 2;
  currentPage = 1;
  userId: string;
  pageSizeOptions = [1, 2, 5, 10];
  userIsAuthenticated = false;

  showSummary = false;
  showPDF = true;
  showAllPDFPages = false;
  PDFSizes = [0.5, 0.75, 1];
  PDFSize = 0.5;


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
    console.log(pageData);
    this.currentPage = pageData.pageIndex + 1
    this.postsPerPage = pageData.pageSize
    this.postsService.getPosts(this.postsPerPage, this.currentPage);
  }

  onDelete(postId: string) {
    this.isLoading = true;
    this.postsService.deletePost(postId).subscribe(() => {
      this.postsService.getPosts(this.postsPerPage, this.currentPage);
    }, () => {
      this.isLoading = false;
    });
  }

  onShowSummary(postId: string) {
    let showingSummaryPage = false;
    if (! this.showSummary) {
      showingSummaryPage = true;
    }
    this.showSummary = showingSummaryPage
  }

  onChangePageLayout(postId: string) {
    let currentPDFPages = true;
    if (this.showAllPDFPages) {
      currentPDFPages = false;
    }
    this.showAllPDFPages = currentPDFPages;
  }

  onResize(postId: string) {
    let currentPDFSize;
    let currentPDFSizeIndex = this.PDFSizes.indexOf(this.PDFSize) + 1
    if (currentPDFSizeIndex !== this.PDFSizes.length) {
      currentPDFSize = this.PDFSizes[currentPDFSizeIndex];
    } else {
      currentPDFSize = this.PDFSizes[0];
    }
    this.PDFSize = currentPDFSize;
  }

  ngOnDestroy() {
    this.postsSub.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
