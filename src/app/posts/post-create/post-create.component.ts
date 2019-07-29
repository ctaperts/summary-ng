import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { PostsService } from '../posts.service';
import { Post } from '../post.model';
import { mimeType } from './mime-type.validator';

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css']
})
export class PostCreateComponent implements OnInit, OnDestroy {
  enteredTitle = '';
  enteredContent = '';
  post: Post;
  isLoading = false;
  form: FormGroup;
  docPreview: string;
  private mode = 'create';
  private postId: string;
  private authStatusSub: Subscription;

  constructor(
    public postsService: PostsService,
    public route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(
      authStatus => {
        this.isLoading = false;
      }
    );
    this.form = new FormGroup({
      'title': new FormControl(null, {
        validators: [
          Validators.required,
          Validators.minLength(3)
        ]
      }),
      'content': new FormControl(null, {
        validators: [
          Validators.required
        ]
      }),
      'doc': new FormControl(null, {
        validators: [
          Validators.required
        ],
        asyncValidators: [mimeType],
      })
    });
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('postId')) {
        this.mode = 'edit';
        this.postId = paramMap.get('postId');
        this.isLoading = true;
        this.postsService.getPost(this.postId)
          .subscribe(postData => {
            this.isLoading = false;
            this.post = {
              id: postData._id,
              title: postData.title,
              content: postData.content,
              docPath: postData.docPath,
              creator: postData.creator,
              summary: '',
            };
            this.form.setValue({
              'title': this.post.title,
              'content': this.post.content,
              'doc': this.post.docPath
            });
          });
      } else {
        this.mode = 'create';
        this.postId = null;
      }
    });
  }

  onDocPicked(event: Event){
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({doc: file});
    this.form.get('doc').updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      this.docPreview = reader.result as string;
    }
    reader.readAsDataURL(file);
  }

  onSavePost() {
    let summary = '';
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    if (this.mode === "create") {
      this.postsService.addPost(this.form.value.title, this.form.value.content, this.form.value.doc, summary);
    } else {
      this.postsService.updatePost(
        this.postId,
        this.form.value.title,
        this.form.value.content,
        this.form.value.doc,
        summary
      );
    }
    this.form.reset();
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
