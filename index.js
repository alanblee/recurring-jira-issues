require("dotenv").config();
const { Reshuffle, CronConnector } = require("reshuffle");
const { JiraConnector } = require("reshuffle-jira-connector");

(async () => {
  const app = new Reshuffle();
  // Cron config
  const cronConnector = new CronConnector(app);
  // Jira Config
  const jira = new JiraConnector(app, {
    host: process.env.JIRA_HOST,
    protocol: process.env.JIRA_PROTOCOL,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_TOKEN,
    baseURL: process.env.RUNTIME_BASE_URL,
  });

  const project = await jira.sdk().getProject("LEELEE");
  const { id: projectId, issueTypeId = project.issueTypes[0].id } = project;

  let latestIssueId;
  const checkIssues = async (id = "") => {
    const boardIssues = await jira.sdk().getIssuesForBoard(1);
    for (const issue of boardIssues.issues) {
      const { fields } = issue;
      if (
        fields.summary.includes("Recurring Issue") &&
        fields.status.name !== "Done"
      ) {
        return true;
      } else {
        continue;
      }
    }
    return false;
  };

  cronConnector.on({ expression: "1 * * * * *" }, async (event, app) => {
    const foundIssue = await checkIssues(latestIssueId);
    if (!foundIssue) {
      const newIssue = {
        fields: {
          project: { id: projectId },
          issuetype: { id: issueTypeId },
          summary: "Recurring Issue",
          description: "Recurring Issue - Every 1 minute",
        },
      };
      const issue = await jira.sdk().addNewIssue(newIssue);
      latestId = issue.id;
      console.log("Issue created");
    } else {
      console.log("Issue already exists");
    }
  });
  app.start(8000);
})().catch(console.error);
