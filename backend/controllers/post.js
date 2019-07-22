const Post = require('../models/post');

exports.postCreate = (req, res) => {
  const url = req.protocol + '://' + req.get('host');
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imagePath: url + '/images/' + req.file.filename,
    creator: req.userData.userId
  });
  post.save()
    .then(result => {
      res.status(201).json({
        message: 'Post added successfully',
        post: {
          ...result,
          id: result._id
          // title: result.title,  // using spread instead
          // imagePath: result.imagePath
        }
      });
    })
    .catch(error => {
      res.status(500).json({
        message: 'Creating a post failed',
        error: error
      });
    });
};

exports.postEdit = (req, res) => {
  let imagePath = req.body.imagePath;
  if (req.file) {
    const url = req.protocol + '://' + req.get('host');
    imagePath = url + '/images/' + req.file.filename;
  }
  const post = new Post({
    _id: req.body.id,
    title: req.body.title,
    content: req.body.content,
    imagePath: imagePath,
    creator: req.userData.userId
  });
  Post.updateOne({ _id: req.params.id, creator: req.userData.userId }, post)
    .then(result => {
      if (result.n > 0) {
        res.status(200).json({ message: result.nModified + ' Document updated successful' });
      } else {
        res.status(401).json({ message: 'Not authorized' });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Could not update post',
        error: error
      });
    });
};

exports.postGet = (req, res) => {
  //console.log(req.query);
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = Post.find();
  let fetchPosts;
  if  (pageSize && currentPage) {
    postQuery
      .skip(pageSize * (currentPage - 1))
      .limit(pageSize);
  }
  postQuery
    .then(documents => {
      fetchPosts = documents;
      return Post.count();
    })
    .then(count => {
      res.status(200).json({
        message: 'Posts fetched successfully',
        posts: fetchPosts,
        maxPosts: count
      });
    })
    .catch(error => {
      res.status(500).json({
        message: 'Could not fetch posts',
        error: error
      });
    });
};

exports.postGetOne = (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json({message: 'Post not found'});
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Could not fetch post',
        error: error
      });
    });
};

exports.postDelete = (req, res) => {
  Post.deleteOne({ _id: req.params.id, creator: req.userData.userId})
    .then(result => {
      if (result.deletedCount > 0) {
        res.status(200).json({ message: 'Post deleted' });
      } else {
        res.status(401).json({ message: 'Not authorized' });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Could not delete post',
        error: error
      });
    });
};

