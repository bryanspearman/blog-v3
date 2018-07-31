"use strict";

const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  title: { type: String },
  content: { type: String },
  author: {
    firstName: String,
    lastName: String
  },
  date: Date
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
    date: this.date
  };
};

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };
