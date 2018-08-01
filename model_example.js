app.post("/posts", (req, res) => {
  const requiredFields = ["title", "content", "author_id"];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  Author.findById(req.body.author_id)
    .then(author => {
      if (author) {
        BlogPost.create({
          title: req.body.title,
          content: req.body.content,
          author: req.body.id
        })
          .then(blogPost =>
            res.status(201).json({
              id: blogPost.id,
              author: `${author.firstName} ${author.lastName}`,
              content: blogPost.content,
              title: blogPost.title,
              comments: blogPost.comments
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
