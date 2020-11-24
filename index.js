require("dotenv").config();
const { Reshuffle, CronConnector } = require("reshuffle");
const { JiraConnector } = require("reshuffle-jira-connector");

(async () => {
  const app = new Reshuffle();
  // Jira Config
  const jira = new JiraConnector(app, {
    host: process.env.JIRA_HOST,
    protocol: process.env.JIRA_PROTOCOL,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_TOKEN,
    baseURL: process.env.RUNTIME_BASE_URL,
  });

  app.start(8000);
})().catch(console.error);
