"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const authorSchema = mongoose.Schema({
  firstName: "string",
  lastName: "string",
  userName: {
    type: "string",
    unique: true
  }
});

const commentSchema = mongoose.Schema({ content: "string" });

const postSchema = mongoose.Schema({
  title: "string",
  content: "string",
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Author" },
  comments: [commentSchema]
});

postSchema.pre("find", function(next) {
  this.populate("author");
  next();
});

postSchema.pre("findOne", function(next) {
  this.populate("author");
  next();
});

postSchema.virtual("authorName").get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

postSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    comments: this.comments
  };
};

const Post = mongoose.model("Post", postSchema);
const Author = mongoose.model("Author", authorSchema);

module.exports = { Post, Author };
