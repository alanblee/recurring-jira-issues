require("dotenv").config();
const { Reshuffle, CronConnector } = require("reshuffle");
const { JiraConnector } = require("reshuffle-jira-connector");

(async () => {
  const app = new Reshuffle();
  // Cront config
  const cronConnector = new CronConnector(app);
  // Jira Config
  const jira = new JiraConnector(app, {
    host: process.env.JIRA_HOST,
    protocol: process.env.JIRA_PROTOCOL,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_TOKEN,
    baseURL: process.env.RUNTIME_BASE_URL,
  });

  const checkIssues = async () => {
    const boardIssues = await jira.sdk().getIssuesForBoard(1);
    for (const issue of boardIssues.issues) {
      const { fields } = issue;
      if (fields.summary === "I want this to be recurring") {
        return true;
      }
    }
    return false;
  };

  cronConnector.on({ expression: "1 * * * * *" }, async (event, app) => {
    // look for the issue summary, keep note of it if its there.
    // if not, create new issue with same summary and keep note of its id
    // get all the issues from the board
    const found = await checkIssues();
    if (found) {
      console.log("found it");
    } else {
      console.log("nothing here create new issue");
    }
  });
  app.start(8000);
})().catch(console.error);
