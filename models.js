"use strict";

const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({ content: "string" });

const postSchema = mongoose.Schema({
  title: "string",
  content: "string",
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Author" },
  comments: [commentSchema]
});

postSchema.pre("findOne", function(next) {
  this.populate("author");
  next();
});

const authorSchema = mongoose.Schema({
  firstName: "string",
  lastName: "string",
  userName: {
    type: "string",
    unique: true
  }
});

postSchema.virtual("authorString").get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

postSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorString,
    created: this.created
  };
};

const Post = mongoose.model("Post", postSchema);
const Author = mongoose.model("Author", authorSchema);

module.exports = { Post };
