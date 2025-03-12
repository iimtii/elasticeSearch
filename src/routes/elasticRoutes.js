const express = require('express');
const router = express.Router();
const client = require('../config/elasticConfig');

router.get('/ping', async (_req, res) => {
    try {
        const result = await client.ping();
        res.json({ status: 'Elasticsearch is running', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/create-index', async (req, res) => {
    try {
        const { indexName } = req.body;
        if (!indexName) {
            return res.status(400).json({ error: 'Index name is required' });
        }

        const exists = await client.indices.exists({ index: indexName });
        if (exists.body) {
            return res.status(400).json({ error: `Index "${indexName}" already exists` });
        }

        const result = await client.indices.create({
            index: indexName,
            body: {
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0
                },
                mappings: {
                    properties: {
                        title: { type: "text" },
                        body: { type: "text" },
                        tags: { type: "keyword" },
                        published: { type: "boolean" },
                        timestamp: { type: "date" }
                    }
                }
            }
        });
        res.json({ message: `Index "${indexName}" created successfully`, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-post', async (req, res) => {
    try {
        const post = req.body;
        if (!post.title || !post.body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const response = await client.index({
            index: 'blog-posts',
            body: {
                ...post,
                timestamp: new Date().toISOString()
            }
        });

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/search-posts', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const result = await client.search({
            index: 'blog-posts',
            body: {
                query: {
                    match: { body: query }
                }
            }
        });

        res.json(result.body.hits.hits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await client.get({
            index: 'blog-posts',
            id
        });
        res.json(response.body);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { newTitle } = req.body;

        if (!newTitle) {
            return res.status(400).json({ error: 'New title is required' });
        }

        const result = await client.update({
            index: 'blog-posts',
            id: id,
            body: {
                doc: { title: newTitle }
            }
        });

        res.json({ message: 'Post updated successfully', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/delete-post/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await client.delete({
            index: 'blog-posts',
            id: id
        });

        res.json({ message: 'Post deleted successfully', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
