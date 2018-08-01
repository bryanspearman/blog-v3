"use strict";

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
mongoose.Promise = global.Promise;
const { PORT, DATABASE_URL } = require("./config");
const { Post, Author } = require("./models");
const app = express();
app.use(express.json());
app.use(morgan("common"));

app.get("/posts", (req, res) => {
  Post.find()
    .limit(10)
    .then(posts => {
      res.json({
        posts: posts.map(post => post.serialize())
      });
    })
    .catch(err => {
      console.error(err);
      res
        .status(500)
        .json({ message: "Internal server error - unable to get any posts" });
    });
});

app.get("/posts/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      res.json({
        id: post._id,
        author: post.authorName,
        content: post.content,
        title: post.title,
        comments: post.comments
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "something went horribly awry" });
    });
});

app.post("/posts", (req, res) => {
  const requiredFields = ["title", "content", "author"];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  //author validation
  Author.findById(req.body.author)
    .then(author => {
      if (author) {
        Post.create({
          title: req.body.title,
          content: req.body.content,
          author: author
        })
          .then(Post =>
            res.status(201).json({
              id: Post.id,
              title: Post.title,
              content: Post.content,
              author: `${author.firstName} ${author.lastName}`,
              comments: Post.comments
            })
          )
          .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Something went wrong" });
          });
      } else {
        const message = `Author not found`;
        console.error(message);
        return res.status(400).send(message);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "something went horribly awry" });
    });
});

app.put("/posts/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }
  const toUpdate = {};
  const updateableFields = ["title", "content"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Post.findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.delete("/posts/:id", (req, res) => {
  Post.findByIdAndRemove(req.params.id)
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

//Author endpoints
app.get("/authors", (req, res) => {
  Author.find()
    .then(authors => {
      res.json(
        authors.map(author => {
          return {
            id: author._id,
            name: `${author.firstName} ${author.lastName}`,
            userName: author.userName
          };
        })
      );
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "something went terribly wrong" });
    });
});

app.post("/authors", (req, res) => {
  const requiredFields = ["firstName", "lastName", "userName"];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  Author.findOne({ userName: req.body.userName })
    .then(author => {
      if (author) {
        const message = `Username already taken`;
        console.error(message);
        return res.status(400).send(message);
      } else {
        Author.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          userName: req.body.userName
        })
          .then(author =>
            res.status(201).json({
              _id: author.id,
              name: `${author.firstName} ${author.lastName}`,
              userName: author.userName
            })
          )
          .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Something went wrong" });
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "something went horribly awry" });
    });
});

app.put("/authors/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: "Request path id and request body id values must match"
    });
  }

  const updated = {};
  const updateableFields = ["firstName", "lastName", "userName"];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  Author.findOne({
    userName: updated.userName || "",
    _id: { $ne: req.params.id }
  }).then(author => {
    if (author) {
      const message = `Username already taken`;
      console.error(message);
      return res.status(400).send(message);
    } else {
      Author.findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
        .then(updatedAuthor => {
          res.status(200).json({
            id: updatedAuthor.id,
            name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
            userName: updatedAuthor.userName
          });
        })
        .catch(err => res.status(500).json({ message: err }));
    }
  });
});

app.delete("/authors/:id", (req, res) => {
  Post.remove({ author: req.params.id })
    .then(() => {
      Author.findByIdAndRemove(req.params.id).then(() => {
        console.log(
          `Deleted blog posts owned by and author with id \`${req.params.id}\``
        );
        res.status(204).json({ message: "success" });
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "something went terribly wrong" });
    });
});

// catch-all endpoint if client makes request to non-existent endpoint
app.use("*", function(req, res) {
  res.status(404).json({ message: "Not Found" });
});

let server;
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`The app is listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but I also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
