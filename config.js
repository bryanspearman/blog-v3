"use strict";
exports.DATABASE_URL =
    process.env.DATABASE_URL || "mongodb://localhost/blog-v3";
exports.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blog-v3";
exports.PORT = process.env.PORT || 8080;
