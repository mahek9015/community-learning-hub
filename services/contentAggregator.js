const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios');
const Content = require('../models/Content');

class ContentAggregator {
  constructor() {
    this.twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
  }

  async fetchTwitterContent() {
    try {
      const tweets = await this.twitterClient.v2.search('education OR learning OR technology', {
        'tweet.fields': ['author_id', 'created_at', 'entities'],
        max_results: 10
      });

      return tweets.data.map(tweet => ({
        title: tweet.text.substring(0, 100),
        description: tweet.text,
        source: 'twitter',
        sourceUrl: `https://twitter.com/user/status/${tweet.id}`,
        author: tweet.author_id,
        createdAt: new Date(tweet.created_at)
      }));
    } catch (error) {
      console.error('Error fetching Twitter content:', error);
      return [];
    }
  }

  async fetchRedditContent() {
    try {
      const response = await axios.get('https://www.reddit.com/r/education+technology+science/hot.json', {
        headers: {
          'User-Agent': 'CommunityLearningHub/1.0'
        }
      });

      return response.data.data.children.map(post => ({
        title: post.data.title,
        description: post.data.selftext,
        source: 'reddit',
        sourceUrl: `https://reddit.com${post.data.permalink}`,
        author: post.data.author,
        createdAt: new Date(post.data.created * 1000)
      }));
    } catch (error) {
      console.error('Error fetching Reddit content:', error);
      return [];
    }
  }

  async fetchLinkedInContent() {
    try {
      // Note: LinkedIn API requires OAuth 2.0 authentication
      // This is a placeholder for the actual implementation
      return [];
    } catch (error) {
      console.error('Error fetching LinkedIn content:', error);
      return [];
    }
  }

  async aggregateAndSaveContent() {
    try {
      const [twitterContent, redditContent, linkedInContent] = await Promise.all([
        this.fetchTwitterContent(),
        this.fetchRedditContent(),
        this.fetchLinkedInContent()
      ]);

      const allContent = [...twitterContent, ...redditContent, ...linkedInContent];

      // Save new content to database
      for (const content of allContent) {
        const existingContent = await Content.findOne({
          source: content.source,
          sourceUrl: content.sourceUrl
        });

        if (!existingContent) {
          await Content.create({
            ...content,
            category: 'education', // Default category
            isPremium: Math.random() < 0.2, // 20% chance of being premium
            creditPoints: Math.floor(Math.random() * 10) + 5 // Random points between 5-15
          });
        }
      }

      return allContent.length;
    } catch (error) {
      console.error('Error aggregating content:', error);
      return 0;
    }
  }
}

module.exports = new ContentAggregator(); 
